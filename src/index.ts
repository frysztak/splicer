import range from 'lodash/range';
import zip from 'lodash/zip';
import max from 'lodash/max';

interface IState {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    x: number[];
    y: number[];
    maxY: number;
}

const state: IState = {
    ctx: undefined,
    canvas: undefined,
    maxY: 1,
    x: [],
    y: [],
};

const margin = 45;
const arrowOffset = 8;
const axisCutoff = 25;
const tickHeight = 8;
const plotColour = '#bc5090';
const pointColour = '#ffa600';

function drawAxes() {
    const ctx = state.ctx;
    // x axis
    const y = state.canvas.height - margin;
    const finalX = state.canvas.width - margin;
    ctx.beginPath();
    ctx.moveTo(margin, y);
    ctx.lineTo(finalX, y);
    ctx.lineTo(finalX - arrowOffset, y-arrowOffset);
    ctx.moveTo(finalX, y);
    ctx.lineTo(finalX - arrowOffset, y+arrowOffset);
    ctx.stroke();
    ctx.font = "normal bold 20px sans-serif";
    ctx.fillText('t', finalX - arrowOffset, y+4*arrowOffset);
    // tick
    ctx.font = "normal normal 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText('1', finalX - arrowOffset - axisCutoff, y+4*arrowOffset);
    ctx.moveTo(finalX - arrowOffset - axisCutoff, y);
    ctx.lineTo(finalX - arrowOffset - axisCutoff, y+tickHeight);
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
    ctx.fillText('y', margin - 4*arrowOffset, margin+arrowOffset);
    // tick
    ctx.font = "normal normal 16px sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(state.maxY.toFixed(1), margin - 4*arrowOffset, margin + arrowOffset + axisCutoff);
    ctx.moveTo(margin, margin + arrowOffset + axisCutoff);
    ctx.lineTo(margin - tickHeight, margin + arrowOffset + axisCutoff);
    ctx.stroke();
}

function drawPlot() {
    const ctx = state.ctx;
    const arrowLength = arrowOffset/Math.sqrt(2);
    const [width, height] = [state.canvas.width - 2*margin - axisCutoff - arrowLength, state.canvas.height - 2*margin - axisCutoff - arrowLength];
    const [xScale, yScale] = [width / max(state.x), height / state.maxY];
    const [scaledX, scaledY] = [state.x.map(x => x*xScale + margin), state.y.map(y => height + margin + axisCutoff + arrowLength - y*yScale)];

    ctx.moveTo(scaledX[0], scaledY[0]);
    ctx.beginPath();
    ctx.strokeStyle = plotColour;
    ctx.lineWidth = 2;
    for (const [x_, y_] of zip(scaledX, scaledY)) {
        ctx.lineTo(x_, y_);
    }
    ctx.stroke();
}

function drawFrame() {
    state.canvas.width = state.canvas.offsetWidth * window.devicePixelRatio;
    state.canvas.height = state.canvas.offsetHeight * window.devicePixelRatio;
    drawAxes();
    drawPlot();
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

function hookEventListeners() {
    const maxYInput = <HTMLInputElement>document.getElementById('maxY');
    maxYInput.oninput = ((ev: Event) => state.maxY = Number((ev.target as HTMLInputElement).value));
}

window.onload = start;
