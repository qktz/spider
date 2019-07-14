main_url = "index.html"
content_scripts = [
    {
        matches: [/index.html/i,],
        js:["main.js"]
    },
    {
        matches: [/search/],
        js:["utils.js", "search.js"]
    },
    {
        matches: [/https:\/\/www\.buscdn\.life\/[\w-]+$/],
        js:["utils.js", "moviePage.js"]
    }
]

module.exports = {
    main_url: main_url,
    content_scripts: content_scripts,
}