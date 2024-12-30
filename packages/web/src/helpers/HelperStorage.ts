export default class HelperStorage {
  private storage: Storage;

  constructor(storage: Storage = window.localStorage) {
    this.storage = storage;
  }

  public set<T>(name: string, value: T): void {
    const valueJson = typeof value === 'string' ? value : JSON.stringify(value);
    this.storage.setItem(name, valueJson);
  }

  public get<T>(name: string, defaultValue: T | null = null): T | null {
    const data = this.storage.getItem(name);
    if (data) {
      return this.isJsonString(data) ? JSON.parse(data) : (data as unknown as T);
    }
    return defaultValue;
  }

  public clear(): void {
    this.storage.clear();
  }

  private isJsonString(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }
}
