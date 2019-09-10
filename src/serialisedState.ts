import {IPoint} from "./point";

export interface ISerialisedState {
    maxY: number;
    tension: number;
    alpha: number;
    points: IPoint[];
}
