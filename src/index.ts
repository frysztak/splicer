import range from 'lodash/range';
import max from 'lodash/max'
import {IPoint} from "./point";
import {Segment, SegmentPoints} from "./segment";
import {Config, IState} from "./state";
import {drawAxes, drawPlot, drawPoints, drawTooltip, fromScreenSpace} from "./drawing";
import {saveAs} from "file-saver";
import {ISerialisedState} from "./serialisedState";
import ISerialisedStateTI  from "./serialisedState-ti";
import IPointTI  from "./point-ti";
import {createCheckers} from "ts-interface-checker";

const initialPoints: IPoint[] = [
    {x: 0.12, y: 0.67},
    {x: 0.01, y: 0.01},
    {x: 0.15, y: 0.30},
    {x: 0.25, y: 1.00},
    {x: 0.50, y: 1.00},
    {x: 0.60, y: 0.00},
    {x: 0.90, y: 0.90},
];

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
    plotWidth: 0,
    plotHeight: 0,
    points: initialPoints,
    pointIdxBeingDragged: -1,
    pointIdxHoveredOn: -1,
    segments: [],
    tension: 0,
    alpha: 0.5,
    segmentsElement: undefined,
    contextMenuVisible: false,
    contextMenu: undefined,
    contextMenuPointIdx: -1,
    contextMenuPoint: undefined,
    config: new Config({
        margin: 50,
        arrowOffset: 8,
        arrowLength: 8 / Math.sqrt(2),
        axisCutoff: 25,
        axisThickness: 1,
        axisFontSize: 20,
        tickHeight: 8,
        tickFontSize: 16,
        nTicks: 5,
        lineColour: '#bc5090',
        lineThickness: 2.5,
        pointColour: '#82929f78',
        controlPointColour: '#57467b78',
        pointRadius: 14,
        foregroundColour: '#cecccc',
        tooltipWidth: 105,
        tooltipHeight: 40,
        tooltipRadius: 5,
        tooltipMargin: 45,
        tooltipFontSize: 18,
        tooltipBackground: '#e5cdc8',
        tooltipForeground: '#913d88'
    })
};

function updateScale() {
    const cfg = state.config;
    const dpr = window.devicePixelRatio;
    const rect = state.canvas.getBoundingClientRect();

    state.canvas.width = Math.round(rect.right * dpr) - Math.round(rect.left * dpr);
    state.canvas.height = state.canvas.offsetHeight * dpr;
    state.plotWidth = state.canvas.width - 2 * cfg.margin - cfg.axisCutoff - cfg.arrowLength;
    state.plotHeight = state.canvas.height - 2 * cfg.margin - cfg.axisCutoff - cfg.arrowLength;
    state.xScale = state.plotWidth / max([max(state.x), 1.0]);
    state.xOffset = cfg.margin;
    state.yScale = state.plotHeight / state.maxY;
    state.yOffset = state.plotHeight + cfg.margin + cfg.axisCutoff + cfg.arrowLength;
}

function drawFrame() {
    updateScale();
    drawAxes(state);
    drawSegments();
    drawPlot(state);
    drawPoints(state);
    if (state.pointIdxBeingDragged !== -1) {
        drawTooltip(state, state.points[state.pointIdxBeingDragged]);
    } else if (state.pointIdxHoveredOn !== -1) {
        drawTooltip(state, state.points[state.pointIdxHoveredOn]);
    }
    requestAnimationFrame(drawFrame);
}

function start() {
    state.canvas = <HTMLCanvasElement>document.getElementById('plot');
    state.ctx = state.canvas.getContext('2d');
    hookEventListeners();
    updateSegments();
    requestAnimationFrame(drawFrame);
}

function findPoint(ev: MouseEvent | TouchEvent): { pointIdx: number; pointCentre: IPoint } {
    const r = state.config.pointRadius;
    const dpr = window.devicePixelRatio;
    const clientX = ev instanceof MouseEvent
        ? ev.clientX
        : ev.touches[0].clientX;

    const clientY = ev instanceof MouseEvent
        ? ev.clientY
        : ev.touches[0].clientY;
    const pointCentre = fromScreenSpace(state, clientX * dpr, clientY * dpr) as IPoint;
    const pointIdx =  state.points.findIndex((point: IPoint) =>
        Math.abs(point.x - pointCentre.x) <= 1.25 * r / state.xScale
        && Math.abs(point.y - pointCentre.y) <= 1.25 * r / state.yScale);

    return {pointIdx, pointCentre};
}

