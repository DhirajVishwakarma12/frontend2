const { app, BrowserWindow, dialog, ipcMain, Menu, safeStorage } = require("electron");
const { spawn } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");

const appRoot = path.resolve(__dirname, "..");
const configPath = () => path.join(app.getPath("userData"), "settings.dat");
const logPath = () => path.join(app.getPath("userData"), "backend.log");
const packagedPath = (...parts) => path.join(process.resourcesPath, ...parts);
const appPath = (...parts) => path.join(app.isPackaged ? process.resourcesPath : appRoot, ...parts);

let mainWindow = null;
let setupWindow = null;
let setupResolver = null;
let currentSettings = null;
let backendProcess = null;
let backendPort = null;
let backendUrl = null;
let restartTimer = null;
let healthTimer = null;
let restartAttempt = 0;
let consecutiveHealthFailures = 0;
let healthCheckRunning = false;
let backendHealthy = false;
let shuttingDown = false;
let allowQuit = false;

function handleSquirrelEvent() {
  const event = process.argv[1];
  if (!event || !event.startsWith("--squirrel-") || event === "--squirrel-firstrun") return false;
  if (event === "--squirrel-obsolete") {
    app.quit();
    return true;
  }

  const appFolder = path.resolve(process.execPath, "..");
  const updateExe = path.resolve(appFolder, "..", "Update.exe");
  const exeName = path.basename(process.execPath);
  const updateArgs = event === "--squirrel-uninstall"
    ? ["--removeShortcut", exeName]
    : ["--createShortcut", exeName];

  try {
    const updateProcess = spawn(updateExe, updateArgs, {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
    updateProcess.unref();
  } catch (error) {
    console.error(`Squirrel shortcut update failed: ${error.message}`);
  }
  setTimeout(() => app.quit(), 1000);
  return true;
}

function log(message) {
  const line = `${new Date().toISOString()} ${message}\n`;
  try {
    fs.appendFileSync(logPath(), line, "utf8");
  } catch (error) {
    console.error("Could not write backend log.", error);
  }
}

function redactOutput(value) {
  return value.replace(/mongodb(?:\+srv)?:\/\/[^/\s@]+(?::[^/\s@]*)?@/gi, "mongodb://<redacted>@");
}

function captureOutput(stream, name) {
  let remainder = "";
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    const lines = `${remainder}${chunk}`.split(/\r?\n/);
    remainder = lines.pop() || "";
    lines.filter(Boolean).forEach((line) => log(`[backend ${name}] ${redactOutput(line)}`));
  });
  stream.on("end", () => {
    if (remainder) log(`[backend ${name}] ${redactOutput(remainder)}`);
  });
}

function readSettings() {
  if (!fs.existsSync(configPath())) return null;
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Windows secure storage is unavailable.");
  }
  const encrypted = Buffer.from(fs.readFileSync(configPath(), "utf8"), "base64");
  return JSON.parse(safeStorage.decryptString(encrypted));
}

function validateSetup(data) {
  const mongoUri = String(data?.mongoUri || "").trim();
  const adminEmail = String(data?.adminEmail || "").trim().toLowerCase();
  const adminPassword = String(data?.adminPassword || "");

  if (!/^mongodb(?:\+srv)?:\/\//.test(mongoUri)) {
    throw new Error("Enter a valid MongoDB connection URI.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    throw new Error("Enter a valid admin email address.");
  }
  if (adminPassword && (adminPassword.length < 12 || Buffer.byteLength(adminPassword, "utf8") > 72)) {
    throw new Error("Admin password must be at least 12 characters and no more than 72 bytes.");
  }
  if (!adminPassword && !currentSettings?.adminPasswordHash) {
    throw new Error("Enter an initial admin password.");
  }

  return { mongoUri, adminEmail, adminPassword };
}

async function saveSettings(data) {
  const { mongoUri, adminEmail, adminPassword } = validateSetup(data);
  const bcrypt = require(appPath("backend", "node_modules", "bcryptjs"));
  const adminPasswordHash = adminPassword
    ? await bcrypt.hash(adminPassword, 12)
    : currentSettings.adminPasswordHash;
  const settings = {
    mongoUri,
    adminEmail,
    adminPasswordHash,
    jwtSecret: currentSettings?.jwtSecret || crypto.randomBytes(48).toString("base64url"),
  };

  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Windows secure storage is unavailable; settings were not saved.");
  }
  const encrypted = safeStorage.encryptString(JSON.stringify(settings));
  fs.writeFileSync(configPath(), encrypted.toString("base64"), { encoding: "utf8", mode: 0o600 });
  currentSettings = settings;
  return settings;
}

