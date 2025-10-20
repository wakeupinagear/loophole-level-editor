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

    constructor(name: string, shape: Shape, style?: RenderStyle, repeat?: Position) {
        super(name, shape === 'ELLIPSE' ? { x: 0, y: 0 } : { x: 0.5, y: 0.5 }, style);

        this.#shape = shape;
        this.#repeat = repeat ?? null;
    }

    get repeat(): Position | null {
        return this.#repeat;
    }

    set repeat(repeat: Position | null) {
        this.#repeat = repeat;
    }

    override queueRenderCommands(out: RenderCommandStream): void {
        if (!this.entity?.transform) {
            return;
        }

        switch (this.#shape) {
            case 'RECT': {
                const data: DrawDataShape = {
                    x: -this._origin.x,
                    y: -this._origin.y,
                    w: 1,
                    h: 1,
                };
                if (this.#repeat) {
                    data.rx = this.#repeat.x;
                    data.ry = this.#repeat.y;
                }

                out.push(new RenderCommand(RENDER_CMD.DRAW_RECT, this.style, data));

                break;
            }
            case 'ELLIPSE': {
                const data: DrawDataShape = {
                    x: -this._origin.x,
                    y: -this._origin.y,
                    w: 1,
                    h: 1,
                };
                if (this.#repeat) {
                    data.rx = this.#repeat.x;
                    data.ry = this.#repeat.y;
                }

                out.push(new RenderCommand(RENDER_CMD.DRAW_ELLIPSE, this.style, data));

                break;
            }
        }
    }
}
