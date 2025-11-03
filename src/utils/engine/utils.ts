import type { Camera, Position } from './types';

export const lerp = (from: number, to: number, t: number): number => {
    return from + (to - from) * t;
};

export const positionsEqual = (a: Position, b: Position) => a.x === b.x && a.y === b.y;

export const lerpPosition = (from: Position, to: Position, t: number): Position => {
    return {
        x: lerp(from.x, to.x, t),
        y: lerp(from.y, to.y, t),
    };
};

export const isMac = navigator.platform.toUpperCase().includes('MAC');

export const DEFAULT_CAMERA_OPTIONS: Camera = {
    zoom: 1,
    rotation: 0,
    position: { x: 0, y: 0 },
    dirty: false,
};
