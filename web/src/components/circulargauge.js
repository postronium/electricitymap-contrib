const d3 = Object.assign(
  {},
  require('d3-selection'),
  require('d3-transition'),
  require('d3-shape'),
  require('d3-interpolate'),
);

const IMPORT_COLOR = ['rgb(120, 205, 232)'];  //blue

export default class CircularGauge {
  constructor(selectorId, modeColors, modeOrder, argConfig) {
    const config = argConfig || {};

    this.radius = config.radius || '32';
    this.lineWidth = config.lineWidth || '6';
    this.fontSize = config.fontSize || '1rem';
    //this.modeColors = config.modeColors || ['rgb(120, 205, 232)'];  //blue
    this.MODE_COLORS = modeColors;
    this.MODE_ORDER = modeOrder.slice();

    this.arc = d3.arc()
      .startAngle(0)
      .innerRadius(this.radius - this.lineWidth)
      .outerRadius(this.radius);

    this.prevPercentages = this.MODE_ORDER.map(c => 0);

    this.percentages = config.percentage != undefined ? [config.percentage] : null;

    // main gauge component

    const gauge = d3.select(`#${selectorId}`).append('svg')
      .attr('width', this.radius * 2)
      .attr('height', this.radius * 2)
      // .attr("width", '100%') // makes gauge auto-resize
      // .attr("height", '100%') // makes gauge auto-resize
    // .attr("viewBox", "0 0 " + (this.radius * 2) + " " + (this.radius * 2)) // makes resizable
    // .attr("preserveAspectRatio", "xMidYMid meet") // makes gauge resizable
      .append('g')
      .attr('transform', `translate(${this.radius},${this.radius})`)
      .append('g')
      .attr('class', 'circular-gauge');

    // background
    this.background = gauge.append('path')
      .attr('class', 'background')
      .attr('d', this.arc.endAngle(2 * Math.PI));

    this.foregroundLayers = this.MODE_ORDER.map(mode => {
        return gauge.append('path')
          .attr('fill', this.MODE_COLORS[mode])
          .attr('d', this.arc.endAngle(0));
    });

    this.foregroundLayers.push(
      gauge.append('path')
        .attr('fill', IMPORT_COLOR)
        .attr('d', this.arc.endAngle(0)));

    const percentageSum = this.percentages != null ? this.percentages.reduce((p, sum) => sum+p) : 0;

    this.percentageText = gauge.append('text')
      .style('text-anchor', 'middle')
      .attr('dy', '0.4em')
      .style('font-weight', 'bold')
      .style('font-size', this.fontSize)
      .text(percentageSum != 0 ? `${Math.round(percentageSum)}%` : '?');

    this.draw();
  }

  draw() {
    const arc = this.arc;
    const prevPercentages = this.prevPercentages != null ? this.prevPercentages.map(p => p/100) : this.MODE_ORDER.map(c => 0);
    const percentages = this.percentages != null ? this.percentages.map(p => p/100) : this.MODE_ORDER.map(c => 0);

    //this is to make the next arc start where the previous arc ends
    var getArcEnd = function(prevPercent, i, percentages) {
        var sum = 0;
        for (var j = i; j >= 0; j--) sum += percentages[j];
        return sum;
    }
    const previousArcEnds = prevPercentages.map(getArcEnd);
    const nextArcEnds = percentages.map(getArcEnd);
    for (var i = 1; i < percentages.length; i++) {
      const interpolStart = d3.interpolate(previousArcEnds[i-1] * 2 * Math.PI, 2 * Math.PI * nextArcEnds[i-1]);
      const interpolEnd = d3.interpolate(previousArcEnds[i] * 2 * Math.PI, 2 * Math.PI * (nextArcEnds[i]));

      this.foregroundLayers[i].transition()
        .duration(500)
        .attrTween(
          'd',
          () => {
            return (t) => {
              arc.startAngle(interpolStart(t))();
              return arc.endAngle(interpolEnd(t))();
            }
          }
        );
    };

    const intpolEnd = d3.interpolate(previousArcEnds[0] * 2 * Math.PI, 2 * Math.PI * nextArcEnds[0]);
    this.foregroundLayers[0].transition()
      .duration(500)
      .attrTween(
        'd',
        () => {
            return (t) => {
                arc.startAngle(0)();
                return arc.endAngle(intpolEnd(t))();
            }
        }
      );
  }
  setPercentage(percentages) {
    if (this.percentages === percentages) {
      return;
    }
    if (percentages == null || percentages.length == 0 || !percentages.reduce((acc, p) => acc && !Number.isNaN(p), true)) {
      return;
    }
    this.prevPercentages = this.percentages;
    this.percentages = percentages;
    if (this.percentages != null) {
      const percentageSum = this.percentages.reduce((p, sum) => sum+p, 0);
      this.percentageText.text(`${Math.round(percentageSum)}%`);
    } else {
      this.percentageText.text('?');
    }
    this.draw();
  }
}
