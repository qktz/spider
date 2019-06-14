// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron')
const debug = require('debug')('spider')
const fs = require('fs')
const path = require('path')
const request = require('request')
const StateMach = require('./StateMach');

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
let g_jpgCache = {};
let g_curObj = null;
let g_urlDownCount = 0;
let g_urlMax = 0;
let g_renderState = 'idle';
let g_iter = null;
let g_subObj = null;
let g_rpc = {};
let g_rpcids = [];
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
  mainWindow.loadURL('http://javbest.net/category/uncensored/page/1/')
  
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
  mainWindow.webContents.on('did-stop-loading', ()=>{
    console.log('did-stop-loading');
    let wholeData = "";
    fs.readFile('StateMach.js', 'utf8', (err, data)=>{
      //mainWindow.webContents.executeJavaScript(data);
      wholeData += data;
      fs.readFile('reader.js', 'utf8', (err, data)=>{
        wholeData += data;
        mainWindow.webContents.executeJavaScript(wholeData);
      })
    })
  })
  
  //mainWindow.webContents.downloadURL('http://main.imgclick.net/i/01160/soukpsutgcc4_t.jpg');
  mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
    //设置文件存放位置
    console.log('will-down')
    let saveInfo = g_jpgCache[item.getURL()];
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
        console.log('Download successfully', g_urlDownCount, g_urlMax);
        if (saveInfo.func) {
          saveInfo.func();
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

function getDay(data) {
  let ret = /\d+-\d+-\d+/.exec(data);
  return ret[0];
}

function getDayVal(data) {
  data = data.replace(/-/g, '');
  return parseInt(data);
}

function mkdir(pathname) {
  console.log(pathname);
  if (fs.existsSync(pathname)) {
    return;
  }

  let parent = path.dirname(pathname);
  if (!fs.existsSync(parent)) {
    mkdir(parent);
  }
  fs.mkdirSync(pathname);
}

function downloadOne(url, saveName, func) {
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
  console.log('down one:', url);
  mainWindow.webContents.downloadURL(url);
}

function getFullname(time, title) {
  let date = getDay(time);
  let pathname = path.join(__dirname, 'data', date);
  title = title.replace(/[^\w-]+/g, '');
  return path.join(pathname, title);
}

function downloadImg(img, time, title) {
  let finalName = getFullname(time, title) + '.jpg';
  console.log('final:', img, finalName);
  downloadOne(img, finalName, ()=>{
    g_urlDownCount += 1;
  });
  return;
}
///will delete---------------------start------------------------------
//will delete -----------------------end -----------------------------


function processResult(retObj) {
  //console.log(retObj);
  g_curObj = retObj;
  let len = retObj.imgs.length;
  g_urlMax += len;
  for (let i = 0; i < len; i++) {
    let img = retObj.imgs[i];
    let time = retObj.times[i];
    let title = retObj.titles[i];

    downloadImg(img, time, title);
    let dateVal = getDayVal(getDay(time));
    if (dateVal < 20190606) {
    }
  }
  return 'idle';
}

function doRpc(func, args, retFunc) {
  for (let i = 1; i < 65535; i++) {
    if (!(i in g_rpc)) {
      g_rpc[i] = {
        func: func,
        args: args,
        retFunc: retFunc
      }
      g_rpcids.push(i);
      break;
    }
  }
}

function main() {
  console.log('main')
  doRpc('wait', 'article', (isFind)=>{
    sm.setState('getMainobj');
  })
  return 'main';
}

function getMainobj() {
  doRpc('exec', null, (retObj)=>{
    //console.log('exec ret:', retObj);
    processResult(retObj);
    sm.setState('waitMainImgDown');
  })
  return 'getMainobj'
}

function waitMainImgDown() {
  console.log('waitMainImgDown', g_urlDownCount, g_urlMax)
  if (g_urlDownCount == g_urlMax) {
    function* getIter(){
      for (let i in g_curObj.urls) {
        let fullname = getFullname(g_curObj.times[i], g_curObj.titles[i]);
        urlList = g_curObj.urls[i];
        for (let j in urlList) {
          yield {
            url: urlList[j],
            name: fullname + '_' + j + '.jpg',
            isok: false,
            trueUrl: null
          };
        }
      }
    }
    g_iter = getIter();
    return 'subPage';
  }
  return 'waitMainImgDown';
}

function idle() {
  return 'idle';
}

function subPage() {
  let cur = g_iter.next();
  if (!cur.done) {
    g_subObj = cur.value;
    mainWindow.loadURL(g_subObj.url);
    return 'downSub';
  }
  else {
    mainWindow.loadURL(g_curObj.nextUrl);
    return 'idle';
  }
  return 'subPage';
}

function downSub() {
  doRpc('subPic', null, (retUrl)=>{
    if (retUrl) {
      downloadOne(retUrl, g_subObj.name);
    }
    sm.setState('subPage');
  })
  return 'downSub';
}

var sm = new StateMach();
sm.setState('idle');
sm.add('processResult', processResult);
sm.add('main', main);
sm.add('idle', idle);
sm.add('subPage', subPage);
sm.add('downSub', downSub);
sm.add('getMainobj', getMainobj);
sm.add('waitMainImgDown', waitMainImgDown);

ipcMain.on('ren2main', (event, arg)=>{
  let func = arg.func;
  console.log('ipc main:', func, sm.curState);
  let args = arg.args;
  if (func == 'do') {
    sm.do();
    let rpcid = g_rpcids.pop();
    if (rpcid) {
      event.sender.send('main2ren', {
        func: 'rpc',
        rpc: g_rpc[rpcid],
        rpcid: rpcid
      });
      return;
    }
  }
  else if (func == 'rpcret'){
    let obj = g_rpc[arg.rpcid];
    //console.log(g_rpc, arg, arg.rpcid, obj);
    obj.retFunc(args);
    delete g_rpc[arg.rpcid];
  }
  else if (func == 'init') {
    console.log('in init', sm.curState);
    if (sm.curState == 'idle')
    {
      sm.setState('main');
    }
  }
  
  event.sender.send('main2ren', {
    func: 'null',
    cur: sm.curState
  });
})
/*
setInterval(()=>{
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.findInPage('article');
  }
}, 1000)*/