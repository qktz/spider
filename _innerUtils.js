const {ipcRenderer} = require('electron');
g_rpcCache = {}
g_tickFunc = null;
g_tickTimes = 0;

function generateRpcId() {
    for (let id = 0; id < 1000; id ++) {
        let rpcId = g_idIndex * 1000 + id;
        if (!(rpcId in g_rpcCache)){
            return rpcId;
        }
    }
    return null;
}

function rpcCall(func, args, retFunc) {
    let rpcId = generateRpcId();
    g_rpcCache[rpcId] = {
        retFunc: retFunc,
    }
    ipcRenderer.send('ren2main', {
        cmd: 'rpc',
        func: func,
        args, args,
        rpcId: rpcId,
    });
}

function getElementByAttr(tag, attr, value){
    var elements = document.getElementsByTagName(tag);
    for (var i = 0; i < elements.length; i++){
        if (elements[i].getAttribute(attr) == value)
        {
            return elements[i];
        }
    }
    return null;
}

function addPage(url, cache) {
    rpcCall('addPage', [url, cache], null);
}

function loadPage() {
    rpcCall('loadPage', [], null);
}

function getCurCache(func) {
    rpcCall('getCurCache', [], func);
}

ipcRenderer.on('main2ren', (event, arg)=>{
    //console.log(arg, g_rpcCache);
    if (arg.cmd == 'rpcret') {
        let args = arg.args;
        let rpcId = arg.rpcId;
        let rpcCache = g_rpcCache[rpcId];
        if (rpcCache) {
            let callback = rpcCache.retFunc;
            if (callback) {
                callback.apply(null, args);
            }
            delete g_rpcCache[rpcId];
        }
    }
})

setInterval(()=>{
    ipcRenderer.send('ren2main', {
        cmd: 'tick'
    });

    if (g_tickFunc) {
        g_tickTimes ++;
        g_tickFunc(g_tickTimes);
    }
}, 1000);