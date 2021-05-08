import { browser } from 'webextension-polyfill-ts'
import { Config } from '@/config'

async function goAriaNg() {
  const configData = await Config.getAll()
  const protocol = configData.aria2Secure ? 'wss' : 'ws'
  const url = `${configData.ariaNgUrl}/#!/settings/rpc/set/${protocol}/${
    configData.aria2Host
  }/${configData.aria2Port}${configData.aria2Path}/${btoa(
    configData.aria2Secret
  )}`

  browser.tabs.create({ url: url })
}

function goSettings() {
  browser.runtime.openOptionsPage()
}

document.querySelector('#goAriaNg')?.addEventListener('click', goAriaNg)
document.querySelector('#settings')?.addEventListener('click', goSettings)
