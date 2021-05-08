import { BrowserMessage, BrowserMessageType, getAria2 } from '@/common'
import { Config, ConfigData } from '@/config'
import { browser } from 'webextension-polyfill-ts'

let configData: ConfigData

async function init() {
  document.querySelector('form')?.reset()

  configData = await Config.getAll()

  for (let [key, value] of Object.entries(configData)) {
    const tag = document.querySelector<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >(`#${key}`)

    if (tag) {
      if (key === 'exclMime') {
        value = value.join('\n')
      }
      tag.value = value
    }
  }

  fillVersion(configData)
}

function save() {
  for (let [key, value] of Object.entries(configData)) {
    const tag = document.querySelector<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >(`#${key}`)

    if (tag) {
      try {
        value = JSON.parse(tag.value)
      } catch (err) {
        value = tag.value
      }
      value = key === 'exclMime' ? (value ? value.split('\n') : []) : value

      configData[key] = value
    }
  }
  Config.save(configData)

  const browserMsg: BrowserMessage = {
    type: BrowserMessageType.ConfigModify,
    data: configData,
  }
  browser.runtime.sendMessage(browserMsg)

  fillVersion(configData)
}

let fillFlag = 0 // 避免异步回调因执行时间不同造成的前值覆盖后值问题
function fillVersion(configData: ConfigData) {
  const fillFlagCurr = ++fillFlag
  const aria2VerTag = document.querySelector('#aria2Ver')
  aria2VerTag!.textContent = '...'

  getAria2(configData)
    .call('getVersion')
    .then(({ version }) => {
      if (fillFlag === fillFlagCurr) {
        aria2VerTag!.textContent = version
        fillFlag = 0
      }
    })
    .catch((err) => {
      if (fillFlag === fillFlagCurr) {
        aria2VerTag!.textContent = err
        fillFlag = 0
      }
    })
}

document.addEventListener('DOMContentLoaded', init)
document.querySelector('#save')?.addEventListener('click', save)
