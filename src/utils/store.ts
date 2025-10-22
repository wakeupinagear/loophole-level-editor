import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createLevelWithMetadata, type LevelWithMetadata } from './utils';
import type {
    Loophole_ExtendedEntityType,
    Loophole_Rotation,
} from './levelEditor/externalLevelSchema';
import { useMemo } from 'react';
import type { E_Tile } from './levelEditor/scenes/grid';

interface AppStore {
    levels: Record<string, LevelWithMetadata>;
    activeLevelID: string;
    addLevel: (level: LevelWithMetadata) => void;
    setActiveLevelID: (levelID: string) => void;
    removeLevel: (levelID: string) => void;
    updateLevel: (level: Partial<LevelWithMetadata>) => void;
    highlightedEngineTile: E_Tile | null;
    setHighlightedEngineTile: (tile: E_Tile | null) => void;
    selectedEntityType: Loophole_ExtendedEntityType | null;
    setSelectedEntityType: (entityType: Loophole_ExtendedEntityType | null) => void;
    selectedEntityRotation: Loophole_Rotation;
    setSelectedEntityRotation: (rotation: Loophole_Rotation) => void;
    selectedEntityFlipDirection: boolean;
    setSelectedEntityFlipDirection: (direction: boolean) => void;
}

export const useAppStore = create<AppStore>()(
    persist(
        (set) => {
            const defaultLevel = createLevelWithMetadata('');

            return {
                levels: {
                    [defaultLevel.id]: defaultLevel,
                },
                activeLevelID: defaultLevel.id,
                addLevel: (level) =>
                    set((state) => ({ levels: { ...state.levels, [level.id]: level } })),
                setActiveLevelID: (levelID: string) => set({ activeLevelID: levelID }),
                removeLevel: (levelID: string) =>
                    set((state) => ({
                        levels: Object.fromEntries(
                            Object.entries(state.levels).filter(([id]) => id !== levelID),
                        ),
                    })),
                updateLevel: (level) =>
                    set((state) => ({
                        levels: Object.fromEntries(
                            Object.entries(state.levels).map(([id, l]) => [
                                id,
                                l.id === level.id ? { ...l, ...level } : l,
                            ]),
                        ),
                    })),
                highlightedEngineTile: null,
                setHighlightedEngineTile: (tile) => set({ highlightedEngineTile: tile }),
                selectedEntityType: null,
                setSelectedEntityType: (entityType) => set({ selectedEntityType: entityType }),
                selectedEntityRotation: 'RIGHT',
                setSelectedEntityRotation: (rotation) => set({ selectedEntityRotation: rotation }),
                selectedEntityFlipDirection: false,
                setSelectedEntityFlipDirection: (direction) =>
                    set({ selectedEntityFlipDirection: direction }),
            };
        },
        {
            name: 'app-store',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                levels: state.levels,
                activeLevelID: state.activeLevelID,
                selectedEntityType: state.selectedEntityType,
                //selectedEntityRotation: state.selectedEntityRotation,
                //selectedEntityFlipDirection: state.selectedEntityFlipDirection,
            }),
            version: 1,
            migrate: () => {},
        },
    ),
);

export const useCurrentLevel = (): LevelWithMetadata | null => {
    const activeLevelID = useAppStore((state) => state.activeLevelID);
    const levels = useAppStore((state) => state.levels);

    return useMemo(() => levels[activeLevelID ?? ''] || null, [activeLevelID, levels]);
};

export const getAppStore = () => useAppStore.getState();
