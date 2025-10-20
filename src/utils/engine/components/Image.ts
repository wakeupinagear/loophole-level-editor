import { DrawableComponent } from '.';
import {
    RENDER_CMD,
    RenderCommand,
    type DrawDataImage,
    type RenderCommandStream,
    type RenderStyle,
} from '../systems/render';
import type { Position } from '../types';

export class C_Image extends DrawableComponent {
    #imageName: string;
    #repeat: Position | null;

    constructor(name: string, imageName: string, style?: RenderStyle, repeat?: Position) {
        super(name, style);

        this.#imageName = imageName;
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

        const data: DrawDataImage = {
            x: this.entity.transform.position.x - this.entity.transform.scale.x / 2,
            y: this.entity.transform.position.y - this.entity.transform.scale.y / 2,
            w: this.entity.transform.scale.x,
            h: this.entity.transform.scale.y,
            img: this.#imageName,
        };
        if (this.#repeat) {
            data.rx = this.#repeat.x;
            data.ry = this.#repeat.y;
        }

        out.push(new RenderCommand(RENDER_CMD.DRAW_IMAGE, this.style, data));
    }
}
