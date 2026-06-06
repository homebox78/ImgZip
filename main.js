// 이미집 — Electron 메인 프로세스
const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const fs = require('fs/promises');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 840,
    minWidth: 720,
    minHeight: 600,
    backgroundColor: '#0c0d10',
    title: '이미집',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon.png'), // 없으면 기본 아이콘 사용
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  Menu.setApplicationMenu(null); // 기본 메뉴 제거(깔끔한 앱)
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// 렌더러 → 폴더 선택 후 파일들 직접 저장
ipcMain.handle('save-files', async (event, data) => {
  // data: [{name,data}]  또는  {files:[...], overwrite:bool}
  const files = Array.isArray(data) ? data : (data.files || []);
  const overwrite = Array.isArray(data) ? false : !!data.overwrite;
  const win = BrowserWindow.fromWebContents(event.sender);
  const r = await dialog.showOpenDialog(win, {
    title: '저장할 폴더를 선택하세요',
    properties: ['openDirectory', 'createDirectory'],
  });
  if (r.canceled || !r.filePaths[0]) return { ok: false, canceled: true };

  const dir = r.filePaths[0];
  let count = 0;
  for (const f of files) {
    let target = path.join(dir, f.name);
    if (!overwrite) {
      // 같은 이름 충돌 시 (1),(2)… 붙이기
      const ext = path.extname(f.name);
      const base = f.name.slice(0, f.name.length - ext.length);
      let i = 1;
      while (await exists(target)) {
        target = path.join(dir, `${base} (${i})${ext}`);
        i++;
      }
    }
    await fs.writeFile(target, Buffer.from(f.data));
    count++;
  }
  return { ok: true, count, dir };
});

// 저장 폴더 탐색기로 열기
ipcMain.handle('open-folder', async (event, dir) => {
  if (dir) shell.openPath(dir);
});

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}
