import Store from 'electron-store';
import path from 'path'

const storage = new Store({
    cwd: path.join(app.getPath('userData'), 'config')
});

export default class HelperStorageElectron {
    public set<T>(name: string, value: T): void {
        storage.set(name, value);
    }

    public get<T>(name: string, defaultValue: T | null = null): unknown {
        return storage.get(name, defaultValue);
    }
}