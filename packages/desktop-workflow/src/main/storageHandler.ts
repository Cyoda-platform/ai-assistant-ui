/**
 * Storage handler для main процесса Electron
 * Обрабатывает IPC запросы от renderer процесса и работает с electron-store
 */

import { ipcMain } from 'electron';
import Store from 'electron-store';

// Создаем экземпляр electron-store
const store = new Store() as any;

/**
 * Регистрируем IPC handlers для работы с хранилищем
 */
export function setupStorageHandlers(): void {
    // Сохранение значения
    ipcMain.handle('storage:set', async (event, { key, value }) => {
        try {
            store.set(key, value);
            return true;
        } catch (error) {
            console.error(`Failed to set storage value for key "${key}":`, error);
            throw error;
        }
    });

    // Получение значения
    ipcMain.handle('storage:get', async (event, { key, defaultValue }) => {
        try {
            return store.get(key, defaultValue);
        } catch (error) {
            console.error(`Failed to get storage value for key "${key}":`, error);
            return defaultValue;
        }
    });

    // Проверка существования ключа
    ipcMain.handle('storage:has', async (event, { key }) => {
        try {
            return store.has(key);
        } catch (error) {
            console.error(`Failed to check key existence for "${key}":`, error);
            return false;
        }
    });

    // Удаление значения
    ipcMain.handle('storage:delete', async (event, { key }) => {
        try {
            store.delete(key);
            return true;
        } catch (error) {
            console.error(`Failed to delete storage value for key "${key}":`, error);
            throw error;
        }
    });

    // Получение всех ключей
    ipcMain.handle('storage:keys', async () => {
        try {
            // В electron-store v10 используем Object.keys для получения ключей
            const storeData = store.store;
            return Object.keys(storeData);
        } catch (error) {
            console.error('Failed to get storage keys:', error);
            return [];
        }
    });

    // Очистка всех данных
    ipcMain.handle('storage:clear', async () => {
        try {
            store.clear();
            return true;
        } catch (error) {
            console.error('Failed to clear storage:', error);
            throw error;
        }
    });

    // Получение размера хранилища
    ipcMain.handle('storage:size', async () => {
        try {
            return store.size;
        } catch (error) {
            console.error('Failed to get storage size:', error);
            return 0;
        }
    });

    // Получение пути к файлу хранилища
    ipcMain.handle('storage:path', async () => {
        try {
            return store.path;
        } catch (error) {
            console.error('Failed to get storage path:', error);
            return '';
        }
    });

    console.log('Storage IPC handlers registered successfully');
}

/**
 * Удаление IPC handlers (для очистки при закрытии приложения)
 */
export function removeStorageHandlers(): void {
    ipcMain.removeHandler('storage:set');
    ipcMain.removeHandler('storage:get');
    ipcMain.removeHandler('storage:has');
    ipcMain.removeHandler('storage:delete');
    ipcMain.removeHandler('storage:keys');
    ipcMain.removeHandler('storage:clear');
    ipcMain.removeHandler('storage:size');
    ipcMain.removeHandler('storage:path');
    
    console.log('Storage IPC handlers removed');
}

// Экспортируем store для прямого использования в main процессе если нужно
export { store };