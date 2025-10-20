import { C_Shape } from '../../engine/components/Shape';
import { Entity } from '../../engine/entities';
import { Scene } from '../../engine/systems/scene';
import {
    ENTITY_METADATA,
    ENTITY_TYPE_DRAW_ORDER,
    TILE_CENTER_FRACTION,
    TILE_EDGE_HEIGHT_FRACTION,
    TILE_EDGE_WIDTH_FRACTION,
    TILE_SIZE,
} from '../../utils';
import type { Loophole_Entity, Loophole_Int2 } from '../externalLevelSchema';
import { C_PointerTarget } from '../../engine/components/PointerTarget';
import type { Component } from '../../engine/components';
import { getAppStore } from '@/utils/store';
import { C_Image } from '@/utils/engine/components/Image';

const GRID_BUFFER = 2;

class E_Grid extends Entity {
    #shapeComponent: C_Shape;

    constructor() {
        const comp = new C_Shape(
            'cursor',
            'RECT',
            {
                strokeStyle: 'lightgrey',
                fillStyle: 'darkgrey',
                lineWidth: 2,
            },
            { x: 1, y: 1 },
        );

        super('grid', comp);
        this.#shapeComponent = comp;
        this.setScale({ x: TILE_SIZE, y: TILE_SIZE });
    }

    override update(): boolean {
        const engine = window.engine;
        if (!engine || !engine.canvas || !engine.canvasSize) {
            return false;
        }

        const { x: canvasWidth, y: canvasHeight } = engine.canvasSize;
        const camera = engine.camera;
        const zoom = camera.zoom;

        // Calculate the viewable area in world space
        const worldWidth = canvasWidth / zoom;
        const worldHeight = canvasHeight / zoom;

        // Calculate the top-left corner of the viewable area
        const viewLeft = -camera.position.x / camera.zoom - worldWidth / 2;
        const viewTop = -camera.position.y / camera.zoom - worldHeight / 2;

        // Calculate the nearest tile position to the top-left, outside the viewable area
        // We want to align to grid so that 0,0 falls on the corner between 4 tiles
        const gridLeft = Math.floor(viewLeft / TILE_SIZE) * TILE_SIZE;
        const gridTop = Math.floor(viewTop / TILE_SIZE) * TILE_SIZE;

        // Update entity position
        this.setPosition({ x: gridLeft, y: gridTop });

        // Calculate how many tiles we need to cover the canvas plus a buffer
        const buffer = Math.ceil(GRID_BUFFER / camera.zoom);
        const tilesX = Math.ceil(worldWidth / TILE_SIZE) + buffer;
        const tilesY = Math.ceil(worldHeight / TILE_SIZE) + buffer;

        // Update the repeat parameter
        this.#shapeComponent.repeat = { x: tilesX, y: tilesY };

        return true;
    }
}

export abstract class E_Tile extends Entity {
    _tilePosition: Loophole_Int2;
    _entities: Loophole_Entity[] = [];

    protected _images: C_Image[] = [];
    protected _entitiesDirty: boolean = true;

    constructor(name: string, position: Loophole_Int2, ...components: Component[]) {
        super(name, ...components);

        this.setPosition(position);
        this._tilePosition = position;
    }

    get tilePosition(): Readonly<Loophole_Int2> {
        return this._tilePosition;
    }

    set tilePosition(position: Loophole_Int2) {
        this._tilePosition = position;
    }

    get entities(): ReadonlyArray<Loophole_Entity> {
        return this._entities;
    }

    addEntities(entities: Loophole_Entity[]) {
        this._entities.push(...entities);
        this._entities.sort(
            (a, b) => ENTITY_TYPE_DRAW_ORDER[a.entityType] - ENTITY_TYPE_DRAW_ORDER[b.entityType],
        );
        console.log('Sorted entities:', this._entities);
        this._entitiesDirty = true;
    }

    clearEntities() {
        this._entities = [];
        this._entitiesDirty = true;
    }
}

export class E_Cell extends E_Tile {
    #pointerTarget: C_PointerTarget;
    #cell: Entity;

