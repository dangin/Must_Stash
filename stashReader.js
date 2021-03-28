const glob = require('glob')
const fs = require('fs')

let stashes = {};
document.querySelector('button.refresh').onclick = loadData
document.querySelector('button.refresh').click()

function loadData() {
    console.log('loading data...')
    glob("../*.txt", function (err, files) {
        files.forEach( (fileName) => {
            try {   
                let fn = fileName.match('\.\./(.*)\.txt')[1];
                let accountName = fn.split('_')[0];
                let characterName = fn.split('_')[1];
                let data = fs.readFileSync(fileName, 'utf-8')
                console.log('reading... ',fn)
                let stash = JSON.parse(data);
                if (!stashes[accountName]) stashes[accountName] = {}
                stashes[accountName][characterName] = stash;
            } catch(e) {
                console.error(e);
            }
        })
        accountSelect();
    })   
}

let accountSelectElem = document.querySelector('select[name=account]')
accountSelectElem.onchange = characterSelect

function accountSelect() {
    accountSelectElem.options.length = 0
    for (var a in stashes) {
        let o = document.createElement('option')
        o.value = a
        o.innerHTML = a
        accountSelectElem.appendChild(o)
    }
    accountSelectElem.size = Object.keys(stashes).length
    accountSelectElem.onchange()
}

let characterSelectElem = document.querySelector('select[name=character]')
characterSelectElem.onchange = loadStash
function characterSelect() {
    characterSelectElem.options.length = 0
    let account = accountSelectElem.selectedOptions[0].value
    
    for (var a in stashes[account]) {
        let o = document.createElement('option')
        o.value = a
        o.innerHTML = a
        characterSelectElem.appendChild(o)
    }
    characterSelectElem.size = Object.keys(stashes[account]).length
    characterSelectElem.onchange()
}

function loadStash() {
    let account = accountSelectElem.selectedOptions[0].value
    let character = characterSelectElem.selectedOptions[0].value

    stashElem.innerHTML = ''
    stashes[account][character].forEach((i) => {displayItem(i)})
}

let stashElem = document.querySelector('ul.items')
function displayItem(item,owner) {
    console.log('hmhmm',arguments)
    let li = document.createElement('li')
    li.classList.add('item')
    
    let title = document.createElement('h3')
    title.innerHTML = item['name'] || item['type'] 
    title.classList.add('quality-'+item['quality'].toLowerCase())
    if (owner) {
        let ownerElem = document.createElement('span')
        ownerElem.classList.add('owner')
        ownerElem.innerHTML = '<br>(' + owner.account + ' ' + owner.character + ')'
        title.append(ownerElem)
    }
    if (item['isGem'] || item['type'].match(/flawless/gi)) {
        title.classList.add('gem-'+item['type'].toLowerCase().replace(' ',''))
    }
    if (item['type'] && item['type'].match('.*Rune')) {
        title.classList.add('rune')
    }
    if (item['count']) {
        let badge = document.createElement('span')
        badge.classList.add('badge')
        badge.classList.add('count')
        badge.innerHTML = `${item['count']}x `
        title.prepend(badge)
    }
    // let ilv = document.createElement('span')
    // ilv.classList.add('badge')
    // ilv.classList.add('ilv')
    // ilv.innerHTML = ` ${item['iLevel']}`

    // title.appendChild(ilv)
    li.appendChild(title)

    for (var p in item) {
        if (typeof item[p] !== 'object') {
            let d = document.createElement('div')
            d.innerHTML = `${p} : ${item[p]}`
            li.appendChild(d)
        } 
        if (typeof item[p] == 'object') {
            let olist = document.createElement('ul')
            olist.classList.add('stat-list')
            for (let a in item[p]) {
                let s = document.createElement('li')
                s.innerHTML = `${item[p][a].name} : ${item[p][a].value}`
                olist.appendChild(s)
            }
            li.appendChild(olist)
        }
    }
    function displayStat(p) {

    }
    stashElem.appendChild(li)
}

document.querySelector('#searchAll').onkeyup = searchForItem

function searchForItem() {
    let words = this.value
    let results = searchAll(words)
    stashElem.innerHTML = ''
    results.forEach((r)=> {
        displayItem(r.item,{account:r.account, character:r.character})
    })
}

function searchAll(words) {
    let found = []
    for (let account in stashes) {
        found.push(...searchAccount(account,words))
    }
    return found;
}
function searchAccount(account,words) {
    let found = []
    for (let character in stashes[account]) {
        found.push(...searchCharacter(account,character,words))
    }
    return found
}

function SearchResult(account, character, item) {
    this.account = account
    this.character = character
    this.item = item
}

function searchCharacter(account, character, words) {
    let found = []
    let eachWord = words.split(' ')
    let moddedWords = eachWord.map((w)=>{
        return '(?=.*'+w+')'
    })
    let regx = new RegExp(moddedWords.join(''),'gi')
    stashes[account][character].forEach((item)=>{
        let s = flattenItemString(item)
        if (s.match(regx)) {
            found.push(new SearchResult(account, character, item))
        }
    })
    return found
}

function flattenItemString(item) {
    let s = ''
    if (typeof item == 'object') {
        for (let p in item) {
            if (typeof item[p] == 'object') {
                s += flattenItemString(item[p])
            } else {
                s += ' ' + item[p]
            }
        }
    }
    return s
}