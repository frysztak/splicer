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
    points: IPoint[];
    pointIdxBeingDragged: number;
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
    lineColour: string;
    pointColour: string;
    foregroundColour: string;
    pointRadius: number;
}
