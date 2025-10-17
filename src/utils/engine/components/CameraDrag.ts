import { Component } from '.';
import { MouseButton, type Position } from '../types';

export class C_CameraDrag extends Component {
    #mouseButtons: MouseButton[] = [];

    #dragStartMousePosition: Position | null = null;
    #dragStartCameraPosition: Position | null = null;

    constructor(...mouseButtons: MouseButton[]) {
        super('Camera Drag');
        this.#mouseButtons = mouseButtons.length > 0 ? mouseButtons : [MouseButton.MIDDLE];
    }

    override update(deltaTime: number): boolean {
        let updated = super.update(deltaTime);
        if (!window.engine.canvasSize) {
            return updated;
        }

        const buttonStates = this.#mouseButtons.map((btn) => window.engine.mouseState[btn]);
        if (buttonStates.some((state) => state.pressed) && !this.#dragStartMousePosition) {
            this.#dragStartMousePosition = { ...window.engine.mouseState };
            this.#dragStartCameraPosition = {
                x: window.engine.camera.position.x - window.engine.canvasSize.x / 2,
                y: window.engine.camera.position.y - window.engine.canvasSize.y / 2,
            };
        }

        if (window.engine.mouseState.justMoved) {
            if (
                buttonStates.some((state) => state.down) &&
                this.#dragStartMousePosition &&
                this.#dragStartCameraPosition
            ) {
                const mouseDelta = {
                    x: this.#dragStartMousePosition.x - window.engine.mouseState.x,
                    y: this.#dragStartMousePosition.y - window.engine.mouseState.y,
                };
                const worldDelta = window.engine.mouseToWorld(mouseDelta, true);
                window.engine.setCameraPosition({
                    x: this.#dragStartCameraPosition.x - worldDelta.x,
                    y: this.#dragStartCameraPosition.y - worldDelta.y,
                });
            }

            updated = true;
        }

        if (buttonStates.some((state) => state.released) && this.#dragStartMousePosition) {
            this.#dragStartMousePosition = null;
            this.#dragStartCameraPosition = null;
        }

        return updated;
    }
}
