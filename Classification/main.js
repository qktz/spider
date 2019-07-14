console.log('test');

function getSearchUrl(codeInfo, uncensored) {
    if (uncensored) {
        return 'https://www.buscdn.life/uncensored/search/' + codeInfo.code + '&type=1';
    }
    else {
        return 'https://www.buscdn.life/search/' + codeInfo.code + '&type=1';
    }
}

function parseUncensored(oriCode) {
    console.log(oriCode, typeof(oriCode));
    if (oriCode.search(/(carib|1pon)/i) != -1) {
        return oriCode.match(/\d+[\-\_]\d+/i)[0];
    }
    else {
        return false;
    }
}

function parseWithPat(oriCode) {
    if (oriCode.search(/(sdde|adn)/i) != -1) {
        return {
            code: oriCode.match(/(sdde|adn)[\-\_]?\d+/i)[0],
            uncensored: false,
        }
    }
    else if (oriCode.search(/(hey)/i) != -1) {
        return {
            code: oriCode.match(/(hey)[\-\_]?\d+/i)[0],
            uncensored: true,
        }
    }
    else {
        return false;
    }
}

function parseCode(oriCode, filename) {
    let patCode = parseWithPat(filename);
    if (patCode) {
        return patCode;
    }

    let newCode = parseUncensored(oriCode);
    if (newCode) {
        return {
            uncensored: true,
            code: newCode
        }
    }

    newCode = oriCode.replace(/(?<=[a-zA-Z]+\-?\d+\-?)([a-zA-Z].*)$/g, '');
    newCode = newCode.replace(/^\-+/, '')
    //console.log('newCode', newCode, oriCode);
    return {
        code: newCode,
        uncensored: false,
    };
}

function isIgnore(oriCode) {
    return oriCode.indexOf('ignore_') == 0 ? true : false;
}

rpcCall('getFileList', ['J:\\889914\\video'], (ret)=>{
    let codeList = [];
    for (let filename of ret) {
        if (isIgnore(filename)) {
            continue;
        }

        let oriName = filename;
        filename = filename.replace(/[^\w-]+/g, ' ');
        let codes = filename.split(' ').filter((nameStr) => {
            return nameStr.indexOf('-') != -1;
        });
        if (codes.length) {
            let codeObj = parseCode(codes[0], filename);
            codeList.push({
                code: codeObj.code,
                filename: oriName,
                uncensored: codeObj.uncensored
            });
        }
    }

    console.log(codeList);
    for (let codeInfo of codeList) {
        let url = getSearchUrl(codeInfo, codeInfo.uncensored);
        addPage(url, codeInfo);
    }
    //loadPage();
});