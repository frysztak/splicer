import range from 'lodash/range';
import max from 'lodash/max'
import {IPoint} from "./point";
import {Segment, SegmentPoints} from "./segment";
import {IState} from "./state";
import {drawAxes, drawPlot, drawPoints, fromScreenSpace} from "./drawing";

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
    tension: 0,
    config: {
        margin: 45,
        arrowOffset: 8,
        arrowLength: 8 / Math.sqrt(2),
        axisCutoff: 25,
        tickHeight: 8,
        lineColour: '#bc5090',
        pointColour: '#82929f78',
        foregroundColour: '#cecccc',
        pointRadius: 14,
    }
};

function updateScale() {
    const cfg =  state.config;
    const width = state.canvas.width - 2 * cfg.margin - cfg.axisCutoff - cfg.arrowLength;
    const height = state.canvas.height - 2 * cfg.margin - cfg.axisCutoff - cfg.arrowLength;
    state.xScale = width / max([max(state.x), 1.0]);
    state.xOffset = cfg.margin;
    state.yScale = height / state.maxY;
    state.yOffset = height + cfg.margin + cfg.axisCutoff + cfg.arrowLength;
}

function drawFrame() {
    state.canvas.width = state.canvas.offsetWidth * window.devicePixelRatio;
    state.canvas.height = state.canvas.offsetHeight * window.devicePixelRatio;
    updateScale();
    drawAxes(state);
    drawSegments();
    drawPlot(state);
    drawPoints(state);
    requestAnimationFrame(drawFrame);
}

function start() {
    state.canvas = <HTMLCanvasElement>document.getElementById('plot');
    state.ctx = state.canvas.getContext('2d');
    hookEventListeners();
    requestAnimationFrame(drawFrame);
}

function handleMouseDown(ev: MouseEvent) {
    const r = state.config.pointRadius;
    const pointCentre = fromScreenSpace(state, ev.clientX - r, ev.clientY - r) as IPoint;
    const pointIdx = state.points.findIndex((point: IPoint) =>
        Math.abs(point.x - pointCentre.x) <= 1.25 * r / state.xScale
        && Math.abs(point.y - pointCentre.y) <= 1.25 * r / state.yScale);

    if (pointIdx !== -1) {
        state.pointIdxBeingDragged = pointIdx;
    } else {
        state.points.push(pointCentre);
        updateSegments();
    }
}

function handleMouseMove(ev: MouseEvent) {
    if (state.pointIdxBeingDragged === undefined) return;

    const r = state.config.pointRadius;
    state.points[state.pointIdxBeingDragged] = fromScreenSpace(state, ev.clientX - r, ev.clientY - r) as IPoint;
    updateSegments();
}

function handleMouseUp(ev: MouseEvent) {
    if (state.pointIdxBeingDragged === undefined) return;

    state.pointIdxBeingDragged = undefined;
    updateSegments();
}

function handleTensionChange(ev: Event) {
    state.tension = Number((ev.target as HTMLInputElement).value);
    updateSegments();
}

function updateSegments() {
    const points = state.points;
    if (points.length < 4) return;

    const chunks: SegmentPoints[] = [];
    const stride = 3;
    for (let i = stride; i < points.length; i++) {
        chunks.push(points.slice(i-stride, i+1) as SegmentPoints);
    }

    state.segments = chunks.map((chunk: SegmentPoints) => new Segment(chunk, state.tension));
}

function drawSegments() {
    if (!state.segments.length) return;

    state.x = state.y = [];
    const t = range(0, 1, 0.01);
    for (const segment of state.segments) {
        const {x, y} = segment.evaluate(t);
        state.x = state.x.concat(x);
        state.y = state.y.concat(y);
    }
}

function hookEventListeners() {
    const maxYInput = <HTMLInputElement>document.getElementById('maxY');
    maxYInput.oninput = ((ev: Event) => state.maxY = Number((ev.target as HTMLInputElement).value));
    const tensionInput = <HTMLInputElement>document.getElementById('tension');
    tensionInput.oninput = handleTensionChange;
    state.canvas.onmousedown = handleMouseDown;
    state.canvas.onmousemove = handleMouseMove;
    state.canvas.onmouseup = handleMouseUp;
}

window.onload = start;
