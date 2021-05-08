import {
  Aria2AddUri,
  BrowserMessage,
  BrowserMessageType,
  DownloadInfo,
} from '@/common'
import { browser, Downloads } from 'webextension-polyfill-ts'

async function init() {
  const windowInfo = await browser.windows.getCurrent()
  if (windowInfo.id) {
    const browserMsg: BrowserMessage = {
      type: BrowserMessageType.DownloadInfo,
      data: {
        windowId: windowInfo.id,
      },
    }
    const data: DownloadInfo = await browser.runtime.sendMessage(browserMsg)

    for (const [key, val] of Object.entries(data)) {
      const tag = document.querySelector<
        HTMLInputElement | HTMLTextAreaElement
      >(`#${key}`)
      if (tag && val) {
        tag.value = val
      }
    }
  }
}

function download() {
  const data = getHtmlData()
  const dlData: Aria2AddUri = {
    uris: [data.url],
    options: {
      out: data.filename,
      referer: data.referer,
      'user-agent': data['user-agent'],
      header: [`cookie: ${data.cookie}`],
    },
  }
  const browserMsg: BrowserMessage = {
    type: BrowserMessageType.Aria2Dl,
    data: dlData,
  }
  browser.runtime.sendMessage(browserMsg).then(() => window.close())
}

function browserDl(saveAs: boolean) {
  const data = getHtmlData()
  // https://developer.mozilla.org/zh-CN/docs/Mozilla/Add-ons/WebExtensions/API/downloads/download
  // https://developer.mozilla.org/zh-CN/docs/Glossary/Forbidden_header_name
  // 查看上面两个链接，检查被禁止修改的headers
  const headers: Downloads.DownloadOptionsTypeHeadersItemType[] = []

  // edge暂不能添加user-agent, referer
  // if (data.referer) {
  //   headers.push({ name: 'referer', value: data.referer })
  // }
  // if (data['user-agent']) {
  //   headers.push({ name: 'user-agent', value: data['user-agent'] })
  // }
  const dlData: Downloads.DownloadOptionsType = {
    url: data.url,
    filename: data.filename,
    headers,
    saveAs,
  }
  const browserMsg: BrowserMessage = {
    type: BrowserMessageType.BrowserDl,
    data: dlData,
  }

  browser.runtime.sendMessage(browserMsg).then(() => window.close())
}

function cancel() {
  window.close()
}

function getHtmlData(): DownloadInfo {
  const data = new DownloadInfo()
  for (const key of Object.keys(data)) {
    const tag = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      `#${key}`
    )
    if (tag) {
      data[key] = tag.value
    }
  }

  return data
}

document.addEventListener('DOMContentLoaded', init)
document.querySelector('#download')?.addEventListener('click', download)
document
  .querySelector('#browserDl')
  ?.addEventListener('click', () => browserDl(false))
document
  .querySelector('#browserSaveAs')
  ?.addEventListener('click', () => browserDl(true))
document.querySelector('#cancel')?.addEventListener('click', cancel)