    constructor(position: Loophole_Int2) {
        super('cell', position);

        this.#pointerTarget = new C_PointerTarget();
        this.#cell = new Entity('cell-shape', this.#pointerTarget).setScale({
            x: TILE_CENTER_FRACTION,
            y: TILE_CENTER_FRACTION,
        });
        this.addChildren(this.#cell);
    }

    override update(): boolean {
        if (this.#pointerTarget.isPointerOver) {
            getAppStore().setHighlightedEngineTile(this);
        }

        if (this._entitiesDirty) {
            while (this._images.length < this._entities.length) {
                const img = new C_Image('entityImage', '', {
                    imageSmoothingEnabled: false,
                }).setEnabled(false);
                this.#cell.addComponents(img);
                this._images.push(img);
            }

            for (let i = 0; i < this._images.length; i++) {
                if (i < this._entities.length) {
                    const img = this._images[i];
                    img.setEnabled(true);

                    const entity = this._entities[i];
                    if ('mushroomType' in entity) {
                        img.imageName =
                            entity.mushroomType === 'BLUE'
                                ? 'MUSHROOM_BLUE'
                                : entity.mushroomType === 'GREEN'
                                  ? 'MUSHROOM_GREEN'
                                  : 'MUSHROOM_RED';
                    } else {
                        const { name } = ENTITY_METADATA[entity.entityType];
                        img.imageName = name;
                    }
                } else {
                    this._images[i].setEnabled(false);
                }
            }

            this._entitiesDirty = false;
            return true;
        }

        return false;
    }
}

interface EdgeData {
    rootEntity: Entity;
    shape: C_Shape;
    pointerTarget: C_PointerTarget;
    image: C_Image;
}

export class E_Edge extends E_Tile {
    #rightEdge: EdgeData;
    #topEdge: EdgeData;

    constructor(position: Loophole_Int2) {
        super('edge', position);

        const rightEdgeImage = new C_Image('rightEdgeImage', '', { imageSmoothingEnabled: false });
        const rightEdgeShape = new C_Shape('shape', 'RECT', { imageSmoothingEnabled: true });
        const rightEdgePointerTarget = new C_PointerTarget();
        this.#rightEdge = {
            rootEntity: new Entity('rightEdge', rightEdgeShape)
                .setPosition({ x: 0.5, y: 0 })
                .setScale({ x: TILE_EDGE_HEIGHT_FRACTION, y: TILE_EDGE_WIDTH_FRACTION })
                .addComponents(rightEdgeShape, rightEdgeImage, rightEdgePointerTarget),
            shape: rightEdgeShape,
            pointerTarget: rightEdgePointerTarget,
            image: rightEdgeImage,
        };

        const topEdgeImage = new C_Image('topEdgeImage', '', { imageSmoothingEnabled: false });
        const topEdgeShape = new C_Shape('shape', 'RECT', {
            imageSmoothingEnabled: true,
        });
        const topEdgePointerTarget = new C_PointerTarget();
        this.#topEdge = {
            rootEntity: new Entity('topEdge', topEdgeShape)
                .setPosition({ x: 0, y: -0.5 })
                .setScale({ x: TILE_EDGE_WIDTH_FRACTION, y: TILE_EDGE_HEIGHT_FRACTION })
                .addComponents(topEdgeShape, topEdgeImage, topEdgePointerTarget),
            shape: topEdgeShape,
            pointerTarget: topEdgePointerTarget,
            image: topEdgeImage,
        };

        this.addChildren(this.#rightEdge.rootEntity, this.#topEdge.rootEntity);
    }

    override update(): boolean {
        const { setHighlightedEngineTile } = getAppStore();
        if (this.#rightEdge.pointerTarget.isPointerOver) {
            setHighlightedEngineTile(this);
        }
        if (this.#topEdge.pointerTarget.isPointerOver) {
            setHighlightedEngineTile(this);
        }

        if (this._entitiesDirty) {
            this._entitiesDirty = false;

            return true;
        }

        return false;
    }
}

export class GridScene extends Scene {
    override create() {
        this.addEntities(
            new E_Grid().setZIndex(-1),
            new Entity('origin')
                .addComponents(
                    new C_Shape('origin', 'ELLIPSE', {
                        fillStyle: 'black',
                    }),
                )
                .setZIndex(0)
                .setScale({ x: 12, y: 12 }),
        );
    }
}