function handleMouseDown(ev: MouseEvent | TouchEvent) {
    if (ev instanceof MouseEvent && ev.button === 2) return;
    if (state.contextMenuVisible)  {
        changeContextMenuVisibility(false);
        return;
    }

    const {pointIdx, pointCentre} = findPoint(ev);

    if (pointIdx !== -1) {
        state.pointIdxBeingDragged = pointIdx;
    } else {
        insertPoint(pointCentre);
        updateSegments();
    }
}

function insertPoint(point: IPoint) {
    if (state.points.length >= 4) {
        state.points.splice(state.points.length - 1, 0, point);
    } else {
        state.points.push(point);
    }
}

function handleMouseMove(ev: MouseEvent | TouchEvent) {
    const {pointIdx, pointCentre} = findPoint(ev);
    if (state.pointIdxBeingDragged === -1) {
        state.pointIdxHoveredOn = pointIdx;
    } else {
        state.points[state.pointIdxBeingDragged] = pointCentre;
        updateSegments();
    }
}

function handleMouseUp(ev: MouseEvent | TouchEvent) {
    if (state.pointIdxBeingDragged === undefined) return;

    state.pointIdxBeingDragged = -1;
    state.pointIdxHoveredOn = -1;
    updateSegments();
}

function handleTensionChange(ev: Event) {
    state.tension = Number((ev.target as HTMLInputElement).value);
    updateSegments();
}

function handleAlphaChange(ev: Event) {
    state.alpha = Number((ev.target as HTMLInputElement).value);
    updateSegments();
}

function flashButton(button: HTMLButtonElement, text: string) {
    const originalText = button.innerText;
    button.innerText = text;
    button.disabled = true;
    setTimeout(() => {
        button.innerText = originalText;
        button.disabled = false;
    }, 1000);
}

function handleCopyToClipboard(button: HTMLButtonElement, json: boolean) {
    const str = json ? getSegmentsJSON() : getSegmentsTS();
    if (state.segments.length) {
        navigator.clipboard.writeText(str)
            .then(() => flashButton(button, "Copied!"))
            .catch(() => flashButton(button, "Failed to copy"));
    }
}

function handleCopyJSONClick() {
    const copyButton = document.getElementById('copyJSON') as HTMLButtonElement;
    handleCopyToClipboard(copyButton, true);
}

function handleCopyTSClick() {
    const copyButton = document.getElementById('copyTS') as HTMLButtonElement;
    handleCopyToClipboard(copyButton, false);
}

function updateSegments() {
    const points = state.points;
    if (points.length < 4) {
        state.segments = [];
        state.segmentsElement.innerText = '';
        return;
    }

    const chunks: SegmentPoints[] = [];
    const stride = 3;
    for (let i = stride; i < points.length; i++) {
        chunks.push(points.slice(i-stride, i+1) as SegmentPoints);
    }

    state.segments = chunks.map((chunk: SegmentPoints) => {
        const segment = new Segment();
        segment.calculateCoefficients(chunk, state.tension, state.alpha);
        return segment;
    });
    state.segmentsElement.innerText = getSegmentsJSON();
}

function getSegmentsJSON(): string {
   return JSON.stringify(state.segments.map((segment: Segment) => segment.getCoefficients()), null, 2);
}

function getSegmentsTS(): string {
    const printCoeffs = (segment: Segment) => {
        return `new Segment(
        {x: ${segment.a.x}, y: ${segment.a.y}},
        {x: ${segment.b.x}, y: ${segment.b.y}},
        {x: ${segment.c.x}, y: ${segment.c.y}},
        {x: ${segment.d.x}, y: ${segment.d.y}}
    )`;
    };
    const segmentsStr = state.segments.map(printCoeffs).join(',\n    ');
    return `const segments = [
    ${segmentsStr}
];`;
}

function drawSegments() {
    state.x = state.y = [];
    if (!state.segments.length) return;

    const t = range(0, 1, 0.01);
    for (const segment of state.segments) {
        const {x, y} = segment.evaluate(t);
        state.x = state.x.concat(x);
        state.y = state.y.concat(y);
    }
}

function handleContextMenu(ev: MouseEvent) {
    ev.preventDefault();
    const {pointIdx, pointCentre} = findPoint(ev);
    state.contextMenu.style.left = `${ev.pageX}px`;
    state.contextMenu.style.top = `${ev.pageY}px`;
    state.contextMenuPointIdx = pointIdx;
    state.contextMenuPoint = pointCentre;
    document.getElementById('removePoint').style.display = pointIdx !== -1 ? 'block' : 'none';
    document.getElementById('addPoint').style.display = pointIdx !== -1 ? 'none' : 'block';
    changeContextMenuVisibility(true);
}

