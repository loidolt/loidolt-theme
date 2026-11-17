// swift-tools-version: 5.9
import PackageDescription

// The native half of @loidolt/theme-capacitor. `cap sync` finds it through the `capacitor` field in
// package.json and adds it to the app's Swift package. It uses UIKit API from the iOS 27.1 SDK,
// so it needs Xcode 27.1 or later to build; on older iOS it reports nothing at runtime.
let package = Package(
    name: "LoidoltThemeCapacitor",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "LoidoltThemeCapacitor",
            targets: ["DeviceLayoutPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0")
    ],
    targets: [
        .target(
            name: "DeviceLayoutPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/DeviceLayoutPlugin")
    ]
)
