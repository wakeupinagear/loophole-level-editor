import { Engine, type EngineOptions } from '../engine';
import type { AvailableScenes } from '../engine/systems/scene';
import { TestScene } from './scenes/test';
import { UIScene } from './scenes/ui';

const SCENES: AvailableScenes = {
    [TestScene.name]: (name) => new TestScene(name),
    [UIScene.name]: (name) => new UIScene(name),
};

export class Editor extends Engine {
    constructor(options: EngineOptions = {}) {
        super({ scenes: SCENES, startScenes: [UIScene.name, TestScene.name], ...options });
    }

    override _update(deltaTime: number): boolean {
        this.setCameraRotation(this._camera.rotation + deltaTime * 10);

        return true;
    }
}
