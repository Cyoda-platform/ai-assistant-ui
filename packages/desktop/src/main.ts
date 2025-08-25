import {app, BrowserWindow, screen, Notification, globalShortcut} from 'electron';
import path from 'path';
import started from 'electron-squirrel-startup';
import {updateElectronApp} from 'update-electron-app';
import { createServer } from 'http';
import { URL } from 'url';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
    app.quit();
}

let authCallbackServer: any = null;
let mainWindow: BrowserWindow | null = null;

// Создаем локальный сервер для обработки Auth0 callback
const createAuthCallbackServer = () => {
    if (authCallbackServer) return;
    
    authCallbackServer = createServer((req, res) => {
        const reqUrl = new URL(req.url!, 'http://localhost:3009');
        
        if (reqUrl.pathname === '/') {
            // Отправляем простой HTML ответ
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
                <html>
                    <head><title>Login Successful</title></head>
                    <body>
                        <h2>Login successful! You can close this window.</h2>
                        <script>
                            // Закрываем окно автоматически через 2 секунды
                            setTimeout(() => window.close(), 2000);
                        </script>
                    </body>
                </html>
            `);
            
            // Перенаправляем в основное окно с токенами
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL || `file://${path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)}${reqUrl.search}&auth0=true`);
            }
        } else {
            res.writeHead(404);
            res.end('Not found');
        }
    });
    
    authCallbackServer.listen(3009, 'localhost', () => {
        console.log('🔥 Auth callback server running on http://localhost:3009');
    });
};

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
    app.quit();
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
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }

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

    // Создаем сервер для Auth0 callback после создания окна
    createAuthCallbackServer();
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
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (authCallbackServer) {
        authCallbackServer.close();
        authCallbackServer = null;
    }

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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

updateElectronApp(); // additional configuration options available
