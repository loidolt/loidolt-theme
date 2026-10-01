import { describe, expect, it } from 'vitest';
import { chartColors, darkSemantic, semantic } from '@loidolt/theme-tokens';
import {
  applyTheme,
  buildBarOption,
  buildCandlestickOption,
  buildFunnelOption,
  buildGaugeOption,
  buildHeatmapOption,
  buildLineOption,
  buildPieOption,
  buildRadarOption,
  buildSankeyOption,
  buildScatterOption,
  buildTreemapOption,
  candlestickTable,
  categoryTable,
  describeBar,
  describeCandlestick,
  describeCategories,
  describeFunnel,
  describeGauge,
  describeHeatmap,
  describeLine,
  describePie,
  describeRadar,
  describeSankey,
  describeScatter,
  describeTreemap,
  describeTrend,
  extremes,
  formatCompact,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  gaugeTable,
  heatmapTable,
  inkOn,
  linearFit,
  nodeValue,
  radarTable,
  sankeyTable,
  scatterTable,
  seriesColor,
  sliceTable,
  treemapTable,
  withDefaults,
} from '../src/lib/core/index.js';

type Loose = Record<string, any>;

const light = chartColors('light');
const dark = chartColors('dark');
const months = {
  categories: ['Jan', 'Feb', 'Mar'],
  series: [
    { name: 'Cuts', data: [4, 6, 9] },
    { name: 'Scrap', data: [3, null, 1], color: '#123456' },
  ],
};

describe('formatting', () => {
  it('formats numbers in a given locale and leaves gaps blank', () => {
    expect(formatNumber(1234.5, { locale: 'en-US' })).toBe('1,234.5');
    expect(formatNumber(1234.5, { locale: 'de-DE' })).toBe('1.234,5');
    expect(formatNumber(null)).toBe('');
    expect(formatNumber(Number.NaN)).toBe('');
    expect(formatCompact(12500, { locale: 'en-US' })).toBe('12.5K');
    expect(formatPercent(0.256, { locale: 'en-US' })).toBe('25.6%');
    expect(formatCurrency(1234, 'USD', { locale: 'en-US' })).toBe('$1,234.00');
  });

  it('formats dates, and nothing for an invalid one', () => {
    expect(formatDate('2026-03-04T12:00:00Z', { locale: 'en-US' })).toBe('Mar 4, 2026');
    expect(formatDate(new Date(0), { locale: 'en-US', year: 'numeric', timeZone: 'UTC' })).toBe(
      '1970'
    );
    expect(formatDate('not a date')).toBe('');
  });
});

describe('theming', () => {
  it('fills in only what an option leaves unset', () => {
    expect(withDefaults({ a: 1, b: { c: 2 } }, { a: 9, b: { c: 9, d: 3 }, e: 4 })).toEqual({
      a: 1,
      b: { c: 2, d: 3 },
      e: 4,
    });
  });

  it('themes axes, legend, tooltip, radar, visual map and zoom from the palette', () => {
    const themed = applyTheme(
      {
        xAxis: [{ type: 'category' }, 'not an axis'],
        yAxis: { type: 'value', axisLabel: { color: 'red' } },
        legend: {},
        tooltip: {},
        radar: {},
        visualMap: {},
        dataZoom: [{}],
      },
      dark
    ) as Loose;
    expect(themed.color).toEqual(dark.categorical);
    expect(themed.xAxis[0].axisLine.lineStyle.color).toBe(darkSemantic.border);
    expect(themed.xAxis[1]).toBe('not an axis');
    expect(themed.yAxis.axisLabel.color).toBe('red');
    expect(themed.legend.textStyle.color).toBe(darkSemantic.text);
    expect(themed.tooltip.className).toBe('ldt-chart-tooltip');
    expect(themed.tooltip.extraCssText).toContain('background-color: var(--loidolt-surface)');
    expect(themed.radar.splitLine.lineStyle.color).toBe(darkSemantic.borderSoft);
    expect(themed.visualMap.inRange.color).toEqual(dark.sequential);
    expect(themed.dataZoom[0].borderColor).toBe(darkSemantic.border);
    expect(themed.dataZoom[0].moveHandleStyle.color).toBe(darkSemantic.border);
    expect(themed.animation).toBe(true);
    expect(themed.aria).toEqual({
      enabled: false,
      label: { enabled: false },
      decal: { show: false },
    });
  });

  it('forces animation off and decals on when asked, and defaults to the light palette', () => {
    const themed = applyTheme({ animation: true }, undefined, { animation: false, decal: true });
    expect(themed.animation).toBe(false);
    expect(themed.color).toEqual(light.categorical);
    expect(themed.aria).toMatchObject({ enabled: true, decal: { show: true } });
  });

  it('wraps the palette and picks readable ink', () => {
    expect(seriesColor(light, 9)).toBe(light.categorical[1]);
    expect(inkOn(semantic.chart1, light)).toBe(semantic.surface);
    expect(inkOn('#f5f2e9', light)).toBe(semantic.text);
    expect(inkOn('rebeccapurple', light)).toBe(semantic.text);
  });
});

