import { C_Shape } from '../../engine/components/Shape';
import { C_Line } from '../../engine/components/Line';
import { Entity } from '../../engine/entities';
import { Scene } from '../../engine/systems/scene';
import type { Loophole_EntityWithID, Loophole_ExtendedEntityType } from '../externalLevelSchema';
import { C_PointerTarget } from '../../engine/components/PointerTarget';
import { getAppStore } from '@/utils/store';
import { C_Image } from '@/utils/engine/components/Image';
import type { LevelEditor } from '..';
import { PointerButton } from '@/utils/engine/systems/pointer';
import {
    ENTITY_METADATA,
    ENTITY_TYPE_DRAW_ORDER,
    getLoopholeEntityDegreeRotation,
    getLoopholeEntityEdgeAlignment,
    getLoopholeEntityExtendedType,
    getLoopholeEntityPosition,
    getLoopholeEntityPositionType,
    loopholePositionToEnginePosition,
    TILE_SIZE,
} from '@/utils/utils';
import { C_Lerp, C_LerpOpacity, C_LerpPosition } from '@/utils/engine/components/Lerp';
import type { Position } from '@/utils/engine/types';

const ACTIVE_TILE_OPACITY = 0.3;
const TILE_HIGHLIGHT_SCALE_MULT = 1.2;

type TileVariant = 'default' | 'entrance' | 'exit';

export class E_Tile extends Entity {
    #editor: LevelEditor;
    #entity: Loophole_EntityWithID;
    #type: Loophole_ExtendedEntityType;
    #variant: TileVariant = 'default';

    #initialized: boolean = false;

    #tileImage: C_Image;
    #positionLerp: C_Lerp<Position>;

    #highlightEntity: Entity;
    #pointerTarget: C_PointerTarget;
    #highlightShape: C_Shape;
    #opacityLerp: C_Lerp<number>;

    #guyImage: C_Image | null = null;

