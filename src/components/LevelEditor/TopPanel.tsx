import { Camera, Grid, Mouse, Paintbrush, RefreshCw, Rocket, Settings, Wrench } from 'lucide-react';
import { useAppStore, useCurrentLevel, useSettingsStore } from '../../utils/stores';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Slider } from '../ui/slider';
import Panel from './Panel';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { COLOR_PALETTE_METADATA, formatToSnakeCase, Loophole_ColorPalette } from '@/utils/utils';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';

const DEFAULT_LEVEL_NAME = 'Untitled Level';

export default function TopPanel() {
    const currentLevel = useCurrentLevel();
    const updateLevel = useAppStore((state) => state.updateLevel);
    const resetLevel = useAppStore((state) => state.resetLevel);
    const setCameraTarget = useAppStore((state) => state.setCameraTarget);

    const scrollDirection = useSettingsStore((state) => state.scrollDirection);
    const scrollSensitivity = useSettingsStore((state) => state.scrollSensitivity);
    const showEngineStats = useSettingsStore((state) => state.showEngineStats);
    const showGrid = useSettingsStore((state) => state.showGrid);
    const setUserSettings = useSettingsStore((state) => state.setUserSettings);

    if (!currentLevel) return null;

    const { name } = currentLevel;

    const downloadLevel = () => {
        const level = currentLevel;
        const levelJSON = JSON.stringify(level, null, 2);
        const blob = new Blob([levelJSON], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${formatToSnakeCase(name || DEFAULT_LEVEL_NAME)}.json`;
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const resetViewport = () => {
        setCameraTarget({
            position: { x: 0, y: 0 },
            rotation: 0,
            zoom: 1,
        });
    };

    return (
        <Panel className="flex items-center w-full">
            <Input
                type="text"
                className="border-none outline-none !text-xl font-bold"
                value={name}
                placeholder={DEFAULT_LEVEL_NAME}
                onChange={(e) => updateLevel(currentLevel.id, { name: e.target.value })}
            />
            <Button variant="outline" onClick={downloadLevel}>
                <Rocket className="size-5" />
                Test Level
            </Button>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Paintbrush className="size-5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="flex flex-col gap-2 w-64">
                    <h4 className="leading-none font-medium">Color Palette</h4>
                    <ToggleGroup
                        type="single"
                        value={currentLevel.colorPalette.toString()}
                        className="w-full"
                        onValueChange={(value) => {
                            if (value) {
                                updateLevel(currentLevel.id, {
                                    colorPalette: parseInt(value) as Loophole_ColorPalette,
                                });
                            }
                        }}
                    >
                        {Object.values(Loophole_ColorPalette).map((palette) => (
                            <ToggleGroupItem key={palette} value={palette.toString()}>
                                {palette + 1}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                    <img
                        src={`${COLOR_PALETTE_METADATA[currentLevel.colorPalette].image}`}
                        alt="Color Palette Screenshot"
                        className="rounded-md"
                    />
                </PopoverContent>
            </Popover>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Settings className="size-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>Level Settings</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => resetViewport()}>
                        <Camera /> Reset Viewport
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => {
                            resetLevel(currentLevel.id);
                            resetViewport();
                        }}
                    >
                        <RefreshCw /> Clear Level
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Editor Settings</DropdownMenuLabel>
                    <DropdownMenuCheckboxItem
                        checked={showGrid}
                        onCheckedChange={(checked) => setUserSettings({ showGrid: checked })}
                    >
                        <Grid /> Show Grid
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                        checked={scrollDirection === -1}
                        onCheckedChange={(checked) =>
                            setUserSettings({ scrollDirection: checked ? -1 : 1 })
                        }
                    >
                        <Mouse />
                        Invert Scroll Direction
                    </DropdownMenuCheckboxItem>
                    <div className="px-2 py-2">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Scroll Sensitivity</span>
                            <span className="text-sm text-muted-foreground">
                                {scrollSensitivity.toFixed(1)}x
                            </span>
                        </div>
                        <Slider
                            value={[scrollSensitivity]}
                            onValueChange={([value]) =>
                                setUserSettings({ scrollSensitivity: value })
                            }
                            min={0.2}
                            max={2}
                            step={0.05}
                            className="w-full"
                        />
                    </div>
                    <DropdownMenuCheckboxItem
                        checked={showEngineStats}
                        onCheckedChange={(checked) => setUserSettings({ showEngineStats: checked })}
                    >
                        <Wrench /> Engine Stats
                    </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </Panel>
    );
}
