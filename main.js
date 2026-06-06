// ImageZip — Electron 메인 프로세스
const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const fs = require('fs/promises');
const path = require('path');

let mainWin = null;

// 명령줄 인자에서 이미지 경로 수집 (파일은 그대로, 폴더는 안의 이미지 펼침)
const IMG_RE = /\.(jpe?g|png|webp|gif|bmp)$/i;
async function collectImagePaths(argv) {
  const args = (argv || []).slice(1).filter(a => a && !a.startsWith('-'));
  const out = [];
  for (const a of args) {
    try {
      const st = await fs.stat(a);
      if (st.isDirectory()) {
        for (const e of await fs.readdir(a)) { if (IMG_RE.test(e)) out.push(path.join(a, e)); }
      } else if (IMG_RE.test(a)) { out.push(a); }
    } catch (e) {}
  }
  return out;
}

// 경로의 파일들을 읽어 렌더러로 전달 (렌더러가 File 로 만들어 추가)
async function sendFilesToRenderer(win, paths) {
  if (!win || !paths || !paths.length) return;
  const out = [];
  for (const p of paths) {
    try { out.push({ name: path.basename(p), data: await fs.readFile(p) }); } catch (e) {}
  }
  if (out.length) win.webContents.send('add-files', out);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1100, height: 840, minWidth: 720, minHeight: 600,
    backgroundColor: '#0c0d10', title: 'ImageZip', autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
  });
  Menu.setApplicationMenu(null);
  win.loadFile('index.html');
  // 실행 인자로 넘어온 이미지가 있으면 로드 완료 후 전달
  win.webContents.on('did-finish-load', async () => {
    sendFilesToRenderer(win, await collectImagePaths(process.argv));
  });
  return win;
}

// 단일 인스턴스: 우클릭으로 여러 장 선택하면 인스턴스가 여러 번 떠도
// 두 번째부터는 첫 창으로 파일을 전달해 한 창에 모이게 함
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', async (event, argv) => {
    if (mainWin) {
      if (mainWin.isMinimized()) mainWin.restore();
      mainWin.focus();
      sendFilesToRenderer(mainWin, await collectImagePaths(argv));
    }
  });

  app.whenReady().then(() => {
    mainWin = createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) mainWin = createWindow();
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// 렌더러 → 폴더 선택 후 파일들 직접 저장
ipcMain.handle('save-files', async (event, data) => {
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
      const ext = path.extname(f.name);
      const base = f.name.slice(0, f.name.length - ext.length);
      let i = 1;
      while (await exists(target)) { target = path.join(dir, `${base} (${i})${ext}`); i++; }
    }
    await fs.writeFile(target, Buffer.from(f.data));
    count++;
  }
  return { ok: true, count, dir };
});

ipcMain.handle('open-folder', async (event, dir) => { if (dir) shell.openPath(dir); });

async function exists(p) { try { await fs.access(p); return true; } catch { return false; } }
