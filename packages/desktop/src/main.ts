import {app, BrowserWindow, screen, Notification, globalShortcut, ipcMain} from 'electron';
import path from 'path';
import started from 'electron-squirrel-startup';
import {updateElectronApp} from 'update-electron-app';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
    app.quit();
}

let mainWindow: BrowserWindow | null = null;

// Register custom URL scheme for Auth0 callback
const PROTOCOL_NAME = 'cyoda-desktop';

// Set up the application as handler for our protocol
if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient(PROTOCOL_NAME, process.execPath, [path.resolve(process.argv[1])]);
    }
} else {
    app.setAsDefaultProtocolClient(PROTOCOL_NAME);
}

// Handle single instance - if app is already running, pass URL to existing process
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, focus our window instead
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
            
            // Look for URL with our protocol in command line arguments
            const authUrl = commandLine.find((arg) => arg.startsWith(`${PROTOCOL_NAME}://`));
            if (authUrl) {
                console.log('🔥 Received auth callback URL:', authUrl);
                handleAuthCallback(authUrl);
            }
        }
    });
}

// Handler for received auth callback URLs
function handleAuthCallback(url: string) {
    console.log('🔄 Processing auth callback:', url);
    
    try {
        const callbackUrl = new URL(url);
        console.log('📝 Callback URL params:', callbackUrl.searchParams.toString());
        
        if (mainWindow && !mainWindow.isDestroyed()) {
            // Build correct URL for the app with auth callback parameters
            const baseUrl = MAIN_WINDOW_VITE_DEV_SERVER_URL || 
                `file://${path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)}`;
            
            // Add auth callback parameters to root URL
            const appUrl = `${baseUrl}${callbackUrl.search}&auth0=true`;
            
            console.log('🚀 Loading app URL:', appUrl);
            mainWindow.loadURL(appUrl);
            
            // Focus on main window
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    } catch (error) {
        console.error('❌ Error processing auth callback:', error);
        
        // Fallback - just load main page
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

// IPC handler for reloading main window
ipcMain.handle('reload-main-window', () => {
    console.log('🔄 Reloading main window by request');
    if (mainWindow && !mainWindow.isDestroyed()) {
        loadAppUrl();
    }
});

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
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    createWindow();
    
    // Register global Escape shortcut for auth cancellation
    globalShortcut.register('Escape', () => {
        const url = mainWindow.webContents.getURL();
        if (mainWindow && !url.includes('file:')) {
            loadAppUrl();
        }
    });
    
    // Check command line arguments for our protocol
    const authUrl = process.argv.find((arg) => arg.startsWith(`${PROTOCOL_NAME}://`));
    if (authUrl) {
        // Delay so the window has time to be created
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

// Handle custom URLs (for macOS)
app.on('open-url', (event, url) => {
    event.preventDefault();

    if (url.startsWith(`${PROTOCOL_NAME}://auth/callback`)) {
        handleAuthCallback(url);
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

updateElectronApp(); // additional configuration options available
