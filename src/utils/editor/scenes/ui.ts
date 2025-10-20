import { ENTITY_METADATA, TILE_CENTER_FRACTION, TILE_SIZE } from '@/utils/utils';
import { Entity } from '../../engine/entities';
import { Scene } from '../../engine/systems/scene';
import { C_Image } from '@/utils/engine/components/Image';
import { getAppStore } from '@/utils/store';
import type { Loophole_ExtendedEntityType, Loophole_Int2 } from '../externalLevelSchema';
import { MouseButton } from '@/utils/engine/systems/pointer';
import type { Editor } from '..';

class E_Cursor extends Entity {
    #editor: Editor;
    #image: C_Image;

    constructor(editor: Editor) {
        const comp = new C_Image('cursor', ENTITY_METADATA['MUSHROOM_BLUE'].name, {
            imageSmoothingEnabled: false,
            globalAlpha: 0,
        });

        super('cursor', comp);

        this.#editor = editor;
        this.setZIndex(50);
        this.setScale({ x: TILE_SIZE * TILE_CENTER_FRACTION, y: TILE_SIZE * TILE_CENTER_FRACTION });
        this.#image = comp;
    }

    override update(deltaTime: number): boolean {
        let updated = super.update(deltaTime);

        const { selectedEntityType } = getAppStore();
        let active = false;
        if (window.engine.pointerState.onScreen && selectedEntityType) {
            const { positionType, name } = ENTITY_METADATA[selectedEntityType];
            this.#image.imageName = name;

            let tilePosition: Loophole_Int2 = { x: 0, y: 0 };
            if (positionType === 'CELL') {
                tilePosition = {
                    x: Math.round(window.engine.pointerState.worldPosition.x / TILE_SIZE),
                    y: Math.round(window.engine.pointerState.worldPosition.y / TILE_SIZE),
                };
            } else {
                const cellX = Math.round(window.engine.pointerState.worldPosition.x / TILE_SIZE);
                const cellY = Math.round(window.engine.pointerState.worldPosition.y / TILE_SIZE);
                const localX = window.engine.pointerState.worldPosition.x - cellX * TILE_SIZE;
                const localY = window.engine.pointerState.worldPosition.y - cellY * TILE_SIZE;

                if (Math.abs(localX) > Math.abs(localY)) {
                    tilePosition = {
                        x: localX > 0 ? (cellX + 0.5) * TILE_SIZE : cellX - 0.5,
                        y: cellY,
                    };
                    this.setRotation(0);
                } else {
                    tilePosition = {
                        x: cellX * TILE_SIZE,
                        y: localY > 0 ? (cellY + 0.5) * TILE_SIZE : (cellY - 0.5) * TILE_SIZE,
                    };
                    this.setRotation(90);
                }

                active = true;
            }

            this.setPosition({
                x: tilePosition.x * TILE_SIZE,
                y: tilePosition.y * TILE_SIZE,
            });

            if (window.engine.pointerState[MouseButton.LEFT].pressed) {
                this.#placeEntityAtTile(tilePosition, selectedEntityType);
            }
            active = true;
            updated = true;
        }

        const targetOpacity = active ? 1 : 0;
        const opacity = this.#image.style.globalAlpha ?? 1;
        if (opacity !== targetOpacity) {
            this.#image.style.globalAlpha = Math.max(0, Math.min(1, opacity + deltaTime * 10));
            updated = true;
        }

        return updated;
    }

    #placeEntityAtTile(position: Loophole_Int2, entityType: Loophole_ExtendedEntityType) {
        this.#editor.addTileEntities(position, ENTITY_METADATA[entityType].createEntity(position));
    }
}

export class UIScene extends Scene {
    override create(editor: Editor) {
        this.rootEntity?.setZIndex(100);

        this.addEntities(new E_Cursor(editor));
    }
}
