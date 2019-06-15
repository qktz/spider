function getAll() {
    let a = document.querySelector('article');
    let titleList = new Array();
    let imgs = new Array();
    let urls = [];
    let times = new Array();
    while(a != null) {
        let title = a.querySelector("a").innerHTML;
        titleList.push(title);
        
        let p = a.querySelector("p");
        let mainImg = p.querySelector("img").getAttributeNode("src").value;
        imgs.push(mainImg);

        let as = p.querySelectorAll("a");
        let imgList = [];
        for (let cur of as) {
            imgList.push(cur.getAttributeNode("href").value);
        }
        urls.push(imgList);

        let time = a.querySelector("time").getAttributeNode("datetime").value;
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

function getDay(data) {
    let ret = /\d+-\d+-\d+/.exec(data);
    return ret[0];
}
  
function getDayVal(data) {
    data = data.replace(/-/g, '');
    return parseInt(data);
}

function getFullname(time, title) {
    let date = getDay(time);
    let pathname = ['data', date].join('\\')
    title = title.replace(/[^\w-]+/g, '');
    return [pathname, title].join('\\');
}

function downloadImg(img, time, title) {
    let finalName = getFullname(time, title) + '.jpg';
    console.log('final:', img, finalName);
    rpcCall('downloadOne', [img, finalName], (ret)=>{
        g_curImgIndex += 1;
        console.log('on download finished', g_imgMax, g_curImgIndex);
        if (g_curImgIndex == g_imgMax) {
            loadPage();
        }
    })
    return;
}
mainObj = getAll();
g_imgMax = 0;
g_curImgIndex = 0;

function parseAll(mainObj) {
    console.log(mainObj);
    g_imgMax = mainObj.titles.length;
    for (let index in mainObj.titles) {
        let title = mainObj.titles[index];
        let imgUrl = mainObj.imgs[index];
        let time = mainObj.times[index];
        let fullname = getFullname(time, title);
        let urlList = mainObj.urls[index];
        for (let i in urlList) {
            pageUrl = urlList[i];
            console.log('pageurl:', pageUrl, fullname);
            addPage(pageUrl, {
                saveName: fullname + '_' + i + '.jpg'
            });
        }
        downloadImg(imgUrl, time, title);
    }
    addPage(mainObj.nextUrl, {});
}
parseAll(mainObj);