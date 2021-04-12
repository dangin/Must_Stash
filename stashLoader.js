const { ipcMain, dialog, remote, BrowserWindow } = require('electron')
const glob = require('glob')
const fs = require('fs')
const allWindows = BrowserWindow.getAllWindows()
const focussedWindow = BrowserWindow.getFocusedWindow()

let stashFolder

ipcMain.on('load-data', async function (event, arg) {
    if (!stashFolder) {
        dialog.showMessageBoxSync(focussedWindow, { message: 'Please select the stash folder in the project diablo 2 folder' })
        const result = dialog.showOpenDialogSync(focussedWindow, { properties: ['openDirectory'] })
        if (!result.canceled) {
            stashFolder = result[0] + '\\'
        } else {
            return
        }
    }
    event.reply('stash-data',loadData())
})

ipcMain.on('set-stash-location', function (event, location) {
    stashFolder = location
    event.reply('stash-data',loadData())    
})


function loadData() {
    if (!stashFolder) return
    let stashes = new Map();
    let files = glob.sync(`${stashFolder}*.txt`)
    files.forEach((fileName) => {
        try {
            let fn = fileName.match('.*/(.*)\.txt')[1]
            let accountName = fn.split('_')[0]
            let characterName = fn.split('_')[1]
            let data = fs.readFileSync(fileName, 'utf-8')
            console.log('reading... ', fn)
            let stash = JSON.parse(data)
            if (!stashes.has(accountName)) {
                stashes.set(accountName, new Map())
            }
            stashes.get(accountName).set(characterName, stash)
        } catch (e) {
            console.error(e)
        }
    })
    return stashes
}