describe('descriptions', () => {
  it('reads trends and extremes', () => {
    expect(describeTrend([1, 5])).toBe('rises');
    expect(describeTrend([5, 1])).toBe('falls');
    expect(describeTrend([100, 101])).toBe('holds steady');
    expect(describeTrend([3])).toBe('holds steady');
    expect(extremes([2, null, 8], ['a', 'b', 'c'])).toEqual({
      high: { label: 'c', value: 8 },
      low: { label: 'a', value: 2 },
    });
    expect(extremes([null], [])).toBeNull();
    expect(extremes([1], [])).toEqual({
      high: { label: '1', value: 1 },
      low: { label: '1', value: 1 },
    });
  });

  it('summarises category charts, capping the series it names', () => {
    expect(describeLine(months)).toBe(
      'Line chart of 2 series over 3 categories, Jan to Mar. Cuts rises, from a low of 4 in Jan to a high of 9 in Mar; Scrap falls, from a low of 1 in Mar to a high of 3 in Jan.'
    );
    expect(describeBar({ categories: [], series: [] })).toBe('Empty bar chart.');
    const many = {
      categories: ['a'],
      series: Array.from({ length: 6 }, (_, index) => ({ name: `S${index}`, data: [null] })),
    };
    expect(describeCategories(many)).toContain('S0 has no values');
    expect(describeCategories(many)).toContain('2 more series in the data table.');
  });

  it('summarises parts of a whole', () => {
    const parts = [
      { name: 'A', value: 40 },
      { name: 'B', value: 30 },
      { name: 'C', value: 20 },
      { name: 'D', value: 10 },
    ];
    expect(describePie(parts)).toBe(
      'Pie chart of 4 parts totalling 100. Largest: A 40 (40%), B 30 (30%) and C 20 (20%).'
    );
    expect(describePie([])).toBe('Empty pie chart.');
    expect(describePie([{ name: 'Only', value: 0 }])).toBe(
      'Pie chart of 1 part totalling 0. Largest: Only 0 (0%).'
    );
    expect(describeFunnel(parts)).toBe(
      'Funnel chart of 4 stages, from A (40) to D (10): 25% carried through.'
    );
    expect(describeFunnel([])).toBe('Empty funnel chart.');
    expect(describeFunnel([{ name: 'Z', value: 0 }])).toContain('0% carried');
  });
});

