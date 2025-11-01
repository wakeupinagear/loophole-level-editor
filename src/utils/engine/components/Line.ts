import { C_Drawable } from '.';
import {
    RENDER_CMD,
    RenderCommand,
    type DrawDataLine,
    type RenderCommandStream,
    type RenderStyle,
} from '../systems/render';
import type { Position } from '../types';

export class C_Line extends C_Drawable {
    #start: Position;
    #end: Position;

    constructor(name: string, start: Position, end: Position, style?: RenderStyle) {
        super(name, { x: 0, y: 0 }, { x: 1, y: 1 }, style);

        this.#start = { ...start };
        this.#end = { ...end };
    }

    get start(): Position {
        return this.#start;
    }

    get end(): Position {
        return this.#end;
    }

    setStart(start: Position): this {
        this.#start = { ...start };
        return this;
    }

    setEnd(end: Position): this {
        this.#end = { ...end };
        return this;
    }

    setPoints(start: Position, end: Position): this {
        this.#start = { ...start };
        this.#end = { ...end };
        return this;
    }

    override queueRenderCommands(out: RenderCommandStream): void {
        if (!this.entity) {
            return;
        }

        if (this.#start.x === this.#end.x && this.#start.y === this.#end.y) {
            return;
        }

        const data: DrawDataLine = {
            x1: this.#start.x,
            y1: this.#start.y,
            x2: this.#end.x,
            y2: this.#end.y,
        };

        out.push(new RenderCommand(RENDER_CMD.DRAW_LINE, this.style, data));
    }
}