    constructor(editor: LevelEditor, entity: Loophole_EntityWithID) {
        super('tile');

        this.#editor = editor;
        this.#entity = entity;
        this.#type = getLoopholeEntityExtendedType(entity);
        this.#tileImage = new C_Image('tile', '', {
            imageSmoothingEnabled: false,
        });
        this.#positionLerp = new C_LerpPosition(this, 20);
        this.addComponents(this.#tileImage, this.#positionLerp);

        this.#highlightEntity = new Entity('target');
        this.#pointerTarget = new C_PointerTarget();
        this.#pointerTarget.canInteract = false;
        this.#highlightShape = new C_Shape('shape', 'RECT', {
            fillStyle: 'white',
            globalAlpha: 0,
        }).setScale(1 / TILE_HIGHLIGHT_SCALE_MULT);
        this.#opacityLerp = new C_LerpOpacity(this.#highlightShape, 5);
        this.#highlightEntity.addComponents(
            this.#pointerTarget,
            this.#highlightShape,
            this.#opacityLerp,
        );

        this.addEntities(this.#highlightEntity);
    }

    get entity(): Loophole_EntityWithID {
        return this.#entity;
    }

    set entity(entity: Loophole_EntityWithID) {
        this.#entity = entity;
        this.#onEntityChanged();
    }

    get variant(): TileVariant {
        return this.#variant;
    }

    set variant(variant: TileVariant) {
        this.#variant = variant;
        if (variant === 'entrance') {
            if (!this.#guyImage) {
                this.#guyImage = new C_Image('guy', 'Guy');
                this.addComponents(this.#guyImage);
            }
        } else {
            if (this.#guyImage) {
                this.removeComponent(this.#guyImage);
                this.#guyImage = null;
            }
        }
    }

    get initialized(): boolean {
        return this.#initialized;
    }

    set initialized(initialized: boolean) {
        this.#initialized = initialized;
    }

    override update(deltaTime: number) {
        const { brushEntityType, selectedTiles, setSelectedTiles, lockedLayers } = getAppStore();
        this.#pointerTarget.canInteract = Boolean(!lockedLayers[this.#type]);
        const hoveredByPointer = this.#pointerTarget.isPointerHovered && brushEntityType === null;
        const active = hoveredByPointer || selectedTiles[this.entity.tID] !== undefined;

        if (hoveredByPointer && this.#editor.pointerState[PointerButton.LEFT].clicked) {
            if (this.#editor.getKey('Meta').down || this.#editor.getKey('Control').down) {
                const newSelectedTiles = { ...selectedTiles };
                if (this.entity.tID in newSelectedTiles) {
                    delete newSelectedTiles[this.entity.tID];
                } else {
                    newSelectedTiles[this.entity.tID] = this;
                }
                setSelectedTiles(Object.values(newSelectedTiles));
            } else {
                setSelectedTiles([this]);
            }

            this.#editor.capturePointerButtonClick(PointerButton.LEFT);
        }

        this.#opacityLerp.target = active ? ACTIVE_TILE_OPACITY : 0;

        return super.update(deltaTime);
    }

    syncVisualState() {
        const { selectedTiles } = getAppStore();
        this.#highlightShape.style.globalAlpha =
            this.entity.tID in selectedTiles ? ACTIVE_TILE_OPACITY : 0;
    }

    stashTile() {
        this.initialized = false;
        this.setEnabled(false);
        this.#highlightEntity.setEnabled(false);
    }

    #onEntityChanged() {
        const loopholePosition = getLoopholeEntityPosition(this.#entity);
        const edgeAlignment = getLoopholeEntityEdgeAlignment(this.#entity);
        const enginePosition = loopholePositionToEnginePosition(loopholePosition, edgeAlignment);
        this.#type = getLoopholeEntityExtendedType(this.#entity);
        const positionType = getLoopholeEntityPositionType(this.#entity);
        const { name, tileScale: tileScaleOverride = 1 } = ENTITY_METADATA[this.#type];

        this.setScale(tileScaleOverride * TILE_SIZE);
        this.setRotation(getLoopholeEntityDegreeRotation(this.#entity));

        const newPosition = {
            x: enginePosition.x * TILE_SIZE,
            y: enginePosition.y * TILE_SIZE,
        };
        this.#positionLerp.target = newPosition;
        if (!this.#initialized) {
            this.setPosition(newPosition);
            this.#initialized = true;
        }

        this.setZIndex(ENTITY_TYPE_DRAW_ORDER[this.#entity.entityType] + 1);
        this.#tileImage.imageName = name;
        this.#highlightEntity.setEnabled(true).setScale(
            positionType === 'CELL'
                ? TILE_HIGHLIGHT_SCALE_MULT
                : {
                      x: 0.5 * TILE_HIGHLIGHT_SCALE_MULT,
                      y: TILE_HIGHLIGHT_SCALE_MULT,
                  },
        );
    }
}

const DOT_SIZE = 8;
const DOT_GAP = TILE_SIZE / DOT_SIZE;

export class E_Grid extends Entity {
    #shape: C_Shape;

    constructor() {
        super('grid');

        this.#shape = new C_Shape(
            'dots',
            'ELLIPSE',
            { fillStyle: 'white', globalAlpha: 0.5 },
            {
                x: 1,
                y: 1,
            },
            {
                x: DOT_GAP,
                y: DOT_GAP,
            },
        );
        this.setScale(DOT_SIZE)
            .addComponents(this.#shape)
            .setPosition(-TILE_SIZE / 2);
    }

    override update(deltaTime: number) {
        if (window.engine?.canvasSize) {
            const topLeft = window.engine.screenToWorld({ x: 0, y: 0 }),
                bottomRight = window.engine.screenToWorld(window.engine.canvasSize);
            const gridTopLeft = {
                    x: Math.floor((topLeft.x - TILE_SIZE / 2) / TILE_SIZE),
                    y: Math.floor((topLeft.y - TILE_SIZE / 2) / TILE_SIZE),
                },
                gridBottomRight = {
                    x: Math.floor((bottomRight.x + TILE_SIZE / 2) / TILE_SIZE),
                    y: Math.floor((bottomRight.y + TILE_SIZE / 2) / TILE_SIZE),
                };

            this.setPosition({
                x: gridTopLeft.x * TILE_SIZE + TILE_SIZE / 2,
                y: gridTopLeft.y * TILE_SIZE + TILE_SIZE / 2,
            });

            this.#shape.repeat = {
                x: Math.abs(gridTopLeft.x - gridBottomRight.x),
                y: Math.abs(gridTopLeft.y - gridBottomRight.y),
            };
        }

        return super.update(deltaTime);
    }
}

const AXIS_LENGTH = 5;

export class GridScene extends Scene {
    override create() {
        const axisStyle = {
            fillStyle: '#888888',
            strokeStyle: '#888888',
            lineWidth: 1,
        } as const;

        [
            new Entity('x-axis')
                .addComponents(
                    new C_Line(
                        'x-axis-line',
                        { x: -AXIS_LENGTH * TILE_SIZE, y: 0 },
                        { x: AXIS_LENGTH * TILE_SIZE, y: 0 },
                        axisStyle,
                    ),
                )
                .setScaleToCamera({ x: false, y: true }),
            new Entity('y-axis')
                .addComponents(
                    new C_Line(
                        'y-axis-line',
                        { x: 0, y: -AXIS_LENGTH * TILE_SIZE },
                        { x: 0, y: AXIS_LENGTH * TILE_SIZE },
                        axisStyle,
                    ),
                )
                .setScaleToCamera({ x: true, y: false }),
        ].forEach((line) => line.setParent(this));

        this.addEntities(new E_Grid());
    }
}
