/**
 * Helper для работы с electron-store через IPC
 * Использует безопасный contextBridge API вместо require
 */

// Типизация для electronAPI
interface ElectronAPI {
  storage: {
    set: (key: string, value: any) => Promise<boolean>;
    get: (key: string, defaultValue?: any) => Promise<any>;
    has: (key: string) => Promise<boolean>;
    delete: (key: string) => Promise<boolean>;
    clear: () => Promise<boolean>;
    keys: () => Promise<string[]>;
    size: () => Promise<number>;
    path: () => Promise<string>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

class HelperStorageElectron {
    private static get electronAPI() {
        if (!window.electronAPI?.storage) {
            throw new Error('electronAPI.storage is not available. Make sure preload script is properly configured.');
        }
        return window.electronAPI.storage;
    }

    /**
     * Сохранить значение в хранилище
     */
    static async set(key: string, value: any): Promise<void> {
        await this.electronAPI.set(key, value);
    }

    /**
     * Получить значение из хранилища
     */
    static async get(key: string, defaultValue?: any): Promise<any> {
        return this.electronAPI.get(key, defaultValue);
    }

    /**
     * Проверить существование ключа
     */
    static async has(key: string): Promise<boolean> {
        return this.electronAPI.has(key);
    }

    /**
     * Удалить значение из хранилища
     */
    static async remove(key: string): Promise<void> {
        await this.electronAPI.delete(key);
    }

    /**
     * Очистить все данные
     */
    static async clear(): Promise<void> {
        await this.electronAPI.clear();
    }

    /**
     * Получить все ключи
     */
    static async getKeys(): Promise<string[]> {
        return await this.electronAPI.keys();
    }

    /**
     * Получить размер хранилища
     */
    static async getSize(): Promise<number> {
        return await this.electronAPI.size();
    }

    /**
     * Получить путь к файлу хранилища
     */
    static async getPath(): Promise<string> {
        return await this.electronAPI.path();
    }

    /**
     * Показать информацию о хранилище в консоли
     */
    static async showStorageInfo(): Promise<void> {
        try {
            const path = await this.getPath();
            const size = await this.getSize();
            const keys = await this.getKeys();
            
            console.group('🗄️ Storage Info');
            console.log('📁 Path:', path);
            console.log('📊 Size:', size, 'keys');
            console.log('🔑 Keys:', keys);
            console.groupEnd();
            
            // Показываем содержимое каждого ключа
            if (keys.length > 0) {
                console.group('📋 Storage Contents');
                for (const key of keys) {
                    const value = await this.get(key);
                    console.log(`${key}:`, value);
                }
                console.groupEnd();
            }
        } catch (error) {
            console.error('❌ Error showing storage info:', error);
        }
    }

    /**
     * Экспортировать все данные в JSON
     */
    static async exportData(): Promise<Record<string, any>> {
        const keys = await this.getKeys();
        const data: Record<string, any> = {};
        
        for (const key of keys) {
            data[key] = await this.get(key);
        }
        
        return data;
    }
}

export default HelperStorageElectron;