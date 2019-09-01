import range from 'lodash/range';
import zip from 'lodash/zip';
import max from 'lodash/max';

interface IState {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    x: number[];
    y: number[];
    maxY: number;
    xScale: number,
    xOffset: number;
    yScale: number,
    yOffset: number;
    points: IPoint[];
    pointBeingDragged: IPoint;
}

interface IPoint {
    x: number,
    y: number,
}

const state: IState = {
    ctx: undefined,
    canvas: undefined,
    maxY: 1,
    x: [],
    y: [],
    xScale: 1,
    xOffset: 0,
    yScale: 1,
    yOffset: 0,
    points: [],
    pointBeingDragged: undefined,
};

type NumOrArr = number | number[];

const margin = 45;
const arrowOffset = 8;
const arrowLength = arrowOffset / Math.sqrt(2);
const axisCutoff = 25;
const tickHeight = 8;
const plotColour = '#bc5090';
const pointColour = '#ffa600';
const pointRadius = 10;

function drawAxes() {
    const ctx = state.ctx;
    // x axis
    const y = state.canvas.height - margin;
    const finalX = state.canvas.width - margin;
    ctx.beginPath();
    ctx.moveTo(margin, y);
    ctx.lineTo(finalX, y);
    ctx.lineTo(finalX - arrowOffset, y - arrowOffset);
    ctx.moveTo(finalX, y);
    ctx.lineTo(finalX - arrowOffset, y + arrowOffset);
    ctx.stroke();
    ctx.font = "normal bold 20px sans-serif";
    ctx.fillText('t', finalX - arrowOffset, y + 4 * arrowOffset);
    // tick
    ctx.font = "normal normal 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText('1', finalX - arrowOffset - axisCutoff, y + 4 * arrowOffset);
    ctx.moveTo(finalX - arrowOffset - axisCutoff, y);
    ctx.lineTo(finalX - arrowOffset - axisCutoff, y + tickHeight);
    ctx.stroke();

    // y axis
    const finalY = state.canvas.height - margin;
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.moveTo(margin, finalY);
    ctx.lineTo(margin, margin);
    ctx.lineTo(margin - arrowOffset, margin + arrowOffset);
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin + arrowOffset, margin + arrowOffset);
    ctx.stroke();
    ctx.font = "normal bold 20px sans-serif";
    ctx.fillText('y', margin - 4 * arrowOffset, margin + arrowOffset);
    // tick
    ctx.font = "normal normal 16px sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(state.maxY.toFixed(1), margin - 4 * arrowOffset, margin + arrowOffset + axisCutoff);
    ctx.moveTo(margin, margin + arrowOffset + axisCutoff);
    ctx.lineTo(margin - tickHeight, margin + arrowOffset + axisCutoff);
    ctx.stroke();
}

function updateScale() {
    const width = state.canvas.width - 2 * margin - axisCutoff - arrowLength;
    const height = state.canvas.height - 2 * margin - axisCutoff - arrowLength;
    state.xScale = width / max(state.x);
    state.xOffset = margin;
    state.yScale = height / state.maxY;
    state.yOffset = height + margin + axisCutoff + arrowLength;
}

function drawPlot() {
    const ctx = state.ctx;
    const {x, y} = toScreenSpace(state.x, state.y) as {x: number[], y: number[]};

    ctx.moveTo(x[0], y[0]);
    ctx.beginPath();
    ctx.strokeStyle = plotColour;
    ctx.lineWidth = 2;
    for (const [x_, y_] of zip(x, y)) {
        ctx.lineTo(x_, y_);
    }
    ctx.stroke();
}

function drawPoints() {
    const ctx = state.ctx;

    for (const point of [...state.points, state.pointBeingDragged]) {
        if (!point) continue;
        ctx.beginPath();
        const {x, y} = toScreenSpace(point.x, point.y) as IPoint;
        ctx.arc(x, y, pointRadius, 0, 2 * Math.PI);
        ctx.fillStyle = pointColour;
        ctx.fill();
    }
}

function toScreenSpace(x: NumOrArr, y: NumOrArr): { x: NumOrArr, y: NumOrArr } {
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

function fromScreenSpace(x: NumOrArr, y: NumOrArr): { x: NumOrArr, y: NumOrArr } {
    const mapX = (x: number) =>  (x - state.xOffset)/state.xScale;
    const mapY = (y: number) => -(y - state.yOffset)/state.yScale;

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

function drawFrame() {
    state.canvas.width = state.canvas.offsetWidth * window.devicePixelRatio;
    state.canvas.height = state.canvas.offsetHeight * window.devicePixelRatio;
    updateScale();
    drawAxes();
    drawPlot();
    drawPoints();
    requestAnimationFrame(drawFrame);
}

function start() {
    state.x = range(0, 1, 0.01);
    state.y = state.x.map(x => Math.sqrt(x));

    state.canvas = <HTMLCanvasElement>document.getElementById('plot');
    state.ctx = state.canvas.getContext('2d');
    hookEventListeners();
    requestAnimationFrame(drawFrame);
}

function handleMouseDown(ev: MouseEvent) {
    const pointCentre = fromScreenSpace(ev.clientX - pointRadius, ev.clientY - pointRadius) as IPoint;
    const point = state.points.find((point: IPoint) =>
        Math.abs(point.x - pointCentre.x) <= pointRadius/state.xScale
        && Math.abs(point.y - pointCentre.y) <= pointRadius/state.yScale);

    if (point) {
        state.pointBeingDragged = point;
        state.points = state.points.filter((p: IPoint) => p !== point);
    } else {
        state.points.push(pointCentre);
    }
}

function handleMouseMove(ev: MouseEvent) {
    if (!state.pointBeingDragged) return;

    state.pointBeingDragged = fromScreenSpace(ev.clientX - pointRadius, ev.clientY - pointRadius) as IPoint;
}

function handleMouseUp(ev: MouseEvent) {
    if (!state.pointBeingDragged) return;

    state.points.push(state.pointBeingDragged);
    state.pointBeingDragged = undefined;
}

function hookEventListeners() {
    const maxYInput = <HTMLInputElement>document.getElementById('maxY');
    maxYInput.oninput = ((ev: Event) => state.maxY = Number((ev.target as HTMLInputElement).value));
    state.canvas.onmousedown = handleMouseDown;
    state.canvas.onmousemove = handleMouseMove;
    state.canvas.onmouseup = handleMouseUp;
}

window.onload = start;
