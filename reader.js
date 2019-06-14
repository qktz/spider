const {ipcRenderer} = require('electron');


var wait = (arg)=> {
    let ret = document.querySelector(arg);
    console.log('ret:', ret, this.name);
    if (ret)
        return true;

    return false;
}

var exec = ()=>{
    let a = document.querySelector('article');
    let titleList = new Array();
    let imgs = new Array();
    let urls = [];
    let times = new Array();
    console.log("im in eva:", a);
    while(a != null) {
        console.log(a);
        let title = a.querySelector("a").innerHTML;
        console.log(title);
        titleList.push(title);
        
        let p = a.querySelector("p");
        let mainImg = p.querySelector("img").getAttributeNode("src").value;
        imgs.push(mainImg);

        let as = p.querySelectorAll("a");
        let imgList = [];
        for (let cur of as) {
            imgList.push(cur.getAttributeNode("href").value);
        }
        console.log(imgList);
        urls.push(imgList);

        let time = a.querySelector("time").getAttributeNode("datetime").value;
        console.log(time);
        times.push(time);
        //end
        a = a.querySelector("article");
    }
    
    let nextA = getElementByAttr('a', 'class', 'next page-numbers');
    let nextUrl = nextA.getAttributeNode('href').value;
    let retObj = {
        titles: titleList,
        imgs: imgs,
        urls: urls,
        times: times,
        nextUrl: nextUrl,
    }
    return retObj;
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

function next() {
    let a = getElementByAttr('a', 'class', 'next page-numbers');
    console.log('on next:', a);
    if (!a) {
        return 'end';
    }

    a.click();
    return 'wait';
}

function end(){
    console.log('end')
    return 'end';
}

function subPic() {
    let pic = document.querySelector('img.pic');
    if (pic) {
        let imgUrl = pic.getAttributeNode('src').value;
        console.log(pic, imgUrl);
        if (imgUrl) {
            return imgUrl;
        }
    }
    return null;
}
g_state = 0;
function idle() {
    ipcRenderer.send('ren2main', {
        func: 'do',
        args: null
    });

    if (!g_state) {
        g_state = 1;
        ipcRenderer.send('ren2main', {
            func: 'init',
            args: null
        });
    }
    return 'idle';
}

let sm = new StateMach();
sm.setState('idle');
sm.add('wait', wait);
sm.add('exec', exec);
sm.add('end', end);
sm.add('next', next);
sm.add('idle', idle);
sm.add('subPic', subPic);

ipcRenderer.on('main2ren', (event, arg)=>{
    console.log('msg:', event, arg);
    if (arg.func == 'rpc') {
        console.log(arg);
        let func = arg.rpc.func;
        let args = arg.rpc.args;
        ret = sm.callFunc(func, args);

        ipcRenderer.send('ren2main', {
            func: 'rpcret',
            args: ret,
            rpcid: arg.rpcid
        });
    }
})

setInterval(()=>{
    sm.do();
}, 1000)