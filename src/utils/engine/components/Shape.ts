import {
    RENDER_CMD,
    RenderCommand,
    type DrawDataShape,
    type RenderCommandStream,
    type RenderStyle,
} from '../systems/render';
import type { Position } from '../types';
import { C_Drawable } from './index';

type Shape = 'RECT' | 'ELLIPSE';

export class C_Shape extends C_Drawable {
    #shape: Shape;
    #repeat: Position | null;
    #gap: Position | null;

    constructor(
        name: string,
        shape: Shape,
        style?: RenderStyle,
        repeat?: Position,
        gap?: Position,
    ) {
        super(
            name,
            shape === 'ELLIPSE' ? { x: 0, y: 0 } : { x: 0.5, y: 0.5 },
            { x: 1, y: 1 },
            style,
        );

        this.#shape = shape;
        this.#repeat = repeat ?? null;
        this.#gap = gap ?? null;
    }

    get repeat(): Position | null {
        return this.#repeat;
    }

    set repeat(repeat: Position | null) {
        this.#repeat = repeat;
    }

    get gap(): Position | null {
        return this.#gap;
    }

    set gap(gap: Position | null) {
        this.#gap = gap;
    }

    override queueRenderCommands(out: RenderCommandStream): void {
        if (!this.entity?.transform) {
            return;
        }

        switch (this.#shape) {
            case 'RECT': {
                const data: DrawDataShape = {
                    x: (-1 - (this._scale.x - 1)) * this._origin.x,
                    y: (-1 - (this._scale.y - 1)) * this._origin.y,
                    w: this._scale.x,
                    h: this._scale.y,
                };
                if (this.#repeat) {
                    data.rx = this.#repeat.x;
                    data.ry = this.#repeat.y;
                    if (this.#gap) {
                        data.gx = this.#gap.x;
                        data.gy = this.#gap.y;
                    }
                }

                out.push(new RenderCommand(RENDER_CMD.DRAW_RECT, this.style, data));

                break;
            }
            case 'ELLIPSE': {
                const data: DrawDataShape = {
                    x: (-1 - (this._scale.x - 1)) * this._origin.x,
                    y: (-1 - (this._scale.y - 1)) * this._origin.y,
                    w: this._scale.x,
                    h: this._scale.y,
                };
                if (this.#repeat) {
                    data.rx = this.#repeat.x;
                    data.ry = this.#repeat.y;
                    if (this.#gap) {
                        data.gx = this.#gap.x;
                        data.gy = this.#gap.y;
                    }
                }

                out.push(new RenderCommand(RENDER_CMD.DRAW_ELLIPSE, this.style, data));

                break;
            }
        }
    }
}
