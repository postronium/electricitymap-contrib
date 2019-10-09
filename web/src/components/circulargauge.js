const d3 = Object.assign(
  {},
  require('d3-selection'),
  require('d3-transition'),
  require('d3-shape'),
  require('d3-interpolate'),
);

export default class CircularGauge {
  constructor(selectorId, argConfig) {
    const config = argConfig || {};

    this.radius = config.radius || '32';
    this.lineWidth = config.lineWidth || '6';
    this.fontSize = config.fontSize || '1rem';
    this.colors = config.colors || ['rgb(255,0,0)', 'rgb(0,255,0)', 'rgb(0,0,255)'];

    this.arc = d3.arc()
      .startAngle(0)
      .innerRadius(this.radius - this.lineWidth)
      .outerRadius(this.radius);

    this.prevPercentages = [0, 0, 0];

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

    // foreground
    this.foreground = gauge.append('path')
      .attr('class', 'foreground')
      .attr('d', this.arc.endAngle(0)); // starts filling from 0

    this.foregroundLayers = this.colors.map(color => {
        return gauge.append('path')
            .attr('fill', color)
            .attr('d', this.arc.endAngle(0));
    });


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
    const prevPercentages = this.prevPercentages != null ? this.prevPercentages.map(p => p/100) : this.colors.map(c => 0);
    const percentages = this.percentages != null ? this.percentages.map(p => p/100) : this.colors.map(c => 0);


    for (var i = 0; i < percentages.length; i++) {
        const interpol = d3.interpolate(prevPercentages[i] * 2 * Math.PI, 2 * Math.PI * (percentages[i]));

        this.foregroundLayers[i].transition()
          .duration(500)
          .attrTween(
            'd',
            () => t => arc.endAngle(interpol(t))(),
          );
    };
  }

  setPercentage(percentages) {
    if (this.percentages === percentages) {
      return;
    }
    if (percentages == null || !percentages.reduce((acc, p) => acc && !Number.isNaN(p), true)) {
      return;
    }
    this.prevPercentages = this.percentages;
    this.percentages = percentages;
    if (this.percentages != null) {
        const percentageSum = this.percentages.reduce((p, sum) => sum+p);
        this.percentageText.text(`${Math.round(percentageSum)}%`);
    } else {
        this.percentageText.text('?');
    }
    this.draw();
  }
}
