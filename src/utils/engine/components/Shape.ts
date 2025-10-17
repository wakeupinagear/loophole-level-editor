import {
    RENDER_CMD,
    RenderCommand,
    type RenderCommandStream,
    type RenderStyle,
} from '../systems/render';
import { DrawableComponent } from './index';

type Shape = 'RECT' | 'ELLIPSE';

export class C_Shape extends DrawableComponent {
    #shape: Shape;

    constructor(name: string, shape: Shape, style?: RenderStyle) {
        super(name, style);

        this.#shape = shape;
    }

    override queueRenderCommands(out: RenderCommandStream): void {
        if (!this.entity?.transform) {
            return;
        }

        switch (this.#shape) {
            case 'RECT':
                out.push(
                    new RenderCommand(RENDER_CMD.DRAW_RECT, this.style, {
                        x: -0.5,
                        y: -0.5,
                        w: 1,
                        h: 1,
                        fill: Boolean(this._style.fillStyle),
                        stroke: Boolean(this._style.strokeStyle),
                    }),
                );
                break;
            case 'ELLIPSE':
                out.push(
                    new RenderCommand(RENDER_CMD.DRAW_ELLIPSE, this.style, {
                        x: 0,
                        y: 0,
                        w: 1,
                        h: 1,
                        fill: Boolean(this._style.fillStyle),
                        stroke: Boolean(this._style.strokeStyle),
                    }),
                );
                break;
        }
    }
}
