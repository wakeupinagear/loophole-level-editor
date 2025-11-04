import { useAppStore } from '@/utils/stores';
import Panel from './Panel';
import clsx from 'clsx';
import type { E_Tile } from '@/utils/levelEditor/scenes/grid';
import { useMemo } from 'react';
import {
    calculateSelectionCenter,
    ENTITY_METADATA,
    getLoopholeEntityChannel,
    getLoopholeEntityExtendedType,
} from '@/utils/utils';
import { RotateCcw, RotateCw, Trash } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

function computeSharedValue<T>(
    tiles: E_Tile[],
    getter: (tile: E_Tile) => T | null,
): { sharedValue: boolean; value: T | null } {
    let shared = true;
    let value: T | null = null;
    for (const tile of tiles) {
        const tileValue = getter(tile);
        if (tileValue !== null) {
            if (value !== null && value !== tileValue) {
                shared = false;
                break;
            }
            value = tileValue;
        }
    }

    return { sharedValue: shared, value };
}

interface EntityInspectorProps {
    className?: string;
}

export function EntityInspector({ className }: EntityInspectorProps) {
    const selectedTiles = useAppStore((state) => state.selectedTiles);
    const numTiles = Object.keys(selectedTiles).length;

    return (
        <Panel className={clsx(className, 'flex flex-col gap-4')}>
            {numTiles > 0 ? (
                <MultiTileContent selectedTiles={Object.values(selectedTiles)} />
            ) : (
                <EmptyContent />
            )}
        </Panel>
    );
}

interface MultiTileContentProps {
    selectedTiles: E_Tile[];
}

function MultiTileContent({ selectedTiles }: MultiTileContentProps) {
    const setSelectedTiles = useAppStore((state) => state.setSelectedTiles);

    const tileInfo = useMemo(() => {
        return selectedTiles.map((tile) => ({
            entity: tile.entity,
            extendedType: getLoopholeEntityExtendedType(tile.entity),
        }));
    }, [selectedTiles]);
    const multiple = selectedTiles.length > 1;
    const primaryTile = selectedTiles[0];
    const primaryInfo = tileInfo[0];
    const allSameType = tileInfo.every((ti) => ti.extendedType === primaryInfo.extendedType);
    const name = allSameType
        ? `${
              multiple ? `${tileInfo.length} ` : ''
          }${ENTITY_METADATA[primaryInfo.extendedType].name}${multiple ? 's' : ''}`
        : `${tileInfo.length} Entities`;

    const rotateEntities = (rotation: 90 | -90) => {
        const center = calculateSelectionCenter(selectedTiles);
        const entities = window.engine?.rotateEntities(
            selectedTiles.map((t) => t.entity),
            center,
            rotation,
        );
        if (entities) {
            setSelectedTiles(entities);
        }
    };

    return (
        <>
            <div className="flex gap-2 items-center">
                <h2>{name}</h2>
                {selectedTiles.length === 1 && primaryTile.variant === 'entrance' && (
                    <Badge
                        variant="destructive"
                        className="bg-blue-500 text-white dark:bg-blue-600"
                    >
                        Entrance
                    </Badge>
                )}
                {selectedTiles.some((t) => t.variant === 'default') && (
                    <button
                        onClick={() =>
                            window.engine?.removeEntities(selectedTiles.map((t) => t.entity))
                        }
                        className="ml-auto"
                    >
                        <Trash size={20} />
                    </button>
                )}
            </div>
            <div className="grid grid-cols-[min-content_1fr] gap-2 items-center justify-items-start">
                <label>Rotate</label>
                <div className="flex gap-2">
                    <Button size="icon-lg" variant="outline" onClick={() => rotateEntities(-90)}>
                        <RotateCcw />
                    </Button>
                    <Button size="icon-lg" variant="outline" onClick={() => rotateEntities(90)}>
                        <RotateCw />
                    </Button>
                </div>
                {tileInfo.every((ti) => ENTITY_METADATA[ti.extendedType].hasChannel) && (
                    <ChannelInput selectedTiles={selectedTiles} />
                )}
            </div>
        </>
    );
}

interface ChannelInputProps {
    selectedTiles: E_Tile[];
}

function ChannelInput({ selectedTiles }: ChannelInputProps) {
    const { sharedValue, value: channel } = useMemo(
        () => computeSharedValue(selectedTiles, (tile) => getLoopholeEntityChannel(tile.entity)),
        [selectedTiles],
    );

    return (
        <>
            <label htmlFor="channel-input">Channel</label>
            <Input
                type="number"
                id="channel-input"
                name="channel"
                value={sharedValue && channel !== null ? channel : ''}
                placeholder={sharedValue ? undefined : '— multiple values —'}
                onChange={(e) => {
                    const newChannel = e.target.value === '' ? null : parseInt(e.target.value, 10);
                    if (newChannel !== null && newChannel !== undefined) {
                        window.engine?.updateEntities(
                            selectedTiles.map((t) => t.entity),
                            { channel: newChannel },
                        );
                    }
                }}
                className="border border-gray-300 rounded-md px-2 py-1"
            />
        </>
    );
}

function EmptyContent() {
    return (
        <>
            <h2>No Entity Selected</h2>
        </>
    );
}