function isSetupSender(event) {
  return Boolean(setupWindow && event.sender === setupWindow.webContents);
}

ipcMain.handle("setup:get-settings", (event) => {
  if (!isSetupSender(event)) throw new Error("Setup window is not authorized.");
  return {
    mongoUri: currentSettings?.mongoUri || "",
    adminEmail: currentSettings?.adminEmail || "",
    hasExistingPassword: Boolean(currentSettings?.adminPasswordHash),
  };
});

ipcMain.handle("setup:save-settings", async (event, data) => {
  if (!isSetupSender(event)) throw new Error("Setup window is not authorized.");
  try {
    const settings = await saveSettings(data);
    const resolveSetup = setupResolver;
    setupResolver = null;
    setupWindow.close();
    resolveSetup?.(settings);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  }
});

function openSetupWindow() {
  return new Promise((resolve) => {
    setupResolver = resolve;
    setupWindow = new BrowserWindow({
      width: 720,
      height: 700,
      minWidth: 620,
      minHeight: 620,
      resizable: true,
      title: "Billing System Setup",
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
    setupWindow.on("closed", () => {
      setupWindow = null;
      const resolveSetup = setupResolver;
      setupResolver = null;
      resolveSetup?.(null);
    });
    setupWindow.loadFile(path.join(__dirname, "setup.html")).catch((error) => {
      log(`Could not open setup window: ${error.message}`);
      setupWindow?.close();
    });
  });
}

function getNodeExecutable() {
  return app.isPackaged
    ? packagedPath("node", "node.exe")
    : path.join(appRoot, "node_modules", "node", "bin", "node.exe");
}

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close((error) => error ? reject(error) : resolve(address.port));
    });
  });
}

