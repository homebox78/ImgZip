// ImageZip — preload (렌더러에 안전한 저장 API 노출)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('imgzip', {
  isDesktop: true,
  // files: [{ name: string, data: ArrayBuffer }]
  saveFiles: (files) => ipcRenderer.invoke('save-files', files),
  openFolder: (dir) => ipcRenderer.invoke('open-folder', dir),
  // 우클릭/실행 인자로 넘어온 이미지 수신 (main → renderer)
  onAddFiles: (cb) => ipcRenderer.on('add-files', (e, files) => cb(files)),
});
