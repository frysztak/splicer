import {IPoint} from "./point";
import {Segment} from "./segment";

export interface IState {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    config: IConfig;
    x: number[];
    y: number[];
    maxY: number;
    xScale: number,
    xOffset: number;
    yScale: number,
    yOffset: number;
    plotWidth: number;
    plotHeight: number;
    points: IPoint[];
    pointIdxBeingDragged: number;
    pointIdxHoveredOn: number;
    segments: Segment[];
    segmentsElement: HTMLPreElement;
    tension: number;
    contextMenuVisible: boolean;
    contextMenu: HTMLElement;
    contextMenuPointIdx: number;
    contextMenuPoint: IPoint;
}

export interface IConfig {
    margin: number;
    arrowOffset: number;
    arrowLength: number;
    axisCutoff: number;
    axisThickness: number;
    axisFontSize: number;
    tickHeight: number;
    tickFontSize: number;
    nTicks: number;
    lineColour: string;
    lineThickness: number;
    pointColour: string;
    controlPointColour: string;
    pointRadius: number;
    foregroundColour: string;
    tooltipWidth: number;
    tooltipHeight: number;
    tooltipRadius: number;
    tooltipMargin: number;
    tooltipFontSize: number;
    tooltipBackground: string;
    tooltipForeground: string;
}

export class Config implements IConfig {
    private _cfg: IConfig;

    constructor(cfg: IConfig) {
        this._cfg = cfg;
    }

    get arrowLength(): number { return this._cfg.arrowLength * window.devicePixelRatio; }
    get arrowOffset(): number { return this._cfg.arrowOffset * window.devicePixelRatio; }
    get axisCutoff(): number { return this._cfg.axisCutoff * window.devicePixelRatio; }
    get axisThickness(): number { return this._cfg.axisThickness * window.devicePixelRatio; }
    get axisFontSize(): number { return this._cfg.axisFontSize * window.devicePixelRatio; }
    get foregroundColour(): string { return this._cfg.foregroundColour; }
    get lineColour(): string { return this._cfg.lineColour; }
    get lineThickness(): number { return this._cfg.lineThickness * window.devicePixelRatio; }
    get margin(): number { return this._cfg.margin * window.devicePixelRatio; }
    get nTicks(): number { return this._cfg.nTicks; }
    get pointColour(): string { return this._cfg.pointColour; }
    get controlPointColour(): string { return this._cfg.controlPointColour; }
    get pointRadius(): number { return this._cfg.pointRadius * window.devicePixelRatio; }
    get tickHeight(): number { return this._cfg.tickHeight * window.devicePixelRatio; }
    get tickFontSize(): number { return this._cfg.tickFontSize * window.devicePixelRatio; }
    get tooltipBackground(): string { return this._cfg.tooltipBackground; }
    get tooltipForeground(): string { return this._cfg.tooltipForeground; }
    get tooltipHeight(): number { return this._cfg.tooltipHeight * window.devicePixelRatio; }
    get tooltipMargin(): number { return this._cfg.tooltipMargin * window.devicePixelRatio; }
    get tooltipFontSize(): number { return this._cfg.tooltipFontSize * window.devicePixelRatio; }
    get tooltipRadius(): number { return this._cfg.tooltipRadius * window.devicePixelRatio; }
    get tooltipWidth(): number { return this._cfg.tooltipWidth * window.devicePixelRatio; }
}
