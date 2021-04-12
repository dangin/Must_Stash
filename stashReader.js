const fs = require('fs');
const { clipboard, electron, dialog } = require('electron');
const toastr = require('toastr');
const ipcRenderer = require('electron');
const ipc = ipcRenderer.ipcRenderer

toastr.options = {
    "closeButton": false,
    "debug": false,
    "newestOnTop": false,
    "progressBar": false,
    "positionClass": "toast-bottom-right",
    "preventDuplicates": false,
    "onclick": null,
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": "5000",
    "extendedTimeOut": "1000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
  }



let stashes;
ipc.on('request-stash-folder-location', function (event, data) {
    ipc.send('set-stash-location', prompt('folder location?'))
})

ipc.on('stash-data', function (event, data) {
    console.log('stash-data',data)
    stashes = data
    accountSelect();
})

function loadData() {
    ipc.send('load-data')
}

document.querySelector('button.refresh').onclick = loadData
document.querySelector('button.refresh').click()
document.querySelector('form').onsubmit = function() { return false }



let accountSelectElem = document.querySelector('select[name=account]')
accountSelectElem.onchange = characterSelect

function accountSelect() {
    accountSelectElem.options.length = 0
    stashes.forEach((obj,a) => {
        let o = document.createElement('option')
        o.value = a
        o.innerHTML = a
        accountSelectElem.appendChild(o)
    })
    accountSelectElem.size = stashes.size
    accountSelectElem.onchange()
}

let characterSelectElem = document.querySelector('select[name=character]')
characterSelectElem.onchange = loadStash
function characterSelect() {
    characterSelectElem.options.length = 0
    if (accountSelectElem.selectedOptions.length <= 0) { return }
    let account = accountSelectElem.selectedOptions[0].value
    stashes.get(account).forEach((obj,a) => {
        let o = document.createElement('option')
        o.value = a
        o.innerHTML = a
        characterSelectElem.appendChild(o)
    })
    characterSelectElem.size = stashes.get(account).size
    characterSelectElem.onchange()
}

function loadStash() {
    let account = accountSelectElem.selectedOptions[0].value
    let character = characterSelectElem.selectedOptions[0].value

    stashElem.innerHTML = ''
    stashes.get(account).get(character).forEach((i) => { displayItem(i) })
}
function copyToItemToClipboard(item) {
    clipboard.writeText(JSON.stringify(item))
    toastr.info('Item copied to clipboard')
}
let stashElem = document.querySelector('ul.items')
function displayItem(item,owner) {
    let li = document.createElement('li')
    li.classList.add('item')
    
    let title = document.createElement('h3')
    title.onclick = copyToItemToClipboard.bind(this,item)
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
    stashes.forEach((obj,account) => {
        found.push(...searchAccount(account,words))
    })
    return found;
}
function searchAccount(account,words) {
    let found = []
    stashes.get(account).forEach((obj, character) => {
        found.push(...searchCharacter(account,character,words))
    })
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
    stashes.get(account).get(character).forEach((item)=>{
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