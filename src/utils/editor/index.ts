import { Engine } from '../engine';
import { C_CameraDrag } from '../engine/components/CameraDrag';
import { C_Shape } from '../engine/components/Shape';
import { Entity } from '../engine/entities';
import { MouseButton, type Position } from '../engine/types';

class Cursor extends Entity {
    #baseScale: number = 8;
    #shapeComp: C_Shape;
    #opacity: number = 0;

    constructor() {
        const comp = new C_Shape('cursor', 'ELLIPSE', {
            fillStyle: 'blue',
            strokeStyle: 'white',
            lineWidth: 2,
            globalAlpha: 0,
        });

        super('cursor', comp, new C_CameraDrag(MouseButton.MIDDLE, MouseButton.RIGHT));

        this.setScale({ x: this.#baseScale, y: this.#baseScale });
        this.#shapeComp = comp;
    }

    override update(deltaTime: number): boolean {
        let updated = super.update(deltaTime);

        if (window.engine.mouseState.justMoved) {
            this.setPosition(window.engine.mouseToWorld(window.engine.mouseState));

            updated = true;
        }

        const active = window.engine.mouseState.onScreen;
        const targetOpacity = active ? 1 : 0;
        if (this.#opacity !== targetOpacity) {
            this.#opacity = Math.max(
                0,
                Math.min(1, this.#opacity + deltaTime * (active ? 5 : -10)),
            );
            this.#shapeComp.style.globalAlpha = this.#opacity;
            updated = true;
        }

        const targetScale = this.#baseScale / window.engine.camera.zoom;
        if (this._transform.scale.x !== targetScale) {
            this.setScale({ x: targetScale, y: targetScale });
            updated = true;
        }

        return updated;
    }
}

const generateNestedBoxes = (count: number, pattern: Position[]): Entity => {
    let currEntity: Entity | null = null,
        root: Entity | null = null;
    for (let i = 0; i < count; i++) {
        const frame = pattern[i % pattern.length];
        const entity = new Entity(
            `Nested Box Level ${i + 1}`,
            new C_Shape(`Box Level ${i + 1}`, 'RECT', {
                fillStyle: `hsl(${(i * 40) % 360}, 70%, 50%)`,
            }),
        )
            .setScale({ x: 0.75, y: 0.75 })
            .setPosition(frame)
            .rotate(12 * (i % 2 === 0 ? 1 : -1));
        if (!currEntity) {
            root = entity;
        } else {
            currEntity.addChildren(entity);
        }

        currEntity = entity;
    }

    return root!;
};

const NUM_BOXES = 50;

export class Editor extends Engine {
    #rotatingBox: Entity;

    constructor() {
        super();

        this.#rotatingBox = generateNestedBoxes(NUM_BOXES, [{ x: 0, y: 0 }])
            .setScale({ x: 200, y: 200 })
            .rotate(45)
            .addChildren(
                new Entity('Top Left', new C_Shape('Dot', 'ELLIPSE', { fillStyle: 'yellow' }))
                    .setScale({ x: 0.25, y: 0.25 })
                    .setPosition({ x: -0.5, y: -0.5 }),
                new Entity('Top Right', new C_Shape('Dot', 'ELLIPSE', { fillStyle: 'green' }))
                    .setScale({ x: 0.25, y: 0.25 })
                    .setPosition({ x: 0.5, y: -0.5 }),
                new Entity('Bottom Left', new C_Shape('Dot', 'ELLIPSE', { fillStyle: 'blue' }))
                    .setScale({ x: 0.25, y: 0.25 })
                    .setPosition({ x: -0.5, y: 0.5 }),
                new Entity('Bottom Right', new C_Shape('Dot', 'ELLIPSE', { fillStyle: 'purple' }))
                    .setScale({ x: 0.25, y: 0.25 })
                    .setPosition({ x: 0.5, y: 0.5 }),
                new Entity('Center Behind', new C_Shape('Dot', 'ELLIPSE', { fillStyle: 'orange' }))
                    .setZIndex(-1)
                    .setScale({ x: 1.25, y: 1.25 }),
                new Entity(
                    'Center Above',
                    new C_Shape('Dot', 'ELLIPSE', { fillStyle: 'white' }),
                ).setScale({ x: 0.02, y: 0.02 }),
            )
            .setZIndex(-1);
        this.addEntities(this.#rotatingBox);

        this.addEntities(
            generateNestedBoxes(NUM_BOXES, [{ x: 0.25, y: 0.25 }])
                .setPosition({
                    x: -400,
                    y: -400,
                })
                .setScale({ x: 300, y: 300 }),
            generateNestedBoxes(NUM_BOXES, [{ x: -0.25, y: 0.25 }])
                .setPosition({
                    x: 400,
                    y: -400,
                })
                .setScale({ x: 300, y: 300 }),
            generateNestedBoxes(NUM_BOXES, [{ x: 0.25, y: -0.25 }])
                .setPosition({
                    x: -400,
                    y: 400,
                })
                .setScale({ x: 300, y: 300 }),
            generateNestedBoxes(NUM_BOXES, [{ x: -0.25, y: -0.25 }])
                .setPosition({
                    x: 400,
                    y: 400,
                })
                .setScale({ x: 300, y: 300 }),
        );

        this.addEntities(new Cursor());
    }

    override _update(deltaTime: number): boolean {
        this.#rotatingBox.rotate(90 * deltaTime);

        return true;
    }
}
