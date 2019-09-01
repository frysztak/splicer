import range from 'lodash/range';
import zip from 'lodash/zip';
import max from 'lodash/max'

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
    pointIdxBeingDragged: number;
    segments: ISegment[];
}

interface IPoint {
    x: number,
    y: number,
}

interface ISegment {
    a: IPoint;
    b: IPoint;
    c: IPoint;
    d: IPoint;
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
    pointIdxBeingDragged: undefined,
    segments: [],
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
    state.xScale = width / max([max(state.x), 1.0]);
    state.xOffset = margin;
    state.yScale = height / state.maxY;
    state.yOffset = height + margin + axisCutoff + arrowLength;
}

function drawPlot() {
    const ctx = state.ctx;
    const {x, y} = toScreenSpace(state.x, state.y) as { x: number[], y: number[] };

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

    for (const point of state.points) {
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

function drawFrame() {
    state.canvas.width = state.canvas.offsetWidth * window.devicePixelRatio;
    state.canvas.height = state.canvas.offsetHeight * window.devicePixelRatio;
    updateScale();
    drawAxes();
    drawSegments();
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
    const pointIdx = state.points.findIndex((point: IPoint) =>
        Math.abs(point.x - pointCentre.x) <= pointRadius / state.xScale
        && Math.abs(point.y - pointCentre.y) <= pointRadius / state.yScale);

    if (pointIdx !== -1) {
        state.pointIdxBeingDragged = pointIdx;
    } else {
        state.points.push(pointCentre);
        updateSegments();
    }
}

function handleMouseMove(ev: MouseEvent) {
    if (state.pointIdxBeingDragged === undefined) return;

    state.points[state.pointIdxBeingDragged] = fromScreenSpace(ev.clientX - pointRadius, ev.clientY - pointRadius) as IPoint;
    updateSegments();
}

function handleMouseUp(ev: MouseEvent) {
    if (state.pointIdxBeingDragged === undefined) return;

    state.pointIdxBeingDragged = undefined;
    updateSegments();
}

function updateSegments() {
    const points = state.points;
    if (points.length < 4) return;

    const chunks: IPoint[][] = [];
    const stride = 3;
    for (let i = 3; i < points.length; i++) {
        chunks.push(points.slice(i-stride, i+1));
    }

    state.segments = chunks.map((chunk: IPoint[]) => createSegment(chunk));
}

function createSegment(points: IPoint[]): ISegment {
    const distance = (p1: IPoint, p2: IPoint) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    const p0 = points[0], p1 = points[1], p2 = points[2], p3 = points[3];
    const alpha = 0.5;
    const tension = 0;

    const t01 = Math.pow(distance(p0, p1), alpha);
    const t12 = Math.pow(distance(p1, p2), alpha);
    const t23 = Math.pow(distance(p2, p3), alpha);
    const m1: IPoint = {
        x: (1.0 - tension) * (p2.x - p1.x + t12 * ((p1.x - p0.x) / t01 - (p2.x - p0.x) / (t01 + t12))),
        y: (1.0 - tension) * (p2.y - p1.y + t12 * ((p1.y - p0.y) / t01 - (p2.y - p0.y) / (t01 + t12))),
    };
    const m2: IPoint = {
        x: (1.0 - tension) * (p2.x - p1.x + t12 * ((p3.x - p2.x) / t23 - (p3.x - p1.x) / (t12 + t23))),
        y: (1.0 - tension) * (p2.y - p1.y + t12 * ((p3.y - p2.y) / t23 - (p3.y - p1.y) / (t12 + t23))),
    };

    return {
        a: {
            x: 2.0 * (p1.x - p2.x) + m1.x + m2.x,
            y: 2.0 * (p1.y - p2.y) + m1.y + m2.y,
        },
        b: {
            x: -3.0 * (p1.x - p2.x) - m1.x - m1.x - m2.x,
            y: -3.0 * (p1.y - p2.y) - m1.y - m1.y - m2.y,
        },
        c: m1,
        d: p1,
    };
}

function drawSegments() {
    if (!state.segments.length) return;

    state.x = state.y = [];
    const t = range(0, 1, 0.01);
    for (const segment of state.segments) {
        state.x = state.x.concat(t.map(t_ => segment.a.x * Math.pow(t_, 3) + segment.b.x * Math.pow(t_, 2) + segment.c.x * t_ + segment.d.x));
        state.y = state.y.concat(t.map(t_ => segment.a.y * Math.pow(t_, 3) + segment.b.y * Math.pow(t_, 2) + segment.c.y * t_ + segment.d.y));
    }
}

function hookEventListeners() {
    const maxYInput = <HTMLInputElement>document.getElementById('maxY');
    maxYInput.oninput = ((ev: Event) => state.maxY = Number((ev.target as HTMLInputElement).value));
    state.canvas.onmousedown = handleMouseDown;
    state.canvas.onmousemove = handleMouseMove;
    state.canvas.onmouseup = handleMouseUp;
}

window.onload = start;
