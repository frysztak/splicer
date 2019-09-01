import {IPoint, IPointList} from "./point";

export type SegmentPoints = [IPoint, IPoint, IPoint, IPoint];

export class Segment {
    a: IPoint;
    b: IPoint;
    c: IPoint;
    d: IPoint;

    constructor(points: SegmentPoints, alpha: number = 0.5, tension: number = 0) {
        const p0 = points[0], p1 = points[1], p2 = points[2], p3 = points[3];

        const t01 = Math.pow(this.distance(p0, p1), alpha);
        const t12 = Math.pow(this.distance(p1, p2), alpha);
        const t23 = Math.pow(this.distance(p2, p3), alpha);
        const m1: IPoint = {
            x: (1.0 - tension) * (p2.x - p1.x + t12 * ((p1.x - p0.x) / t01 - (p2.x - p0.x) / (t01 + t12))),
            y: (1.0 - tension) * (p2.y - p1.y + t12 * ((p1.y - p0.y) / t01 - (p2.y - p0.y) / (t01 + t12))),
        };
        const m2: IPoint = {
            x: (1.0 - tension) * (p2.x - p1.x + t12 * ((p3.x - p2.x) / t23 - (p3.x - p1.x) / (t12 + t23))),
            y: (1.0 - tension) * (p2.y - p1.y + t12 * ((p3.y - p2.y) / t23 - (p3.y - p1.y) / (t12 + t23))),
        };

        this.a = {
            x: 2.0 * (p1.x - p2.x) + m1.x + m2.x,
            y: 2.0 * (p1.y - p2.y) + m1.y + m2.y,
        };
        this.b = {
            x: -3.0 * (p1.x - p2.x) - m1.x - m1.x - m2.x,
            y: -3.0 * (p1.y - p2.y) - m1.y - m1.y - m2.y,
        };
        this.c = m1;
        this.d = p1;
    }

    evaluate(t: number[]): IPointList {
        return {
            x: t.map(t_ => this.a.x * Math.pow(t_, 3) + this.b.x * Math.pow(t_, 2) + this.c.x * t_ + this.d.x),
            y: t.map(t_ => this.a.y * Math.pow(t_, 3) + this.b.y * Math.pow(t_, 2) + this.c.y * t_ + this.d.y)
        };
    }

    private distance(p1: IPoint, p2: IPoint): number {
        return Math.sqrt(
            Math.pow(p1.x - p2.x, 2)
            + Math.pow(p1.y - p2.y, 2)
        );
    }
}
