import {IState} from "./state";
import zip from "lodash/zip";
import {IPoint, IPointList} from "./point";

type NumOrArr = number | number[];


export function drawAxes(state: IState) {
    const ctx = state.ctx;
    const cfg = state.config;

    // x axis
    const y = state.canvas.height - cfg.margin;
    const finalX = state.canvas.width - cfg.margin;
    ctx.strokeStyle = cfg.foregroundColour;
    ctx.fillStyle = cfg.foregroundColour;
    ctx.beginPath();
    ctx.moveTo(cfg.margin, y);
    ctx.lineTo(finalX, y);
    ctx.lineTo(finalX - cfg.arrowOffset, y - cfg.arrowOffset);
    ctx.moveTo(finalX, y);
    ctx.lineTo(finalX - cfg.arrowOffset, y + cfg.arrowOffset);
    ctx.stroke();
    ctx.font = "normal bold 20px 'Calibri', sans-serif";
    ctx.fillText('t', finalX - cfg.arrowOffset, y + 4 * cfg.arrowOffset);
    // tick
    ctx.font = "normal normal 16px 'Calibri', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText('1', finalX - cfg.arrowOffset - cfg.axisCutoff, y + 4 * cfg.arrowOffset);
    ctx.moveTo(finalX - cfg.arrowOffset - cfg.axisCutoff, y);
    ctx.lineTo(finalX - cfg.arrowOffset - cfg.axisCutoff, y + cfg.tickHeight);
    ctx.stroke();

    // y axis
    const finalY = state.canvas.height - cfg.margin;
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.moveTo(cfg.margin, finalY);
    ctx.lineTo(cfg.margin, cfg.margin);
    ctx.lineTo(cfg.margin - cfg.arrowOffset, cfg.margin + cfg.arrowOffset);
    ctx.moveTo(cfg.margin, cfg.margin);
    ctx.lineTo(cfg.margin + cfg.arrowOffset, cfg.margin + cfg.arrowOffset);
    ctx.stroke();
    ctx.font = "normal bold 20px 'Calibri', sans-serif";
    ctx.fillText('y', cfg.margin - 4 * cfg.arrowOffset, cfg.margin + cfg.arrowOffset);
    // tick
    ctx.font = "normal normal 16px 'Calibri', sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(state.maxY.toFixed(1), cfg.margin - 4 * cfg.arrowOffset, cfg.margin + cfg.arrowOffset + cfg.axisCutoff);
    ctx.moveTo(cfg.margin, cfg.margin + cfg.arrowOffset + cfg.axisCutoff);
    ctx.lineTo(cfg.margin - cfg.tickHeight, cfg.margin + cfg.arrowOffset + cfg.axisCutoff);
    ctx.stroke();
}

export function drawPlot(state: IState) {
    const ctx = state.ctx;
    const {x, y} = toScreenSpace(state, state.x, state.y) as IPointList;

    ctx.moveTo(x[0], y[0]);
    ctx.beginPath();
    ctx.strokeStyle = state.config.lineColour;
    ctx.lineWidth = 2.5;
    for (const [x_, y_] of zip(x, y)) {
        ctx.lineTo(x_, y_);
    }
    ctx.stroke();
}

export function drawPoints(state: IState) {
    const ctx = state.ctx;

    for (const point of state.points) {
        ctx.beginPath();
        const {x, y} = toScreenSpace(state, point.x, point.y) as IPoint;
        ctx.arc(x, y, state.config.pointRadius, 0, 2 * Math.PI);
        ctx.fillStyle = state.config.pointColour;
        ctx.fill();
    }
}

export function toScreenSpace(state: IState, x: NumOrArr, y: NumOrArr): { x: NumOrArr, y: NumOrArr } {
    const mapX = (x: number) => state.xOffset + x * state.xScale;
    const mapY = (y: number) => state.yOffset - y * state.yScale;

    if (Array.isArray(x) && Array.isArray(y)) {
        return {
            x: x.map(mapX),
            y: y.map(mapY),
        };
    } else if (typeof x === 'number' && typeof y === 'number')
        return {
            x: mapX(x),
            y: mapY(y),
        };
}

export function fromScreenSpace(state: IState, x: NumOrArr, y: NumOrArr): { x: NumOrArr, y: NumOrArr } {
    const mapX = (x: number) => (x - state.xOffset) / state.xScale;
    const mapY = (y: number) => -(y - state.yOffset) / state.yScale;

    if (Array.isArray(x) && Array.isArray(y)) {
        return {
            x: x.map(mapX),
            y: y.map(mapY),
        };
    } else if (typeof x === 'number' && typeof y === 'number')
        return {
            x: mapX(x),
            y: mapY(y),
        };
}