function startBackend() {
  if (shuttingDown || backendProcess) return;
  const serverPath = appPath("backend", "src", "server.js");
  const frontendPath = appPath("frontend");
  const tempPath = app.getPath("temp");
  const childEnvironment = {
    SYSTEMROOT: process.env.SYSTEMROOT || process.env.SystemRoot || "",
    WINDIR: process.env.WINDIR || "",
    PATH: process.env.PATH || "",
    TEMP: tempPath,
    TMP: tempPath,
    NODE_ENV: "production",
    APP_DESKTOP: "true",
    PORT: String(backendPort),
    FRONTEND_ORIGIN: backendUrl,
    FRONTEND_DIST_DIR: frontendPath,
    MONGODB_URI: currentSettings.mongoUri,
    ADMIN_EMAIL: currentSettings.adminEmail,
    ADMIN_PASSWORD_HASH: currentSettings.adminPasswordHash,
    JWT_SECRET: currentSettings.jwtSecret,
    TRUST_PROXY: "false",
  };

  try {
    const child = spawn(getNodeExecutable(), [serverPath], {
      cwd: app.getPath("userData"),
      env: childEnvironment,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    backendProcess = child;
    captureOutput(child.stdout, "stdout");
    captureOutput(child.stderr, "stderr");
    child.once("error", (error) => {
      if (backendProcess !== child) return;
      backendProcess = null;
      log(`Backend process error: ${error.message}`);
      scheduleBackendRestart();
    });
    child.once("exit", (code, signal) => {
      if (backendProcess !== child) return;
      backendProcess = null;
      backendHealthy = false;
      log(`Backend exited (code=${code}, signal=${signal || "none"}).`);
      scheduleBackendRestart();
    });
    log("Backend process started.");
  } catch (error) {
    log(`Backend could not be started: ${error.message}`);
    scheduleBackendRestart();
  }
}

function scheduleBackendRestart() {
  if (shuttingDown || restartTimer) return;
  restartAttempt += 1;
  const delay = Math.min(1000 * (2 ** Math.min(restartAttempt - 1, 5)), 30000);
  log(`Backend restart ${restartAttempt} scheduled in ${delay}ms.`);
  restartTimer = setTimeout(() => {
    restartTimer = null;
    startBackend();
  }, delay);
}

function stopBackend() {
  if (restartTimer) {
    clearTimeout(restartTimer);
    restartTimer = null;
  }
  const child = backendProcess;
  backendProcess = null;
  if (!child || child.exitCode !== null || child.signalCode !== null) return Promise.resolve();

  return new Promise((resolve) => {
    const forceStopTimer = setTimeout(() => child.kill("SIGKILL"), 3000);
    forceStopTimer.unref();
    child.once("exit", () => {
      clearTimeout(forceStopTimer);
      resolve();
    });
    child.kill();
  });
}

async function checkBackendHealth() {
  if (!backendUrl) return false;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);
  try {
    const response = await fetch(`${backendUrl}/api/health`, { signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForBackend(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (!shuttingDown && Date.now() < deadline) {
    if (await checkBackendHealth()) return true;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  return false;
}

function startHealthMonitor() {
  if (healthTimer) clearInterval(healthTimer);
  healthTimer = setInterval(async () => {
    if (healthCheckRunning || shuttingDown) return;
    healthCheckRunning = true;
    try {
      if (await checkBackendHealth()) {
        consecutiveHealthFailures = 0;
        if (!backendHealthy) {
          backendHealthy = true;
          restartAttempt = 0;
          log("Backend health restored.");
          mainWindow?.loadURL(backendUrl).catch((error) => log(`Invoice window reload failed: ${error.message}`));
        }
        return;
      }

      consecutiveHealthFailures += 1;
      if (consecutiveHealthFailures >= 3 && backendProcess) {
        backendHealthy = false;
        log("Backend health check failed three times; restarting backend.");
        backendProcess.kill();
      }
    } finally {
      healthCheckRunning = false;
    }
  }, 5000);
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1024,
    minHeight: 720,
    show: false,
    title: "IET Billing System",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.loadURL(backendUrl).catch((error) => {
    log(`Invoice window could not load: ${error.message}`);
  });
}

async function startApplication() {
  backendPort = await getAvailablePort();
  backendUrl = `http://127.0.0.1:${backendPort}`;

  while (!shuttingDown) {
    startBackend();
    if (await waitForBackend(45000)) {
      backendHealthy = true;
      restartAttempt = 0;
      createMainWindow();
      startHealthMonitor();
      return;
    }

    log("Backend did not become healthy before the startup timeout.");
    const result = await dialog.showMessageBox({
      type: "error",
      title: "Billing backend unavailable",
      message: "The backend could not connect to the hosted database.",
      detail: "Check the MongoDB URI, network access list, and internet connection. The app will retry after you choose an action.",
      buttons: ["Retry", "Change database settings", "Quit"],
      defaultId: 0,
      cancelId: 2,
    });

    await stopBackend();
    if (result.response === 2) {
      app.quit();
      return;
    }
    if (result.response === 1) {
      const updatedSettings = await openSetupWindow();
      if (!updatedSettings) {
        app.quit();
        return;
      }
    }
    restartAttempt = 0;
  }
}

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  } else {
    setupWindow?.focus();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow) mainWindow.show();
});

app.on("before-quit", (event) => {
  if (allowQuit) return;
  event.preventDefault();
  shuttingDown = true;
  if (healthTimer) clearInterval(healthTimer);
  stopBackend().finally(() => {
    allowQuit = true;
    app.quit();
  });
});

if (handleSquirrelEvent()) {
  app.quit();
} else if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.whenReady().then(async () => {
    try {
      Menu.setApplicationMenu(null);
      fs.mkdirSync(app.getPath("userData"), { recursive: true });
      currentSettings = readSettings();
      if (!currentSettings) {
        currentSettings = await openSetupWindow();
        if (!currentSettings) {
          app.quit();
          return;
        }
      }
      await startApplication();
    } catch (error) {
      log(`Desktop app startup failed: ${error.message}`);
      dialog.showErrorBox("Billing System could not start", error.message);
      app.quit();
    }
  });
}
