import type { RenderCommandStream } from './systems/render';

export type Position = {
    x: number;
    y: number;
};

export type RecursiveArray<T> = Array<RecursiveArray<T> | T>;

export interface ButtonState {
    down: boolean;
    downAsNum: number;
    pressed: boolean;
    released: boolean;
    downTime: number;
}

export interface CameraData {
    zoom: number;
    rotation: number;
    position: Position;
}
export interface CameraMetadata {
    dirty: boolean;
}

export interface Camera extends CameraData, CameraMetadata {}

export interface Renderable {
    queueRenderCommands(out: RenderCommandStream, camera: Camera): void;
}
