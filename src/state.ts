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
}

export interface IConfig {
    margin: number;
    arrowOffset: number;
    arrowLength: number;
    axisCutoff: number;
    tickHeight: number;
    nTicks: number;
    lineColour: string;
    pointColour: string;
    pointRadius: number;
    foregroundColour: string;
    tooltipWidth: number;
    tooltipHeight: number;
    tooltipRadius: number;
    tooltipMargin: number;
    tooltipBackground: string;
    tooltipForeground: string;
}