describe('category charts', () => {
  it('builds lines with the palette, gaps and optional areas', () => {
    const option = buildLineOption(months, { area: true, smooth: true }, light) as Loose;
    expect(option.legend).toMatchObject({ type: 'scroll' });
    expect(option.xAxis).toMatchObject({
      type: 'category',
      data: months.categories,
      boundaryGap: false,
    });
    expect(option.series[0]).toMatchObject({
      type: 'line',
      smooth: true,
      showSymbol: true,
      lineStyle: { color: light.categorical[0] },
      areaStyle: { opacity: 0.16 },
    });
    expect(option.series[1].itemStyle.color).toBe('#123456');
    expect(option.series[1].data).toEqual([3, null, 1]);
    expect(option.yAxis.axisLabel.formatter(1500)).toBe('1,500');
    expect(option.tooltip.valueFormatter(2)).toBe('2');
  });

  it('stacks, hides points on long series and drops the legend for one series', () => {
    const long = {
      categories: Array.from({ length: 20 }, (_, index) => `d${index}`),
      series: [{ name: 'Only', data: Array.from({ length: 20 }, () => 1) }],
    };
    const option = buildLineOption(long, {
      stacked: true,
      area: true,
      showTooltip: false,
    }) as Loose;
    expect(option.legend).toBeUndefined();
    expect(option.tooltip).toBeUndefined();
    expect(option.series[0]).toMatchObject({
      stack: 'total',
      showSymbol: false,
      areaStyle: { opacity: 0.8 },
    });
  });

  it('builds bars either way round, with printed values', () => {
    const vertical = buildBarOption(months, { showValues: true }, light) as Loose;
    expect(vertical.xAxis.type).toBe('category');
    expect(vertical.series[0].label).toMatchObject({
      show: true,
      position: 'top',
      color: light.text,
    });
    expect(vertical.series[0].label.formatter({ value: 1200 })).toBe('1,200');
    expect(vertical.tooltip.axisPointer).toEqual({ type: 'shadow' });

    const horizontal = buildBarOption(
      months,
      { orientation: 'horizontal', stacked: true, showValues: true },
      light
    ) as Loose;
    expect(horizontal.yAxis).toMatchObject({ type: 'category', inverse: true });
    expect(horizontal.series[0].label).toMatchObject({ position: 'inside', color: light.surface });
    expect(
      buildBarOption(months, { orientation: 'horizontal', showValues: true }).series
    ).toMatchObject([{ label: { position: 'right' } }, {}]);
    expect((buildBarOption(months, { showTooltip: false }) as Loose).tooltip).toBeUndefined();
  });

  it('rejects a series that does not fit the categories', () => {
    expect(() =>
      buildLineOption({ categories: ['a', 'b'], series: [{ name: 'X', data: [1] }] })
    ).toThrow(new RangeError('buildLineOption: series "X" has 1 values for 2 categories'));
    expect(() => buildBarOption({ categories: ['a'], series: [{ name: 'X', data: [] }] })).toThrow(
      RangeError
    );
  });

  it('tabulates by category', () => {
    expect(categoryTable(months, 'Month')).toEqual({
      columns: ['Month', 'Cuts', 'Scrap'],
      rows: [
        ['Jan', 4, 3],
        ['Feb', 6, null],
        ['Mar', 9, 1],
      ],
    });
  });
});

describe('part-to-whole charts', () => {
  const parts = [
    { name: 'Birch', value: 6 },
    { name: 'Cork', value: 2, color: '#f5f2e9' },
  ];

  it('builds pies and donuts with a centre label', () => {
    const pie = buildPieOption(parts, {}, light) as Loose;
    expect(pie.series[0].radius).toEqual(['0%', '70%']);
    expect(pie.title).toBeUndefined();
    expect(pie.series[0].data[0].itemStyle.color).toBe(light.categorical[0]);
    expect(pie.series[0].label.formatter).toBe('{b}');

    const donut = buildPieOption(
      parts,
      {
        innerRadius: 50,
        centerValue: '8',
        centerLabel: 'sheets',
        labelPosition: 'inside',
        showLegend: true,
      },
      light
    ) as Loose;
    expect(donut.series[0].radius).toEqual(['50%', '70%']);
    expect(donut.title).toMatchObject({ text: '8', subtext: 'sheets' });
    expect(donut.legend).toBeDefined();
    expect(donut.series[0].data[0].label.color).toBe(light.surface);
    expect(donut.series[0].data[1].label.color).toBe(light.text);
    expect(
      (buildPieOption(parts, { showLabels: false, showTooltip: false }) as Loose).series[0].label
    ).toEqual({
      show: false,
    });
  });

  it('refuses negative slices and impossible holes', () => {
    expect(() => buildPieOption([{ name: 'Debt', value: -1 }])).toThrow(
      /finite value of 0 or more/
    );
    expect(() => buildPieOption(parts, { innerRadius: 80 })).toThrow(RangeError);
    expect(() => buildFunnelOption([{ name: 'X', value: Number.NaN }])).toThrow(RangeError);
  });

  it('builds funnels', () => {
    const funnel = buildFunnelOption(
      parts,
      { sort: 'none', orientation: 'horizontal' },
      light
    ) as Loose;
    expect(funnel.series[0]).toMatchObject({
      type: 'funnel',
      sort: 'none',
      orient: 'horizontal',
      max: 6,
    });
    expect(
      (buildFunnelOption(parts, { showLabels: false, showTooltip: false }) as Loose).tooltip
    ).toBeUndefined();
  });

  it('tabulates shares', () => {
    expect(sliceTable(parts)).toEqual({
      columns: ['Name', 'Value', 'Share'],
      rows: [
        ['Birch', 6, '75%'],
        ['Cork', 2, '25%'],
      ],
    });
    expect(sliceTable([{ name: 'Zero', value: 0 }], { shareLabel: '%' }).rows[0][2]).toBeNull();
  });
});

