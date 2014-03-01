///<reference path="reference.ts" />

class Legend extends Component {
  private static CSS_CLASS = "legend";
  private static SUBELEMENT_CLASS = "legend-row";
  private static MARGIN = 5;

  private colorScale: ColorScale;
  private maxWidth: number;

  constructor(colorScale?: ColorScale) {
    super();
    this.classed(Legend.CSS_CLASS, true);
    this.colMinimum(120); // the default width
    this.colorScale = colorScale;
    this.xAlign("RIGHT").yAlign("TOP");
    this.xOffset(5).yOffset(5);
  }

  public scale(scale: ColorScale): Legend {
    this.colorScale = scale;
    return this;
  }

  public rowMinimum(): number;
  public rowMinimum(newVal: number): Legend;
  public rowMinimum(newVal?: number): any {
    if (newVal != null) {
      throw new Error("Row minimum cannot be directly set on Legend");
    } else {
      var textHeight = this.measureTextHeight();
      return this.colorScale.domain().length * textHeight;
    }
  }

  private measureTextHeight(): number {
    // note: can't be called before anchoring atm
    var fakeLegendEl = this.element.append("g").classed(Legend.SUBELEMENT_CLASS, true);
    var textHeight = Utils.getTextHeight(fakeLegendEl.append("text"));
    fakeLegendEl.remove();
    return textHeight;
  }

  public render(): Legend {
    super.render();
    var domain = this.colorScale.domain();
    var textHeight = this.measureTextHeight();
    var availableWidth = this.colMinimum() - textHeight - Legend.MARGIN;

    this.element.selectAll("." + Legend.SUBELEMENT_CLASS).remove(); // hackhack to ensure it always rerenders properly
    var legend: D3.UpdateSelection = this.element.selectAll("." + Legend.SUBELEMENT_CLASS).data(domain);
    var legendEnter = legend.enter()
        .append("g").classed(Legend.SUBELEMENT_CLASS, true)
        .attr("transform", (d, i) => "translate(0," + i * textHeight + ")");
    legendEnter.append("rect")
        .attr("x", Legend.MARGIN)
        .attr("y", Legend.MARGIN)
        .attr("width",  textHeight - Legend.MARGIN * 2)
        .attr("height", textHeight - Legend.MARGIN * 2);
    legendEnter.append("text")
        .attr("x", textHeight)
        .attr("y", Legend.MARGIN + textHeight / 2);
    legend.selectAll("rect").attr("fill", this.colorScale.scale);
    legend.selectAll("text").text(function(d, i) {return Utils.truncateTextToLength(d, availableWidth, d3.select(this));});
    return this;
  }
}