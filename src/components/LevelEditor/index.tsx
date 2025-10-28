import { LevelEditor } from '@/utils/levelEditor';
import { useAppStore } from '@/utils/store';
import { useEffect, useRef } from 'react';
import { EngineCanvas } from '../engine/EngineCanvas';
import TopPanel from './TopPanel';
import TilePicker from './TilePicker';
import { FPSCounter } from '../engine/FPSCounter';

export function LevelEditorComponent() {
    const levelEditorRef = useRef<LevelEditor | null>(null);
    const levels = useAppStore((state) => state.levels);
    const activeLevelID = useAppStore((state) => state.activeLevelID);
    const updateLevel = useAppStore((state) => state.updateLevel);
    const levelHashes = useAppStore((state) => state.levelHashes);

    const level = levels[activeLevelID];
    const levelHash = levelHashes[activeLevelID];
    const prevLevelHash = useRef<number | null>(null);

    useEffect(() => {
        if (!window.engine) {
            levelEditorRef.current = new LevelEditor((updatedLevel) => {
                updateLevel(level.id, { level: updatedLevel });
            }, {});
        } else {
            if (prevLevelHash.current !== levelHash) {
                levelEditorRef.current = window.engine as LevelEditor;
                levelEditorRef.current.level = level.level;
                prevLevelHash.current = levelHash;
            }
        }
    }, [activeLevelID, levelHash, level, updateLevel]);

    return (
        <div className="h-screen w-screen flex flex-col">
            <div className="fixed top-0 left-0">
                <EngineCanvas engineRef={levelEditorRef} />
            </div>
            <div className="h-full flex flex-col p-4 gap-4 z-10 pointer-events-none">
                <TopPanel />
                <TilePicker />
                <FPSCounter className="fixed top-20 right-4 text-right" />
            </div>
        </div>
    );
}