describe('scatter', () => {
  const points = [
    {
      name: 'Runs',
      data: [
        [1, 2],
        [2, 4],
        [3, 6],
      ] as Array<[number, number]>,
    },
  ];

  it('fits a line, and none where the fit is undefined', () => {
    expect(linearFit(points[0].data)).toEqual({ slope: 2, intercept: 0 });
    expect(linearFit([[1, 1]])).toBeNull();
    expect(
      linearFit([
        [2, 1],
        [2, 5],
      ])
    ).toBeNull();
  });

  it('adds a dashed trend line per series', () => {
    const option = buildScatterOption(points, { showTrendLine: true }, light) as Loose;
    expect(option.series).toHaveLength(2);
    expect(option.series[1]).toMatchObject({
      type: 'line',
      data: [
        [1, 2],
        [3, 6],
      ],
      lineStyle: { type: 'dashed' },
    });
    expect(option.tooltip.formatter({ seriesName: 'Runs', value: [1000, 2] })).toBe(
      'Runs<br>1,000, 2'
    );
    expect(option.xAxis.axisLabel.formatter(3)).toBe('3');
    const flat = buildScatterOption(
      [
        {
          name: 'Flat',
          data: [
            [1, 1],
            [1, 2],
          ],
        },
      ],
      { showTrendLine: true, showTooltip: false }
    ) as Loose;
    expect(flat.series).toHaveLength(1);
    expect(flat.tooltip).toBeUndefined();
  });

  it('describes and tabulates', () => {
    expect(describeScatter(points)).toBe(
      'Scatter chart of 3 points in 1 series. Runs: 3 points, y rising with x.'
    );
    expect(
      describeScatter([
        {
          name: 'Down',
          data: [
            [1, 3],
            [2, 1],
          ],
        },
      ])
    ).toContain('y falling as x rises');
    expect(describeScatter([{ name: 'One', data: [[1, 3]] }])).toContain('no clear trend');
    expect(describeScatter([])).toBe('Empty scatter chart.');
    expect(scatterTable(points).rows[1]).toEqual(['Runs', 2, 4]);
  });
});

describe('radar', () => {
  const skills = {
    indicators: [{ name: 'Speed' }, { name: 'Finish', max: 10 }],
    series: [{ name: 'Laser', values: [8, 6] }],
  };

  it('scales spokes to the data unless told otherwise', () => {
    const option = buildRadarOption(skills, { shape: 'circle', area: false }, light) as Loose;
    expect(option.radar.shape).toBe('circle');
    expect(option.radar.indicator[0].max).toBeCloseTo(8.8);
    expect(option.radar.indicator[1].max).toBe(10);
    expect(option.series[0].data[0].areaStyle).toBeUndefined();
    expect(option.legend).toBeUndefined();
  });

  it('checks every series covers every spoke', () => {
    expect(() => buildRadarOption({ ...skills, series: [{ name: 'Short', values: [1] }] })).toThrow(
      RangeError
    );
  });

  it('describes and tabulates', () => {
    expect(describeRadar(skills)).toBe(
      'Radar chart comparing 1 series across 2 measures. Laser is strongest in Speed.'
    );
    expect(describeRadar({ indicators: [], series: [] })).toBe('Empty radar chart.');
    expect(radarTable(skills)).toEqual({
      columns: ['Measure', 'Laser'],
      rows: [
        ['Speed', 8],
        ['Finish', 6],
      ],
    });
  });
});

