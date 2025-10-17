import type { Entity } from '../entities';
import type { Renderable } from '../types';
import type { RenderCommandStream, RenderStyle } from '../systems/render';

export abstract class Component implements Renderable {
    protected static _nextId: number = 1;
    protected readonly _id: number;
    protected readonly _name: string;

    protected _enabled: boolean = true;

    protected _zIndex: number = 0;

    protected _entity: Entity | null = null;

    constructor(name: string) {
        this._name = name;
        this._id = Component._nextId++;
    }

    get id(): number {
        return this._id;
    }

    get name(): string {
        return this._name;
    }

    get enabled(): boolean {
        return this._enabled;
    }

    get zIndex(): number {
        return this._zIndex;
    }

    set enabled(enabled: boolean) {
        this._enabled = enabled;
    }

    get typeString(): string {
        return this.constructor.name;
    }

    get entity(): Entity | null {
        return this._entity;
    }

    set entity(entity: Entity | null) {
        this._entity = entity;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    update(_: number): boolean {
        return false;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    queueRenderCommands(_out: RenderCommandStream) {}

    setZIndex(zIndex: number): Component {
        this._zIndex = zIndex;
        if (this._entity) {
            this._entity.componentsZIndexDirty = true;
        }

        return this;
    }
}

export abstract class DrawableComponent extends Component {
    protected _style: RenderStyle;

    constructor(name: string, style?: RenderStyle) {
        super(name);

        this._style = style ?? {};
    }

    get style(): RenderStyle {
        return this._style;
    }

    set style(style: RenderStyle) {
        this._style = { ...this._style, ...style };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    queueRenderCommands(_out: RenderCommandStream): void {}
}
