import {app, BrowserWindow, screen, Notification, globalShortcut} from 'electron';
import path from 'path';
import started from 'electron-squirrel-startup';
import {updateElectronApp} from 'update-electron-app';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
    app.quit();
}

let mainWindow: BrowserWindow | null = null;

// Регистрируем кастомную URL схему для Auth0 callback
const PROTOCOL_NAME = 'cyoda-desktop';

// Устанавливаем приложение как обработчик для нашего протокола
if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient(PROTOCOL_NAME, process.execPath, [path.resolve(process.argv[1])]);
    }
} else {
    app.setAsDefaultProtocolClient(PROTOCOL_NAME);
}

// Обработка single instance - если приложение уже запущено, передаем URL в существующий процесс
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Кто-то пытался запустить второй экземпляр, фокусируемся на нашем окне
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
            
            // Ищем URL с нашим протоколом в аргументах командной строки
            const authUrl = commandLine.find((arg) => arg.startsWith(`${PROTOCOL_NAME}://`));
            if (authUrl) {
                console.log('🔥 Received auth callback URL:', authUrl);
                handleAuthCallback(authUrl);
            }
        }
    });
}

// Обработчик для полученных auth callback URL
function handleAuthCallback(url: string) {
    console.log('🔄 Processing auth callback:', url);
    
    try {
        const callbackUrl = new URL(url);
        console.log('📝 Callback URL params:', callbackUrl.searchParams.toString());
        
        if (mainWindow && !mainWindow.isDestroyed()) {
            // Формируем правильный URL для приложения с параметрами auth callback
            const baseUrl = MAIN_WINDOW_VITE_DEV_SERVER_URL || 
                `file://${path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)}`;
            
            // Добавляем параметры auth callback к корневому URL
            const appUrl = `${baseUrl}${callbackUrl.search}&auth0=true`;
            
            console.log('🚀 Loading app URL:', appUrl);
            mainWindow.loadURL(appUrl);
            
            // Фокусируемся на основном окне
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    } catch (error) {
        console.error('❌ Error processing auth callback:', error);
        
        // Fallback - просто загружаем главную страницу
        if (mainWindow && !mainWindow.isDestroyed()) {
            loadAppUrl();
        }
    }
}

function loadAppUrl(){
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }
}

const createWindow = () => {
    const {width, height} = screen.getPrimaryDisplay().workAreaSize;
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width,
        height,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    // and load the index.html of the app.
    loadAppUrl();

    // Open the DevTools for development env
    // if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    // }

    mainWindow.webContents.on('did-finish-load', () => {
        const currentUrl = mainWindow.webContents.getURL();

        if (currentUrl.includes('auth0.com') && currentUrl.includes('/u/login')) {
            const jsCode = `
                if (document.getElementById('electron-auth-message')) {
                    console.log('Custom message already exists');
                } else {
                    console.log('Adding custom message to Auth0 page');
      
                    const customMessage = document.createElement('div');
                    customMessage.id = 'electron-auth-message';
                    customMessage.style = 'background: #0D8484; color: #fff; padding: 15px 20px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; font-size: 15px; font-weight: 600; box-shadow: 0 4px 15px rgba(0,0,0,0.2);';
                    customMessage.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; gap: 10px;"><span style="font-size: 20px;">🚀</span><span>Authorization</span></div><div style="font-size: 13px; margin-top: 5px; opacity: 0.95; font-weight: 400;">Sign in to access your personal AI assistant • Press ESC to cancel</div>';
                    
                    document.body.insertBefore(customMessage, document.body.firstChild);
                    
                }
            `;

            mainWindow.webContents.executeJavaScript(jsCode).catch(err => {
                console.error('🔥 Failed to inject custom message:', err);
            });
        }
    });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    createWindow();
    
    // Регистрируем глобальный shortcut Escape для отмены авторизации
    globalShortcut.register('Escape', () => {
        const url = mainWindow.webContents.getURL();
        if (mainWindow && !url.includes('file:')) {
            console.log('🔥 Escape pressed, closing auth window');
            loadAppUrl();
        }
    });
    
    // Проверяем аргументы командной строки на наличие нашего протокола
    const authUrl = process.argv.find((arg) => arg.startsWith(`${PROTOCOL_NAME}://`));
    if (authUrl) {
        console.log('🔥 Received auth callback URL from command line:', authUrl);
        // Задержка, чтобы окно успело создаться
        setTimeout(() => handleAuthCallback(authUrl), 1000);
    }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    globalShortcut.unregisterAll();
    
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Обработка кастомных URL (для macOS)
app.on('open-url', (event, url) => {
    event.preventDefault();
    console.log('🔗 Received URL:', url);
    
    if (url.startsWith(`${PROTOCOL_NAME}://auth/callback`)) {
        handleAuthCallback(url);
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

updateElectronApp(); // additional configuration options available
