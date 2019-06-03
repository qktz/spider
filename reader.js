const {ipcRenderer} = require('electron');

var wait = ()=> {
    let ret = document.querySelector('article');
    console.log('ret:', ret, this.name);
    if (ret)
        return 'exec';

    return 'wait';
}

var exec = ()=>{
    let a = document.querySelector('article');
    let titleList = new Array();
    let imgs = new Array();
    let times = new Array();
    console.log("im in eva:", a);
    while(a != null) {
        console.log(a);
        let title = a.querySelector("a").innerHTML;
        console.log(title);
        titleList.push(title);
        
        let img = a.querySelector("img").getAttributeNode("src").value;
        console.log(img);
        imgs.push(img);

        let time = a.querySelector("time").getAttributeNode("datetime").value;
        console.log(time);
        times.push(time);
        //end
        a = a.querySelector("article");
    }
    let retObj = {
        titles: titleList,
        imgs: imgs,
        times: times
    }
    ipcRenderer.send('ren2main', retObj)
    return 'end';
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
var stateMach = function (){};
stateMach.prototype.curState = null;
stateMach.prototype.states = {};
stateMach.prototype.init = ()=>{
    this.curState = 'wait';
    this.states = {};
}
stateMach.prototype.add = (state, func)=>{
    //this.states[state] = func;
    this.states[state] = func;
}
stateMach.prototype.do = ()=>{
    if (!this.curState){
        return;
    }

    this.curState = this.states[this.curState]();
}
stateMach.prototype.setState = (state)=>{
    console.log('set state:', state);
    this.curState = state;
}

let sm = new stateMach;
sm.init();
sm.add('wait', wait);
sm.add('exec', exec);
sm.add('end', end);
sm.add('next', next);

ipcRenderer.on('main2ren', (event, arg)=>{
    console.log('msg:', event, arg);
    if (arg == 'next') {
        sm.setState('next');
    }
})

setInterval(()=>{
    sm.do();
}, 1000)