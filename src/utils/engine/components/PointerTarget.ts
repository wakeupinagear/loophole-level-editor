import { Component } from '.';

export class C_PointerTarget extends Component {
    #onPointerEnter: () => void;
    #onPointerLeave: () => void;

    #isPointerOver: boolean = false;

    constructor(onPointerEnter: () => void, onPointerLeave: () => void) {
        super('PointerTarget');

        this.#onPointerEnter = onPointerEnter;
        this.#onPointerLeave = onPointerLeave;
    }
}
