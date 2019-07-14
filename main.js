// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron')
const debug = require('debug')('spider')
const fs = require('fs')
const path = require('path')
const request = require('request')
const StateMach = require('./StateMach');
let g_dirBase = 'Classification';

const config = require('./' + g_dirBase + '/config');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
const LISTEN_LIST = [
  'did-finish-load',
  'did-navigate',
  'did-navigate-in-page',
  'dom-ready',
  'did-frame-finish-load',
  'did-start-loading',
  'did-get-redirect-request',
  'did-get-response-details',
  'new-window',
  'found-in-page',
];
let g_idIndex = 1;
let g_timerId = 0;
let g_timeout = 30;
let g_curUrl = '';
let g_jpgCache = {};
let g_rpcRetList = [];
let g_curPageCache = {};
let g_pageCacheList = [];
function createWindow () {
  // Create the browser window.
  console.log('will create window');
  debug('hello')
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  //mainWindow.loadFile('index.html')
  mainWindow.webContents.openDevTools();
  _loadUrl(config.main_url);
  
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    console.log('closed')
    mainWindow = null
  })
  for (let index in LISTEN_LIST) {
    let eventStr = LISTEN_LIST[index]
    mainWindow.webContents.on(eventStr, ()=>{
      console.log(eventStr);
    })
  }

  mainWindow.webContents.on('did-start-loading', ()=>{
    let timeCount = 0;
    g_timerId = setInterval(() => {
      timeCount ++;
      console.log('timer:', timeCount, g_timeout);
      if (timeCount > g_timeout) {
        _loadFromCache();
      }
    }, 1000);
    //console.log('set timer:', g_timerId)
  })

  mainWindow.webContents.on('did-stop-loading', ()=>{
    console.log('did-stop-loading', mainWindow.webContents.getURL());
    _addScript();
  })
  
  //mainWindow.webContents.downloadURL('http://main.imgclick.net/i/01160/soukpsutgcc4_t.jpg');
  mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
    //设置文件存放位置
    let saveInfo = g_jpgCache[item.getURL()];
    if (!saveInfo) {
      return;
    }
    console.log('will-down', item.getURL(), saveInfo, g_jpgCache)
    let pathName = path.dirname(saveInfo.saveName);
    mkdir(pathName);
    item.setSavePath(saveInfo.saveName);
    item.on('updated', (event, state) => {
      if (state === 'interrupted') {
        console.log('Download is interrupted but can be resumed')
      } else if (state === 'progressing') {
        if (item.isPaused()) {
          console.log('Download is paused')
        } else {
          console.log(`Received bytes: ${item.getReceivedBytes()}`)
        }
      }
    })
    item.once('done', (event, state) => {
      if (state === 'completed') {
        if (saveInfo.func) {
          saveInfo.func();
          delete g_jpgCache[item.getURL()];
        }
      } else {
        console.log(`Download failed: ${state}`)
      }
    })
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  console.log('window-all-closed');
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  console.log('activate')
  if (mainWindow === null) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function _addScript() {
  if (g_timerId) {
    clearInterval(g_timerId);
    g_timerId = 0;
  }
  let wholeData = "g_idIndex = " + g_idIndex + ";";
  g_idIndex = (g_idIndex + 1) % 100;
  let urlList = _getJsList(mainWindow.webContents.getURL());
  function* _makeUrlIter() {
    yield '_innerUtils.js';
    for (url of urlList) {
      yield path.join(g_dirBase, url);
    }
  }
  let urlIter = _makeUrlIter();
  
  function _loadAllJs(err, data) {
    wholeData += data;
    let _js = urlIter.next();
    if (!_js.done) {
      let filename = _js.value;
      fs.readFile(filename, 'utf8', _loadAllJs);
    }
    else {
      mainWindow.webContents.executeJavaScript(wholeData);
    }
  };
  _loadAllJs(null, '');
}

function _getJsList(url) {
  let retList = [];
  for (let patObj of config.content_scripts) {
    for (let pat of patObj.matches) {
      let ret = url.search(pat);
      if (ret != -1) {
        retList = retList.concat(patObj.js);
        break;
      }
    }
  }
  return retList;
}

function _loadUrl(url) {
  if (url == "index.html") {
    mainWindow.loadFile(url);
  }
  else {
    mainWindow.loadURL(url);
  }
  g_curUrl = url;
}

function _loadFromCache() {
  let pageCache = g_pageCacheList.shift();
  //console.log('pageCache:', pageCache);
  if (!pageCache) {
    return;
  }

  g_curPageCache = pageCache.cache;
  if (pageCache.url) {
    _loadUrl(pageCache.url);
  }
}

function mkdir(pathname) {
  //console.log(pathname);
  if (fs.existsSync(pathname)) {
    return;
  }

  let parent = path.dirname(pathname);
  if (!fs.existsSync(parent)) {
    console.log('mkdir parent', parent);
    mkdir(parent);
  }
  fs.mkdirSync(pathname);
}

function rpc_rename(rpcId, srcPath, dstPath) {
  mkdir(path.dirname(dstPath));
  fs.renameSync(srcPath, dstPath);
  onRpcRet(rpcId, []);
}

function rpc_downloadOne(rpcId, url, saveName) {
  let func = ()=>{
    onRpcRet(rpcId, [true]);
  }
  console.log('down one:', url, saveName);
  //saveName = path.join(__dirname, saveName);
  if (fs.existsSync(saveName)) {
    if (func){
      func();
    }
    return;
  }

  g_jpgCache[url] = {
    saveName: saveName,
    func: func
  };
  mainWindow.webContents.downloadURL(url);
}

///will delete---------------------start------------------------------
//will delete -----------------------end -----------------------------


function rpc_test(rpcId, arg, arg2) {
  console.log('im in test', rpcId, arg, arg2);
  onRpcRet(rpcId, [1, 9, 78]);
}

function rpc_addPage(rpcId, pageUrl, pageCache) {
  g_pageCacheList.push({
    url: pageUrl,
    cache: pageCache,
  })
  onRpcRet(rpcId, []);
}

function rpc_loadPage(rpcId) {
  onRpcRet(rpcId, []);
  _loadFromCache();
}

function rpc_loadWithUrl(rpcId, url, obj) {
  onRpcRet(rpcId, []);
  g_curPageCache = obj;
  _loadUrl(url);
}

function rpc_getCurCache(rpcId) {
  onRpcRet(rpcId, [g_curPageCache]);
}

function rpc_getFileList(rpcId, dirPath) {
  let ret = fs.readdirSync(dirPath);
  onRpcRet(rpcId, [ret]);
}

function onRpcRet(rpcId, args) {
  g_rpcRetList.push({
    rpcId: rpcId,
    args: args,
  })
}

function sendRpcRet(event) {
  let sendObj = g_rpcRetList.shift();
  if (sendObj) {
    event.sender.send('main2ren', {
      cmd: 'rpcret',
      rpcId: sendObj.rpcId,
      args: sendObj.args,
    });
  }
}

ipcMain.on('ren2main', (event, arg)=>{
  let cmd = arg.cmd;
  if (cmd == 'tick') {
  }
  else if (cmd == 'rpc'){
    let funcName = arg.func;
    let callfunc = eval('rpc_' + funcName);
    let args = [arg.rpcId].concat(arg.args);
    callfunc.apply(null, args);
  }
  sendRpcRet(event);
})