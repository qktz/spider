const {ipcRenderer} = require('electron');
ipcRenderer.send('ren2main', 'ping')