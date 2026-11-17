import Capacitor
import UIKit

/// Tells the web view where iOS puts its vertical bar and which parts of the display are reserved,
/// so a page drawing its own bars can follow the system's layout on iPhone Duo.
///
/// A web page can't read these: `env(safe-area-inset-*)` says how far content stays from each
/// edge, but not that the system has moved bars to the side, nor where the fold is when the
/// device is partly open. This reads them natively and sends them to the page as one `change`
/// event, and on request through `getLayout()`.
///
/// Everything is in the web view's coordinate space, which is CSS pixels in a page with
/// `width=device-width` and no zoom. On iOS before 27.1 the page gets no edge and no regions.
@objc(DeviceLayoutPlugin)
public class DeviceLayoutPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DeviceLayoutPlugin"
    public let jsName = "DeviceLayout"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getLayout", returnType: CAPPluginReturnPromise)
    ]

    private var observer: LayoutObserverView?
    private var hingeStatus: String?
    private var hingeAngle: Double?
    private var lastLayout: JSObject?
    private var publishScheduled = false
    private var settleGeneration = 0

    override public func load() {
        Task { @MainActor [weak self] in self?.install() }
    }

    @objc func getLayout(_ call: CAPPluginCall) {
        Task { @MainActor [weak self] in
            guard let self else { return call.resolve(DeviceLayoutPlugin.emptyLayout) }
            call.resolve(self.currentLayout())
        }
    }

    /// Adds an invisible view to the web view, sized with it, that reports every change the layout
    /// depends on: size, safe area, the vertical bar's traits and the hinge. It goes inside the web
    /// view because at load the web view isn't in its view controller's hierarchy yet.
    @MainActor
    private func install() {
        guard observer == nil, let webView = bridge?.webView else { return }
        let view = LayoutObserverView(frame: webView.bounds)
        view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.isUserInteractionEnabled = false
        view.isAccessibilityElement = false
        view.backgroundColor = .clear
        view.onChange = { [weak self] in self?.layoutChanged() }
        webView.insertSubview(view, at: 0)
        observer = view

        if #available(iOS 27.1, *) {
            view.registerForTraitChanges(UITraitCollection.systemTraitsAffectingVerticalBarEdge) {
                (observed: LayoutObserverView, _: UITraitCollection) in
                observed.onChange?()
            }
            // Opening the device part-way adds the fold without changing the view's size, so the
            // hinge is what tells us to look again.
            view.addInteraction(UIHingeInteraction { [weak self] _, update in
                guard let self else { return }
                if let hinge = update.hinge {
                    self.hingeStatus = DeviceLayoutPlugin.name(of: hinge.status)
                    // UIKit reports radians; degrees read more naturally in a page.
                    self.hingeAngle = Double(hinge.angle) * 180 / .pi
                } else {
                    self.hingeStatus = nil
                    self.hingeAngle = nil
                }
                self.layoutChanged()
            })
        }
        schedulePublish()
    }

    /// Something the layout depends on changed: report it, and look again as it settles.
    @MainActor
    private func layoutChanged() {
        schedulePublish()
        scheduleSettleChecks()
    }

    /// UIKit moves the reserved regions a moment after the change that moves them, with nothing to
    /// say so: after a rotation the web view is laid out at its new size about a second before the
    /// camera's region turns with it, so the page would keep the old orientation's region. Look
    /// again a few times after each change; a newer change starts over, and `schedulePublish` sends
    /// nothing when the layout is the same.
    @MainActor
    private func scheduleSettleChecks() {
        settleGeneration &+= 1
        let generation = settleGeneration
        Task { @MainActor [weak self] in
            for milliseconds: UInt64 in [500, 500, 1_000] {
                try? await Task.sleep(nanoseconds: milliseconds * 1_000_000)
                guard let self, self.settleGeneration == generation else { return }
                self.schedulePublish()
            }
        }
    }

    /// Several changes arrive together when the device folds; send one event after them.
    @MainActor
    private func schedulePublish() {
        guard !publishScheduled else { return }
        publishScheduled = true
        Task { @MainActor [weak self] in
            guard let self else { return }
            self.publishScheduled = false
            let layout = self.currentLayout()
            if let last = self.lastLayout, NSDictionary(dictionary: last).isEqual(to: layout) { return }
            self.lastLayout = layout
            self.notifyListeners("change", data: layout, retainUntilConsumed: true)
        }
    }

    @MainActor
    private func currentLayout() -> JSObject {
        guard let webView = bridge?.webView else { return DeviceLayoutPlugin.emptyLayout }
        var layout: JSObject = [
            "width": Double(webView.bounds.width),
            "height": Double(webView.bounds.height),
            "regions": [JSValue]()
        ]
        if #available(iOS 27.1, *) {
            if let edge = DeviceLayoutPlugin.side(of: webView.traitCollection.verticalBarEdge,
                                                  in: webView.effectiveUserInterfaceLayoutDirection) {
                layout["barEdge"] = edge
            }
            let kinds: [(String, UIView.ReservedRegion.Kind)] = [
                ("occlusion", .occlusion), ("division", .division)
            ]
            var regions = [JSValue]()
            for (name, kind) in kinds {
                for region in webView.reservedRegions(kind: kind) {
                    var entry = DeviceLayoutPlugin.rect(region.frame)
                    entry["kind"] = name
                    entry["margins"] = [
                        "top": Double(region.margins.top),
                        "right": Double(region.margins.right),
                        "bottom": Double(region.margins.bottom),
                        "left": Double(region.margins.left)
                    ] as JSObject
                    regions.append(entry)
                }
            }
            layout["regions"] = regions
            if let hingeStatus { layout["hinge"] = ["status": hingeStatus, "angle": hingeAngle ?? 0] as JSObject }
        }
        return layout
    }

    private static let emptyLayout: JSObject = ["width": 0, "height": 0, "regions": [JSValue]()]

    private static func rect(_ rect: CGRect) -> JSObject {
        [
            "x": Double(rect.minX),
            "y": Double(rect.minY),
            "width": Double(rect.width),
            "height": Double(rect.height)
        ]
    }

    /// The edge as a physical side. The system keeps the bar beside the hardware, so a page lays
    /// it out with `left` and `right`, not with the writing direction.
    @available(iOS 27.1, *)
    private static func side(of edge: UIVerticalBarEdge,
                             in direction: UIUserInterfaceLayoutDirection) -> String? {
        switch edge {
        case .leading: return direction == .rightToLeft ? "right" : "left"
        case .trailing: return direction == .rightToLeft ? "left" : "right"
        default: return nil
        }
    }

    @available(iOS 27.1, *)
    private static func name(of status: UIHinge.Status) -> String {
        switch status {
        case .closed: return "closed"
        case .partiallyOpen: return "partially-open"
        case .fullyOpen: return "fully-open"
        default: return "unknown"
        }
    }
}

/// Calls `onChange` whenever UIKit lays it out or its safe area moves.
final class LayoutObserverView: UIView {
    var onChange: (@MainActor () -> Void)?

    override func layoutSubviews() {
        super.layoutSubviews()
        onChange?()
    }

    override func safeAreaInsetsDidChange() {
        super.safeAreaInsetsDidChange()
        onChange?()
    }

    override func didMoveToWindow() {
        super.didMoveToWindow()
        onChange?()
    }
}
