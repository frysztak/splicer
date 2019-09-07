import {IState} from "./state";
import zip from "lodash/zip";
import range from "lodash/range";
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
    ctx.lineWidth = cfg.axisThickness;
    ctx.beginPath();
    ctx.moveTo(cfg.margin, y);
    ctx.lineTo(finalX, y);
    ctx.lineTo(finalX - cfg.arrowOffset, y - cfg.arrowOffset);
    ctx.moveTo(finalX, y);
    ctx.lineTo(finalX - cfg.arrowOffset, y + cfg.arrowOffset);
    ctx.stroke();
    ctx.font = `normal bold ${cfg.axisFontSize}px 'Calibri', sans-serif`;
    ctx.fillText('t', finalX - cfg.arrowOffset, y + 4 * cfg.arrowOffset);
    drawXTicks(state, y);

    // y axis
    const finalY = state.canvas.height - cfg.margin;
    ctx.beginPath();
    ctx.lineWidth = cfg.axisThickness;
    ctx.moveTo(cfg.margin, finalY);
    ctx.lineTo(cfg.margin, cfg.margin);
    ctx.lineTo(cfg.margin - cfg.arrowOffset, cfg.margin + cfg.arrowOffset);
    ctx.moveTo(cfg.margin, cfg.margin);
    ctx.lineTo(cfg.margin + cfg.arrowOffset, cfg.margin + cfg.arrowOffset);
    ctx.stroke();
    ctx.font = `normal bold ${cfg.axisFontSize}px 'Calibri', sans-serif`;
    ctx.fillText('y', cfg.margin - 4 * cfg.arrowOffset, cfg.margin + cfg.arrowOffset);
    drawYTicks(state, cfg.margin);
}

function drawXTicks(state: IState, y: number) {
    const ctx = state.ctx;
    const cfg = state.config;

    ctx.font = `normal normal ${cfg.tickFontSize}px 'Calibri', sans-serif`;
    ctx.textAlign = "center";

    let tickStep = 1/cfg.nTicks;
    let ticks = range(0, 1+tickStep, tickStep);
    let tickDistance = state.plotWidth / cfg.nTicks;
    let x = cfg.margin;
    for (const tick of ticks) {
        ctx.fillText(tick.toFixed(2), x, y + 4 * cfg.arrowOffset);
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + cfg.tickHeight);
        ctx.stroke();
        x += tickDistance;
    }
}

function drawYTicks(state: IState, x: number) {
    const ctx = state.ctx;
    const cfg = state.config;

    ctx.font = `normal normal ${cfg.tickFontSize}px 'Calibri', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = 'middle';

    let tickStep = state.maxY/cfg.nTicks;
    let ticks = range(0, state.maxY+tickStep, tickStep);
    let tickDistance = state.plotHeight / cfg.nTicks;
    let y = cfg.margin + state.plotHeight + cfg.arrowLength + cfg.axisCutoff;
    for (const tick of ticks) {
        ctx.fillText(tick.toFixed(2), x - 4 * cfg.arrowOffset, y);
        ctx.moveTo(x, y);
        ctx.lineTo(x - cfg.tickHeight, y);
        ctx.stroke();
        y -= tickDistance;
    }
}

export function drawPlot(state: IState) {
    const ctx = state.ctx;
    const {x, y} = toScreenSpace(state, state.x, state.y) as IPointList;

    ctx.moveTo(x[0], y[0]);
    ctx.beginPath();
    ctx.strokeStyle = state.config.lineColour;
    ctx.lineWidth = state.config.lineThickness;
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

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath();
    ctx.moveTo(x, y + radius);
    ctx.lineTo(x, y + height - radius);
    ctx.arcTo(x, y + height, x + radius, y + height, radius);
    ctx.lineTo(x + width - radius, y + height);
    ctx.arcTo(x + width, y + height, x + width, y + height-radius, radius);
    ctx.lineTo(x + width, y + radius);
    ctx.arcTo(x + width, y, x + width - radius, y, radius);
    ctx.lineTo(x + radius, y);
    ctx.arcTo(x, y, x, y + radius, radius);
    ctx.fill();
}

export function drawTooltip(state: IState, point: IPoint) {
    const ctx = state.ctx;
    const cfg = state.config;
    ctx.fillStyle = cfg.tooltipBackground;

    let {x, y} = toScreenSpace(state, point.x, point.y) as IPoint;
    x -= cfg.tooltipWidth/2;
    y -= cfg.pointRadius + cfg.tooltipMargin;
    roundedRect(ctx, x, y, cfg.tooltipWidth, cfg.tooltipHeight, cfg.tooltipRadius);

    const text = `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`;
    x += cfg.tooltipWidth/2;
    y = y + cfg.tooltipHeight/2;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = cfg.tooltipForeground;
    ctx.strokeStyle = cfg.tooltipForeground;
    ctx.font = `normal normal ${cfg.tooltipFontSize}px 'Calibri', sans-serif`;
    ctx.fillText(text, x, y);
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