describe('gauge', () => {
  it('fills the dial to the value by default', () => {
    const option = buildGaugeOption({ value: 72 }, { label: 'Utilisation' }, light) as Loose;
    expect(option.series[0]).toMatchObject({ min: 0, max: 100, progress: { show: true } });
    expect(option.series[0].pointer.show).toBe(false);
    expect(option.series[0].title.show).toBe(true);
    expect(option.series[0].detail.formatter(72)).toBe('72');
    expect(
      (buildGaugeOption({ value: 5, min: 0, max: 10 }, { showProgress: false }) as Loose).series[0]
        .pointer.show
    ).toBe(true);
  });

  it('rejects a backwards scale or a missing value', () => {
    expect(() => buildGaugeOption({ value: 1, min: 5, max: 5 })).toThrow(RangeError);
    expect(() => buildGaugeOption({ value: Number.NaN })).toThrow(RangeError);
  });

  it('describes and tabulates', () => {
    expect(describeGauge({ value: 30, min: 20, max: 40 })).toBe(
      'Gauge reading 30 on a scale of 20 to 40 (50%).'
    );
    expect(describeGauge({ value: 30 })).toContain('(30%)');
    expect(gaugeTable({ value: 3 }).rows).toEqual([
      ['Value', 3],
      ['Minimum', 0],
      ['Maximum', 100],
    ]);
  });
});

describe('heatmap', () => {
  const grid = {
    x: ['Mon', 'Tue'],
    y: ['AM', 'PM'],
    values: [
      [0, 0, 1],
      [1, 1, 9],
      [1, 0, null],
    ] as Array<[number, number, number | null]>,
  };

  it('scales colour over the data range on the sequential ramp', () => {
    const option = buildHeatmapOption(grid, { showValues: true }, light) as Loose;
    expect(option.visualMap).toMatchObject({
      min: 0,
      max: 9,
      inRange: { color: light.sequential },
    });
    expect(option.series[0].label.formatter({ value: [0, 0, 1234] })).toBe('1,234');
    expect(option.tooltip.formatter({ value: [1, 1, 9] })).toBe('PM · Tue<br>9');
    const fixed = buildHeatmapOption(grid, {
      min: -5,
      max: 5,
      showScale: false,
      showTooltip: false,
    }) as Loose;
    expect(fixed.visualMap).toMatchObject({ min: -5, max: 5, show: false });
    expect(fixed.tooltip).toBeUndefined();
    expect(fixed.series[0].label).toEqual({ show: false });
  });

  it('refuses cells off the grid', () => {
    expect(() => buildHeatmapOption({ ...grid, values: [[2, 0, 1]] })).toThrow(
      /outside the 2 × 2 grid/
    );
  });

  it('describes and tabulates', () => {
    expect(describeHeatmap(grid)).toBe(
      'Heatmap of 2 rows by 2 columns. Highest 9 at PM · Tue; lowest 1 at AM · Mon.'
    );
    expect(describeHeatmap({ ...grid, values: [] })).toBe('Empty heatmap.');
    expect(heatmapTable(grid, 'Shift')).toEqual({
      columns: ['Shift', 'Mon', 'Tue'],
      rows: [
        ['AM', 1, null],
        ['PM', null, 9],
      ],
    });
  });
});

describe('treemap', () => {
  const tree = [
    {
      name: 'Wood',
      children: [
        { name: 'Birch', value: 5 },
        { name: 'Oak', value: 3 },
      ],
    },
    { name: 'Cork', value: 2, color: '#654321' },
  ];

  it('sums branches and colours the top level', () => {
    expect(nodeValue(tree[0])).toBe(8);
    expect(nodeValue({ name: 'Bare' })).toBe(0);
    const option = buildTreemapOption(
      tree,
      { showBreadcrumb: false, showTooltip: false },
      light
    ) as Loose;
    expect(option.series[0].data[0]).toMatchObject({
      value: 8,
      itemStyle: { color: light.categorical[0] },
    });
    expect(option.series[0].data[0].children[0].itemStyle).toBeUndefined();
    expect(option.series[0].data[1].itemStyle.color).toBe('#654321');
    expect(option.series[0].bottom).toBe(0);
    expect(option.tooltip).toBeUndefined();
    expect(() => buildTreemapOption([{ name: 'Bad', value: -2 }])).toThrow(RangeError);
  });

  it('describes and tabulates paths', () => {
    expect(describeTreemap(tree)).toBe(
      'Treemap of 2 groups totalling 10. Largest: Wood 8 and Cork 2.'
    );
    expect(describeTreemap([])).toBe('Empty treemap.');
    expect(treemapTable(tree).rows).toEqual([
      ['Wood', 8],
      ['Wood › Birch', 5],
      ['Wood › Oak', 3],
      ['Cork', 2],
    ]);
  });
});

