// Electron entry: shows the lens countdown (index.html) full screen on the hallway screen.
const { app, BrowserWindow, Menu, shell, powerSaveBlocker } = require("electron");
const path = require("path");

// sounds play without a click (the screen runs unattended in the hallway)
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

function createWindow() {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    backgroundColor: "#050506",
    autoHideMenuBar: true,
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, backgroundThrottling: false },
  });

  // the expiry screen's mailto link opens the mail app instead of navigating the window
  win.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith("mailto:")) { event.preventDefault(); shell.openExternal(url); }
  });

  // weeks of unattended running: if the page ever crashes or hangs, bring it back on its own
  win.webContents.on("render-process-gone", () => setTimeout(() => { if (!win.isDestroyed()) win.reload(); }, 2000));
  let hang = 0;
  win.on("unresponsive", () => { clearTimeout(hang); hang = setTimeout(() => { if (!win.isDestroyed()) win.webContents.forcefullyCrashRenderer(); }, 15000); });
  win.on("responsive", () => clearTimeout(hang));

  win.loadFile(path.join(__dirname, "index.html"));
  win.once("ready-to-show", () => {
    win.maximize();
    win.setFullScreen(true);
    win.show();
  });

  // F11 toggles full screen; Esc leaves it
  win.webContents.on("before-input-event", (event, input) => {
    if (input.type !== "keyDown") return;
    if (input.key === "F11") { win.setFullScreen(!win.isFullScreen()); event.preventDefault(); }
    else if (input.key === "Escape" && win.isFullScreen()) { win.setFullScreen(false); }
  });
}

app.whenReady().then(() => {
  powerSaveBlocker.start("prevent-display-sleep");   // keep the screen awake
  if (process.platform !== "darwin") Menu.setApplicationMenu(null);
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
