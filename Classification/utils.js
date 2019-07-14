const videoDir = 'J:\\889914\\video\\';
const sortDir = 'J:\\889914\\sort\\';

function ignore(func) {
    getCurCache((cache) => {
        let oldname = videoDir + cache.filename;
        let newname = videoDir + 'ignore_' + cache.filename;
        console.log('will ignore:', oldname);
        rpcCall('rename', [oldname, newname], func);
    });
};