function changeContextMenuVisibility(show: boolean) {
    state.contextMenu.style.display = show ? 'block' : 'none';
    state.contextMenuVisible = show;
}

function handleAddPoint(ev: MouseEvent) {
    if (state.contextMenuPointIdx !== -1) {
        changeContextMenuVisibility(false);
        return;
    }
    const point = state.contextMenuPoint;

    const idx = state.points.findIndex((p: IPoint) => p.x > point.x);
    if (idx !== -1) {
        state.points.splice(idx, 0, point);
    } else {
        insertPoint(point);
    }
    updateSegments();
    changeContextMenuVisibility(false);
}

function handleRemovePoint(ev: MouseEvent) {
    const idx = state.contextMenuPointIdx;
    if (idx !== -1) {
        state.points.splice(idx, 1);
        updateSegments();
    }
    changeContextMenuVisibility(false);
}

function handleRemoveAllPoints() {
    state.points = [];
    updateSegments();
    changeContextMenuVisibility(false);
}

function populateState(data: ISerialisedState) {
    state.maxY = data.maxY;
    const maxYInput = document.getElementById('maxY') as HTMLInputElement;
    maxYInput.valueAsNumber = data.maxY;

    state.tension = data.tension;
    const tensionInput = document.getElementById('tension') as HTMLInputElement;
    tensionInput.valueAsNumber = data.tension;

    state.alpha = data.alpha;
    const alphaInput = document.getElementById('alpha') as HTMLInputElement;
    alphaInput.valueAsNumber = data.alpha;

    state.points = data.points;
}

function handleImportButton() {
    const input = document.createElement('input') as HTMLInputElement;
    input.type = 'file';

    input.onchange = (e: Event) => {
        const file = (e.target as HTMLInputElement).files[0];
        const reader = new FileReader();
        reader.readAsText(file,'UTF-8');
        reader.onload = (readerEvent) => {
            const json = (readerEvent.target as FileReader).result as string;
            const data = JSON.parse(json);
            const {ISerialisedState} = createCheckers(ISerialisedStateTI, IPointTI);
            if (ISerialisedState.strictTest(data)) {
                const serialisedState = data as ISerialisedState;
                populateState(serialisedState);
                updateSegments();
            } else {
                const importButton = document.getElementById('import') as HTMLButtonElement;
                flashButton(importButton, 'Corrupted JSON');
            }
        }
    };

    input.click();
}

function handleExportButton() {
    const data: ISerialisedState  = {
        maxY: state.maxY,
        tension: state.tension,
        alpha: state.alpha,
        points: state.points,
    };

    const json = JSON.stringify(data, null,  2);
    const blob = new Blob([json], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "splicer.json", {autoBom: true});
}

function hookEventListeners() {
    const maxYInput = document.getElementById('maxY') as HTMLInputElement;
    maxYInput.oninput = ((ev: Event) => state.maxY = Number((ev.target as HTMLInputElement).value));

    const tensionInput = document.getElementById('tension') as HTMLInputElement;
    tensionInput.oninput = handleTensionChange;

    const alphaInput = document.getElementById('alpha') as HTMLInputElement;
    alphaInput.oninput = handleAlphaChange;

    state.segmentsElement = document.getElementById('segments') as HTMLPreElement;

    const copyJSONButton = document.getElementById('copyJSON') as HTMLButtonElement;
    copyJSONButton.onclick = handleCopyJSONClick;

    const copyTSButton = document.getElementById('copyTS') as HTMLButtonElement;
    copyTSButton.onclick = handleCopyTSClick;

    const importButton = document.getElementById('import') as HTMLButtonElement;
    importButton.onclick = handleImportButton;

    const exportButton = document.getElementById('export') as HTMLButtonElement;
    exportButton.onclick = handleExportButton;

    state.contextMenu = document.getElementById('menu');
    state.canvas.oncontextmenu = handleContextMenu;

    document.getElementById('addPoint').onclick = handleAddPoint;
    document.getElementById('removePoint').onclick = handleRemovePoint;
    document.getElementById('removeAllPoints').onclick = handleRemoveAllPoints;

    state.canvas.onmousedown = handleMouseDown;
    state.canvas.ontouchstart = handleMouseDown;

    state.canvas.onmousemove = handleMouseMove;
    state.canvas.ontouchmove = handleMouseMove;

    state.canvas.onmouseup = handleMouseUp;
    state.canvas.ontouchend = handleMouseUp;
}

window.onload = start;