describe('candlestick', () => {
  const days = [
    { date: 'Mon', open: 10, close: 12, low: 9, high: 13, volume: 100 },
    { date: 'Tue', open: 12, close: 11, low: 10, high: 12.5, volume: 80 },
  ];

  it('colours rises and falls with the gain and loss tokens', () => {
    const option = buildCandlestickOption(days, { zoom: true }, light) as Loose;
    expect(option.series[0].itemStyle).toEqual({
      color: light.positive,
      color0: light.negative,
      borderColor: light.positive,
      borderColor0: light.negative,
    });
    expect(option.series[1].data.map((bar: Loose) => bar.itemStyle.color)).toEqual([
      light.positive,
      light.negative,
    ]);
    expect(option.grid).toHaveLength(2);
    expect(option.dataZoom).toHaveLength(2);
    expect(option.series[0].data[0]).toEqual([10, 12, 9, 13]);
    expect(option.yAxis[1].axisLabel.formatter(1500)).toBe('1.5K');
  });

  it('drops the volume pane when there is no volume', () => {
    const plain = days.map(({ volume: _volume, ...day }) => day);
    const option = buildCandlestickOption(plain, {
      upColor: '#000000',
      showTooltip: false,
    }) as Loose;
    expect(option.grid).toHaveLength(1);
    expect(option.series).toHaveLength(1);
    expect(option.series[0].itemStyle.color).toBe('#000000');
    expect(option.dataZoom).toBeUndefined();
    expect(candlestickTable(plain).columns).toEqual(['Date', 'Open', 'High', 'Low', 'Close']);
  });

  it('refuses a candle whose range does not hold its body', () => {
    expect(() =>
      buildCandlestickOption([{ date: 'X', open: 5, close: 6, low: 5.5, high: 7 }])
    ).toThrow(RangeError);
  });

  it('describes and tabulates', () => {
    expect(describeCandlestick(days)).toBe(
      'Candlestick chart of 2 periods, Mon to Tue. Opened at 10 and closed at 11 (+10%), trading between 9 and 13.'
    );
    expect(describeCandlestick([{ date: 'X', open: 0, close: 0, low: 0, high: 0 }])).toContain(
      '(+0%)'
    );
    expect(describeCandlestick([{ date: 'X', open: 10, close: 5, low: 5, high: 10 }])).toContain(
      '(-50%)'
    );
    expect(describeCandlestick([])).toBe('Empty candlestick chart.');
    expect(candlestickTable(days).rows[0]).toEqual(['Mon', 10, 13, 9, 12, 100]);
  });
});

describe('sankey', () => {
  const flow = {
    nodes: [{ name: 'Sheet' }, { name: 'Parts' }, { name: 'Scrap', color: '#777777' }],
    links: [
      { source: 'Sheet', target: 'Parts', value: 8 },
      { source: 'Sheet', target: 'Scrap', value: 2 },
    ],
  };

  it('builds flows between known nodes', () => {
    const option = buildSankeyOption(
      flow,
      { orientation: 'vertical', showTooltip: false },
      light
    ) as Loose;
    expect(option.series[0]).toMatchObject({ orient: 'vertical', right: 8, bottom: 32 });
    expect(option.series[0].data[2].itemStyle.color).toBe('#777777');
    expect(option.tooltip).toBeUndefined();
  });

  it('refuses unknown nodes, loops and empty flows', () => {
    expect(() =>
      buildSankeyOption({ ...flow, links: [{ source: 'Sheet', target: 'Ghost', value: 1 }] })
    ).toThrow(/Ghost/);
    expect(() =>
      buildSankeyOption({ ...flow, links: [{ source: 'Sheet', target: 'Sheet', value: 1 }] })
    ).toThrow(/itself/);
    expect(() =>
      buildSankeyOption({ ...flow, links: [{ source: 'Sheet', target: 'Parts', value: 0 }] })
    ).toThrow(/positive/);
  });

  it('describes and tabulates', () => {
    expect(describeSankey(flow)).toBe(
      'Flow diagram of 2 flows between 3 nodes. Largest: Sheet to Parts (8) and Sheet to Scrap (2).'
    );
    expect(describeSankey({ nodes: [], links: [] })).toBe('Empty flow diagram.');
    expect(sankeyTable(flow, { sourceLabel: 'In' }).columns).toEqual(['In', 'To', 'Value']);
  });
});
