console.log('movie test');
function moveFile(actor) {
    getCurCache((cache) => {
        let prefix = cache.uncensored ? 'w_' : 'a_';
        let srcPath = videoDir + cache.filename;
        let dstDir = sortDir + prefix + actor;
        let dstPath = dstDir + '\\' + cache.filename;
        console.log(srcPath, dstPath);
        rpcCall('rename', [srcPath, dstPath], () => {
            let bigJpgA = document.querySelector('a.bigImage');
            let bigJpgUrl = bigJpgA.querySelector('img').getAttributeNode('src').value;
            rpcCall('downloadOne', [bigJpgUrl, dstDir + '\\' + cache.code + '.jpg'], (ret)=>{
                loadPage();
            });
        })
    });
}
function main() {
    let genres = document.querySelectorAll('span.genre');
    for (let genre of genres) {
        if (genre.hasAttribute('onmouseover')){
            let name = genre.querySelector('a').innerHTML;
            console.log(name);
            moveFile(name);
            return;
        }
    };

    ignore(() => {
        loadPage();
    });
}

main();

