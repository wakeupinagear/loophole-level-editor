import { Component } from '.';
import type { Position } from '../types';

export class C_Transform extends Component {
    #position: Position = { x: 0, y: 0 };
    #rotation: number = 0;
    #scale: Position = { x: 1, y: 1 };
    #localMatrix: DOMMatrix = new DOMMatrix();
    #localMatrixDirty: boolean = true;

    #worldMatrix: DOMMatrix = new DOMMatrix();
    #inverseWorldMatrix: DOMMatrix | null = null;
    #computedWorldVersion: number = 0;
    #inverseWorldDirty: boolean = true;

    constructor() {
        super('Transform');
    }

    get position(): Readonly<Position> {
        return this.#position;
    }

    get rotation(): number {
        return this.#rotation;
    }

    get scale(): Readonly<Position> {
        return this.#scale;
    }

    get localMatrix(): Readonly<DOMMatrix> {
        if (this.#localMatrixDirty) {
            this.#computeLocalMatrix();
            this.#localMatrixDirty = false;
        }
        return this.#localMatrix;
    }

    get worldMatrix(): Readonly<DOMMatrix> {
        return this.#worldMatrix;
    }

    get inverseWorldMatrix(): Readonly<DOMMatrix> {
        if (this.#inverseWorldDirty || !this.#inverseWorldMatrix) {
            this.#inverseWorldMatrix = this.#worldMatrix.inverse();
            this.#inverseWorldDirty = false;
        }
        return this.#inverseWorldMatrix;
    }

    get computedWorldVersion(): number {
        return this.#computedWorldVersion;
    }

    setPosition(position: Position): void {
        this.#position = { ...position };
        this.#localMatrixDirty = true;
    }

    setRotation(rotation: number): void {
        this.#rotation = rotation;
        this.#localMatrixDirty = true;
    }

    setScale(scale: Position): void {
        this.#scale = { ...scale };
        this.#localMatrixDirty = true;
    }

    translate(delta: Position): void {
        this.setPosition({
            x: this.#position.x + delta.x,
            y: this.#position.y + delta.y,
        });
    }

    rotate(delta: number): void {
        this.setRotation(this.#rotation + delta);
    }

    scaleBy(delta: Position): void {
        this.setScale({
            x: this.#scale.x * delta.x,
            y: this.#scale.y * delta.y,
        });
    }

    isStale(parentComputedWorldVersion: number, localVersion: number): boolean {
        return this.#computedWorldVersion !== parentComputedWorldVersion + localVersion;
    }

    #computeLocalMatrix() {
        this.#localMatrix = new DOMMatrix();
        this.#localMatrix.translateSelf(this.#position.x, this.#position.y);
        this.#localMatrix.rotateSelf(this.#rotation);
        this.#localMatrix.scaleSelf(this.#scale.x, this.#scale.y);
    }
}
