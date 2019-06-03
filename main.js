// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron')
const debug = require('debug')('spider')
const fs = require('fs')
const path = require('path')
const request = require('request')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let jpgCache = {};
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

  mainWindow.webContents.on('did-finish-load', ()=>{
    console.log('did-finish-load');
    debug('im finished')
  })

  mainWindow.webContents.on('did-navigate', ()=>{
    console.log('did-navigate');
  })

  mainWindow.webContents.on('did-navigate-in-page', ()=>{
    console.log('did-navigate-in-page');
  })

  mainWindow.webContents.on('dom-ready', ()=>{
    console.log('dom-ready');
  })

  mainWindow.webContents.on('did-frame-finish-load', ()=>{
    console.log('did-frame-finish-load');
  })

  mainWindow.webContents.on('did-start-loading', ()=>{
    console.log('did-start-loading');
  })

  mainWindow.webContents.on('did-stop-loading', ()=>{
    console.log('did-stop-loading');
    fs.readFile('reader.js', 'utf8', (err, data)=>{
      mainWindow.webContents.executeJavaScript(data);
    })
  })

  mainWindow.webContents.on('did-get-redirect-request', ()=>{
    console.log('did-get-redirect-request');
  })

  mainWindow.webContents.on('did-get-response-details', ()=>{
    console.log('did-get-response-details');
  })

  mainWindow.webContents.on('new-window', ()=>{
    console.log('new-window');
  })

  mainWindow.webContents.on('found-in-page', function(event, result) {
    //console.log('find result', result);
  });  
  
  //mainWindow.webContents.downloadURL('http://main.imgclick.net/i/01160/soukpsutgcc4_t.jpg');
  mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
    //设置文件存放位置
    console.log('will-down')
    let savePath = path.join(__dirname, 'data', path.basename(item.getURL()));
    item.setSavePath(savePath);
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
        console.log('Download successfully')
        let basename = path.basename(savePath);
        if (!basename in jpgCache) {
          console.log('err', basename);
          return;
        }
        let dstname = jpgCache[basename];
        console.log(savePath, dstname);
        fs.rename(savePath, dstname, (err)=>{
          if (err) {
            console.log('rename err:', err);
          }
        });
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
function processResult(retObj) {
  //console.log(retObj);
  let len = retObj.imgs.length;
  let ret = 'next';
  for (let i = 0; i < len; i++) {
    let img = retObj.imgs[i];
    let time = retObj.times[i];
    let title = retObj.titles[i];

    downloadOne(img, time, title);
    let dateVal = getDayVal(getDay(time));
    if (dateVal < 20190509) {
      ret = 'pong'
    }
  }
  return ret;
}

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

function downloadOne(img, time, title) {
  let date = getDay(time);
  let pathname = path.join(__dirname, 'data', date);
  //console.log(title);
  title = title.replace(/[^\w-]+/g, '');
  let filename = title + '.jpg';
  let fullname = path.join(pathname, filename);
  if (fs.existsSync(fullname)) {
    return;
  }

  mkdir(pathname);
  let basename = path.basename(img);
  jpgCache[basename] = fullname;
  console.log('add:', basename, fullname);
  mainWindow.webContents.downloadURL(img);
  return;
  request.head(img, function(err, res, body){
    if (err) {
        console.log('err: '+ err);
    }
    request(img)
        .pipe(fs.createWriteStream(fullname))
        .on('close', function(){
            console.log('Done : ', img);
        });
  });
}
///will delete---------------------start------------------------------
//will delete -----------------------end -----------------------------
ipcMain.on('ren2main', (event, arg)=>{
  let ret = processResult(arg);
  event.sender.send('main2ren', ret)
})
/*
setInterval(()=>{
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.findInPage('article');
  }
}, 1000)*/