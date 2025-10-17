import type { RenderCommandStream } from './systems/render';

export type Position = {
    x: number;
    y: number;
};

export interface Renderable {
    queueRenderCommands(out: RenderCommandStream): void;
}

export const MouseButton = {
    LEFT: 0,
    MIDDLE: 1,
    RIGHT: 2,
} as const;
export type MouseButton = (typeof MouseButton)[keyof typeof MouseButton];

export interface MouseState
    extends Position,
        Record<
            MouseButton,
            {
                down: boolean;
                pressed: boolean;
                released: boolean;
            }
        > {
    justMoved: boolean;
    onScreen: boolean;
}

export type RecursiveArray<T> = Array<RecursiveArray<T> | T>;
