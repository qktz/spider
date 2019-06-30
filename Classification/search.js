console.log('test');
let result = document.querySelector('a.movie-box');
console.log(result);
if (result) {
    result.click();
}
else {
    loadPage();
}