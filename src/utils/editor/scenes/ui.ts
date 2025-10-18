import { Scene } from '../../engine/systems/scene';
import { E_Cursor } from '../entities/cursor';

export class UIScene extends Scene {
    override create() {
        this.rootEntity?.setZIndex(100);

        this.addEntities(new E_Cursor());
    }
}
