main_url = "http://javbest.net/category/uncensored"
content_scripts = [
    {
        matches: [/javbest\.net\/category\/uncensored/i,],
        js:["mainPage.js"]
    },
    {
        matches: [/imgclick\.net/],
        js:["imgPage.js"]
        
    }
]

module.exports = {
    main_url: main_url,
    content_scripts: content_scripts,
}