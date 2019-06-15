
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

function parseAll() {
    getCurCache((cache)=>{
        console.log('cur cache:', cache);
        imgUrl = subPic();
        if (imgUrl) {
            g_tickFunc = null;
            rpcCall('downloadOne', [imgUrl, cache.saveName], (ret)=>{
                loadPage();
            })
        }
        else {
        }
    });
}
g_tickFunc = (times)=> {
    if (times > 10) {
        loadPage();
    }
    parseAll();
}