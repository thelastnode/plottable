///<reference path="reference.ts" />

class Table extends Component {
  private static CSS_CLASS = "table";
  private rowPadding = 0;
  private colPadding = 0;

  private rows: Component[][];
  private cols: Component[][];
  private nRows: number;
  private nCols: number;
  private rowMinimums: number[];
  private colMinimums: number[];

  private rowWeights: number[];
  private colWeights: number[];

  private rowWeightSum: number;
  private colWeightSum: number;

  constructor(rows: Component[][], rowWeightVal=1, colWeightVal=1) {
    super();
    this.classed(Table.CSS_CLASS, true);
    // Clean out any null components and replace them with base Components
    var cleanOutNulls = (c: Component) => c == null ? new Component() : c;
    rows = rows.map((row: Component[]) => row.map(cleanOutNulls));
    this.rows = rows;
    this.cols = d3.transpose(rows);
    this.nRows = this.rows.length;
    this.nCols = this.cols.length;
    super.rowWeight(rowWeightVal).colWeight(colWeightVal);
  }

  public anchor(element: D3.Selection) {
    super.anchor(element);
    // recursively anchor children
    this.rows.forEach((row: Component[], rowIndex: number) => {
      row.forEach((component: Component, colIndex: number) => {
        component.anchor(this.element.append("g"));
      });
    });
    return this;
  }

  public computeLayout(xOffset?: number, yOffset?: number, availableWidth?: number, availableHeight?: number) {
    super.computeLayout(xOffset, yOffset, availableWidth, availableHeight);

    // calculate the amount of free space by recursive col-/row- Minimum() calls
    var freeWidth = this.availableWidth - this.colMinimum();
    var freeHeight = this.availableHeight - this.rowMinimum();
    if (freeWidth < 0 || freeHeight < 0) {
      throw new Error("InsufficientSpaceError");
    }

    // distribute remaining height to rows
    var rowProportionalSpace = Table.rowProportionalSpace(this.rows, freeHeight);
    var colProportionalSpace = Table.colProportionalSpace(this.cols, freeWidth);

    var sumPair = (p: number[]) => p[0] + p[1];
    var rowHeights = d3.zip(rowProportionalSpace, this.rowMinimums).map(sumPair);
    var colWidths  = d3.zip(colProportionalSpace, this.colMinimums).map(sumPair);

    var childYOffset = 0;
    this.rows.forEach((row: Component[], rowIndex: number) => {
      var childXOffset = 0;
      row.forEach((component: Component, colIndex: number) => {
        // recursively compute layout
        component.computeLayout(childXOffset, childYOffset, colWidths[colIndex], rowHeights[rowIndex]);
        childXOffset += colWidths[colIndex] + this.colPadding;
      });
      childYOffset += rowHeights[rowIndex] + this.rowPadding;
    });
    return this;
  }

  private static rowProportionalSpace(rows: Component[][], freeHeight: number) {
    return Table.calculateProportionalSpace(rows, freeHeight, (c: Component) => c.rowWeight());
  }
  private static colProportionalSpace(cols: Component[][], freeWidth: number) {
    return Table.calculateProportionalSpace(cols, freeWidth, (c: Component) => c.colWeight());
  }
  private static calculateProportionalSpace(componentGroups: Component[][], freeSpace: number, spaceAccessor: (c: Component) => number) {
    var weights = componentGroups.map((group) => d3.max(group, spaceAccessor));
    var weightSum = d3.sum(weights);
    if (weightSum === 0) {
      var numGroups = componentGroups.length;
      return weights.map((w) => freeSpace / numGroups);
    } else {
      return weights.map((w) => freeSpace * w / weightSum);
    }
  }

  public render() {
    // recursively render children
    this.rows.forEach((row: Component[], rowIndex: number) => {
      row.forEach((component: Component, colIndex: number) => {
        component.render();
      });
    });
    return this;
  }

  /* Getters */
  public rowMinimum(): number;
  public rowMinimum(newVal: number): Component;
  public rowMinimum(newVal?: number): any {
    if (newVal != null) {
      throw new Error("Row minimum cannot be directly set on Table");
    } else {
      this.rowMinimums = this.rows.map((row: Component[]) => d3.max(row, (r: Component) => r.rowMinimum()));
      return d3.sum(this.rowMinimums) + this.rowPadding * (this.rows.length - 1);
    }
  }

  public colMinimum(): number;
  public colMinimum(newVal: number): Component;
  public colMinimum(newVal?: number): any {
    if (newVal != null) {
      throw new Error("Col minimum cannot be directly set on Table");
    } else {
      this.colMinimums = this.cols.map((col: Component[]) => d3.max(col, (r: Component) => r.colMinimum()));
      return d3.sum(this.colMinimums) + this.colPadding * (this.cols.length - 1);
    }
  }

  public padding(rowPadding: number, colPadding: number) {
    this.rowPadding = rowPadding;
    this.colPadding = colPadding;
    return this;
  }
}