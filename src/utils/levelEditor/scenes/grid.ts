import { C_Shape } from '../../engine/components/Shape';
import { Entity } from '../../engine/entities';
import { Scene } from '../../engine/systems/scene';
import type { Loophole_EntityWithID, Loophole_Int2 } from '../externalLevelSchema';
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
import { C_Lerp } from '@/utils/engine/components/Lerp';
import type { Position } from '@/utils/engine/types';

const ACTIVE_TILE_OPACITY = 0.3;
const TILE_HIGHLIGHT_SCALE_MULT = 1.1;
const HANDLE_SIZE = 20;
const HANDLE_COLOR = '#4a9eff';
const HANDLE_HOVER_COLOR = '#6cb0ff';

export class E_Tile extends Entity {
    #editor: LevelEditor;
    #entity: Loophole_EntityWithID;

    #tileImage: C_Image;

    #highlightEntity: Entity;
    #pointerTarget: C_PointerTarget;
    #highlightShape: C_Shape;
    #opacityLerp: C_Lerp<number>;

    constructor(editor: LevelEditor, entity: Loophole_EntityWithID) {
        super('tile');

        this.#editor = editor;
        this.#entity = entity;
        this.#tileImage = new C_Image('tile', '', {
            imageSmoothingEnabled: false,
        });
        this.addComponents(this.#tileImage);

        this.#highlightEntity = new Entity('target');
        this.#pointerTarget = new C_PointerTarget();
        this.#highlightShape = new C_Shape('shape', 'RECT', {
            fillStyle: 'white',
            globalAlpha: 0,
        });
        this.#opacityLerp = new C_Lerp({
            get: (() => {
                return this.#highlightShape.style.globalAlpha ?? 0;
            }).bind(this),
            set: ((value: number) => {
                this.#highlightShape.style.globalAlpha = value;
            }).bind(this),
            speed: 5,
        });
        this.#highlightEntity.addComponents(
            this.#pointerTarget,
            this.#highlightShape,
            this.#opacityLerp,
        );

        this.addChildren(this.#highlightEntity);
    }

    get entity(): Loophole_EntityWithID {
        return this.#entity;
    }

    set entity(entity: Loophole_EntityWithID) {
        this.#entity = entity;
        this.#onEntityChanged();
    }

    override update(deltaTime: number) {
        const { brushEntityType, selectedTiles, setSelectedTiles } = getAppStore();
        const hoveredByPointer = this.#pointerTarget.isPointerHovered && brushEntityType === null;
        const active = hoveredByPointer || selectedTiles[this.entity.id] !== undefined;

        if (hoveredByPointer && this.#editor.pointerState[PointerButton.LEFT].clicked) {
            if (this.#editor.getKey('Meta').down || this.#editor.getKey('Control').down) {
                const newSelectedTiles = { ...selectedTiles };
                if (this.entity.id in newSelectedTiles) {
                    delete newSelectedTiles[this.entity.id];
                } else {
                    newSelectedTiles[this.entity.id] = this;
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
            this.entity.id in selectedTiles ? ACTIVE_TILE_OPACITY : 0;
    }

    #onEntityChanged() {
        const loopholePosition = getLoopholeEntityPosition(this.#entity);
        const edgeAlignment = getLoopholeEntityEdgeAlignment(this.#entity);
        const enginePosition = loopholePositionToEnginePosition(loopholePosition, edgeAlignment);
        const extendedType = getLoopholeEntityExtendedType(this.#entity);
        const positionType = getLoopholeEntityPositionType(this.#entity);
        const { name, tileScale: tileScaleOverride = 1 } = ENTITY_METADATA[extendedType];

        this.setScale({
            x: tileScaleOverride * TILE_SIZE,
            y: tileScaleOverride * TILE_SIZE,
        });
        this.setRotation(getLoopholeEntityDegreeRotation(this.#entity));
        this.setPosition({
            x: enginePosition.x * TILE_SIZE,
            y: enginePosition.y * TILE_SIZE,
        });
        this.setZIndex(ENTITY_TYPE_DRAW_ORDER[this.#entity.entityType] + 1);
        this.#tileImage.imageName = name;
        this.#highlightEntity.setScale(
            positionType === 'CELL'
                ? {
                      x: TILE_HIGHLIGHT_SCALE_MULT,
                      y: TILE_HIGHLIGHT_SCALE_MULT,
                  }
                : {
                      x: 0.3 * TILE_HIGHLIGHT_SCALE_MULT,
on                      y: TILE_HIGHLIGHT_SCALE_MULT,
                  },
        );
    }
}

class E_DragHandle extends Entity {
    #editor: LevelEditor;
    #handleShape: C_Shape;
    #pointerTarget: C_PointerTarget;
    #opacityLerp: C_Lerp<number>;

    #isDragging: boolean = false;
    #dragStartPosition: Position | null = null;
    #originalEntities: Map<string, Loophole_EntityWithID> = new Map();
    #dragOffset: Loophole_Int2 = { x: 0, y: 0 };

    constructor(editor: LevelEditor) {
        super('drag_handle');

        this.#editor = editor;
        this.#handleShape = new C_Shape('handle', 'ELLIPSE', {
            fillStyle: HANDLE_COLOR,
            globalAlpha: 0,
        });
        this.#pointerTarget = new C_PointerTarget({
            onPointerEnter: () => {
                if (!this.#isDragging) {
                    this.#handleShape.style.fillStyle = HANDLE_HOVER_COLOR;
                }
            },
            onPointerLeave: () => {
                if (!this.#isDragging) {
                    this.#handleShape.style.fillStyle = HANDLE_COLOR;
                }
            },
        });
        this.#opacityLerp = new C_Lerp({
            get: (() => this.#handleShape.style.globalAlpha ?? 0).bind(this),
            set: ((value: number) => {
                this.#handleShape.style.globalAlpha = value;
            }).bind(this),
            speed: 10,
        });

        this.addComponents(this.#handleShape, this.#pointerTarget, this.#opacityLerp);
        this.setScale({ x: HANDLE_SIZE, y: HANDLE_SIZE });
        this.setZIndex(200);
    }

    override update(deltaTime: number): boolean {
        const updated = super.update(deltaTime);
        const { selectedTiles, setSelectedTiles, brushEntityType, setIsDraggingTiles } =
            getAppStore();
        const selectedTileArray = Object.values(selectedTiles);
        const hasSelection = selectedTileArray.length > 0;

        // Show handle when tiles are selected and no brush is active
        const shouldShow = hasSelection && !brushEntityType;

        if (shouldShow) {
            // Calculate center of selected tiles
            const center = this.#calculateSelectionCenter(selectedTileArray);
            this.setPosition({
                x: center.x * TILE_SIZE,
                y: center.y * TILE_SIZE,
            });

            // Handle drag start
            if (
                this.#pointerTarget.isPointerHovered &&
                this.#editor.pointerState[PointerButton.LEFT].pressed &&
                !this.#isDragging
            ) {
                this.#isDragging = true;
                this.#dragStartPosition = { ...this.#editor.pointerState.worldPosition };
                this.#dragOffset = { x: 0, y: 0 };
                this.#originalEntities.clear();
                selectedTileArray.forEach((tile) => {
                    this.#originalEntities.set(tile.entity.id, { ...tile.entity });
                });
                this.#handleShape.style.fillStyle = HANDLE_HOVER_COLOR;
                setIsDraggingTiles(true);
                this.#editor.capturePointerButtonClick(PointerButton.LEFT);
            }

            // Handle dragging
            if (this.#isDragging) {
                const currentPos = this.#editor.pointerState.worldPosition;
                if (this.#dragStartPosition) {
                    const deltaX = currentPos.x - this.#dragStartPosition.x;
                    const deltaY = currentPos.y - this.#dragStartPosition.y;

                    // Convert to tile grid offset
                    const newOffsetX = Math.round(deltaX / TILE_SIZE);
                    const newOffsetY = Math.round(deltaY / TILE_SIZE);

                    // Only update if offset changed
                    if (newOffsetX !== this.#dragOffset.x || newOffsetY !== this.#dragOffset.y) {
                        this.#dragOffset = { x: newOffsetX, y: newOffsetY };
                        this.#updateTilePositions(selectedTileArray);
                    }
                }

                // Handle drag end
                if (this.#editor.pointerState[PointerButton.LEFT].released) {
                    this.#commitDrag();
                    this.#isDragging = false;
                    this.#dragStartPosition = null;
                    this.#handleShape.style.fillStyle = this.#pointerTarget.isPointerHovered
                        ? HANDLE_HOVER_COLOR
                        : HANDLE_COLOR;
                    setIsDraggingTiles(false);
                }

                // Handle drag cancel
                if (this.#editor.getKey('Escape').pressed) {
                    this.#cancelDrag(selectedTileArray);
                    this.#isDragging = false;
                    this.#dragStartPosition = null;
                    this.#handleShape.style.fillStyle = HANDLE_COLOR;
                    setIsDraggingTiles(false);
                }
            }

            // Handle rotation with R key
            if (
                this.#editor.getKey('r').pressed &&
                !this.#isDragging &&
                selectedTileArray.length > 0
            ) {
                const center = this.#calculateSelectionCenterInt(selectedTileArray);
                const rotation = this.#editor.getKey('Shift').down ? -90 : 90;
                const entities = selectedTileArray.map((t) => t.entity);
                const newTiles = this.#editor.rotateEntities(
                    entities,
                    center,
                    rotation as 90 | -90,
                );
                setSelectedTiles(newTiles);
                newTiles.forEach((t) => t.syncVisualState());
            }
        }

        this.#opacityLerp.target = shouldShow ? 0.8 : 0;

        return updated;
    }

    #calculateSelectionCenter(tiles: E_Tile[]): Position {
        let sumX = 0;
        let sumY = 0;

        tiles.forEach((tile) => {
            const pos = getLoopholeEntityPosition(tile.entity);
            const edgeAlign = getLoopholeEntityEdgeAlignment(tile.entity);
            const enginePos = loopholePositionToEnginePosition(pos, edgeAlign);
            sumX += enginePos.x;
            sumY += enginePos.y;
        });

        return {
            x: sumX / tiles.length,
            y: sumY / tiles.length,
        };
    }

    #calculateSelectionCenterInt(tiles: E_Tile[]): Loophole_Int2 {
        const center = this.#calculateSelectionCenter(tiles);
        return {
            x: Math.round(center.x),
            y: Math.round(center.y),
        };
    }

    #updateTilePositions(tiles: E_Tile[]) {
        tiles.forEach((tile) => {
            const originalEntity = this.#originalEntities.get(tile.entity.id);
            if (!originalEntity) return;

            const newEntity = { ...originalEntity };

            if ('edgePosition' in newEntity) {
                newEntity.edgePosition = {
                    ...newEntity.edgePosition,
                    cell: {
                        x: newEntity.edgePosition.cell.x + this.#dragOffset.x,
                        y: newEntity.edgePosition.cell.y + this.#dragOffset.y,
                    },
                };
            } else if ('position' in newEntity) {
                newEntity.position = {
                    x: newEntity.position.x + this.#dragOffset.x,
                    y: newEntity.position.y + this.#dragOffset.y,
                };
            }

            tile.entity = newEntity;
        });
    }

    #commitDrag() {
        if (this.#dragOffset.x === 0 && this.#dragOffset.y === 0) {
            return;
        }

        const originalEntities = Array.from(this.#originalEntities.values());
        const newTiles = this.#editor.moveEntities(originalEntities, this.#dragOffset);

        getAppStore().setSelectedTiles(newTiles);
        newTiles.forEach((t) => t.syncVisualState());
        this.#originalEntities.clear();
    }

    #cancelDrag(tiles: E_Tile[]) {
        // Restore original positions
        tiles.forEach((tile) => {
            const originalEntity = this.#originalEntities.get(tile.entity.id);
            if (originalEntity) {
                tile.entity = originalEntity;
            }
        });

        this.#originalEntities.clear();
        this.#dragOffset = { x: 0, y: 0 };
    }
}

export class GridScene extends Scene {
    #prevChildrenCount: number = 0;
    #editor: LevelEditor | null = null;

    override create(editor: LevelEditor) {
        this.#editor = editor;

        this.addEntities(
            new Entity('origin')
                .addComponents(
                    new C_Shape('origin', 'ELLIPSE', {
                        fillStyle: 'white',
                    }),
                )
                .setScale({ x: 12, y: 12 })
                .setZIndex(100),
            new E_DragHandle(editor),
        );
    }

    override update() {
        if (this.#prevChildrenCount !== this.rootEntity?.children.length) {
            this.#prevChildrenCount = this.rootEntity?.children.length ?? 0;
        }

        return false;
    }
}
