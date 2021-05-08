import {
  Aria2AddUri,
  BrowserMessage,
  BrowserMessageType,
  DownloadInfo,
  DownloadInfoMsg,
  getAria2,
} from '@/common'
import { Config, ConfigData } from '@/config'
import Aria2 from 'aria2'
import { browser, Downloads, WebRequest } from 'webextension-polyfill-ts'

const request = new Map<string, DownloadInfo>()
const dlPlan = new Map<number, DownloadInfo>()
let aria2: Aria2
let configData: ConfigData

async function requestHandler(details: WebRequest.OnSendHeadersDetailsType) {
  const data: DownloadInfo = new DownloadInfo()
  data.url = details.url
  details.requestHeaders?.forEach((item) => {
    if (item.value) {
      data[item.name.toLowerCase()] = item.value
    }
  })
  data.referer = (data.referer || details.initiator) ?? ''
  if (!data.cookie && data.referer) {
    const cookies: string[] = []
    ;(
      await browser.cookies.getAll({ url: data.referer })
    ).forEach(({ name, value }) => cookies.push(`${name}=${value}`))
    data.cookie = cookies.join(';')
  }
  request.set(details.requestId, data)
}

function downloadHandler(details: WebRequest.OnHeadersReceivedDetailsType) {
  const downloadInfo = request.get(details.requestId) ?? new DownloadInfo()
  request.delete(details.requestId)

  if (details.statusCode === 200) {
    let contentDisposition, contentType
    details.responseHeaders?.forEach((item) => {
      const name = item.name.toLowerCase()
      if (name === 'content-disposition') {
        contentDisposition = item.value?.toLowerCase()
      } else if (name === 'content-type') {
        contentType = item.value?.toLowerCase()
      }
    })

    if (judgeDownload(contentDisposition, contentType)) {
      closeTab(details.tabId, details.originUrl)
      downloadInfo.filename = getFilename(details.url, contentDisposition)
      showDownloadPlan(downloadInfo)
      return { cancel: true }
    }
  }
}

function getFilename(url: string, contentDisposition?: string) {
  let filename
  if (contentDisposition) {
    let charset = 'iso-8859-1'

    let found = contentDisposition.match(/filename\*=(.*?)'(.*?)'([^;]*)/)
    if (found) {
      charset = found[1]
      filename = found[3]
    }

    if (!filename) {
      found = contentDisposition.match(/filename\=([^;]*)/)
      if (found) {
        filename = found[1]
      }
    }

    if (filename && charset === 'iso-8859-1') {
      filename = decodeURIComponent(escape(filename))
    }
  }

  if (!filename) {
    const urlArr = url.split('/')
    filename = urlArr[urlArr.length - 1].split('?')[0]
  }

  return decodeURIComponent(filename)
}

function judgeDownload(contentDisposition?: string, contentType?: string) {
  const exclMime = configData.exclMime

  // 包含attachment代表是下载文件
  let flag = contentDisposition
    ? contentDisposition.indexOf('attachment') > -1
    : false

  // 过滤contentType中含有‘;’， 含有‘;’一般如：multipart/form-data; boundary=aBoundaryString | application/json; charset=utf-8
  // 过滤排除的MIME
  flag = flag
    ? flag
    : !contentType?.includes(';') && !exclMime.includes(contentType ?? '')

  return flag
}

function closeTab(tabId: number, originUrl?: string) {
  browser.tabs.get(tabId).then((tabInfo) => {
    if (originUrl && tabInfo.url === 'about:blank') {
      browser.tabs.remove(tabId)
    }
  })
}

function showDownloadPlan(data: DownloadInfo) {
  browser.windows
    .create({
      url: 'download-plan.html',
      type: 'popup',
      width: 500,
      height: 380,
    })
    .then((windowInfo) => {
      if (windowInfo.id) {
        dlPlan.set(windowInfo.id, data)
      }
    })
}

function handleMessage(message: BrowserMessage): void | Promise<any> {
  const { type } = message
  // 配置更改
  if (type === BrowserMessageType.ConfigModify) {
    configData = message.data as ConfigData
    aria2 = getAria2(configData)
  }
  // 下载窗口获取下载信息
  else if (type === BrowserMessageType.DownloadInfo) {
    const data = message.data as DownloadInfoMsg
    const res = dlPlan.get(data.windowId)
    dlPlan.delete(data.windowId)
    return Promise.resolve(res)
  }
  // aria2下载
  else if (type === BrowserMessageType.Aria2Dl) {
    const data = message.data as Aria2AddUri
    aria2
      .call('addUri', data.uris, data.options)
      .then(() =>
        browser.notifications.create('aria2Download', {
          type: 'basic',
          iconUrl: 'icons/icon.png',
          title: 'Aria2下载通知',
          message: 'Aria2下载创建成功',
        })
      )
      .catch((err) =>
        browser.notifications.create('aria2Download', {
          type: 'basic',
          iconUrl: 'icons/icon.png',
          title: 'Aria2下载通知',
          message: `Aria2下载创建失败，失败消息：${err}`,
        })
      )
  }
  // 浏览器下载
  else if (type === BrowserMessageType.BrowserDl) {
    const data = message.data as Downloads.DownloadOptionsType
    browser.downloads.download({
      url: data.url,
      filename: encodeURIComponent(data.filename ?? ''),
      headers: data.headers,
      saveAs: data.saveAs,
    })
  }
}

;(async function () {
  configData = await Config.getAll()
  aria2 = getAria2(configData)
  console.log(configData)
  console.log(aria2)
})()

browser.runtime.onMessage.addListener(handleMessage)
browser.webRequest.onSendHeaders.addListener(
  requestHandler,
  {
    urls: ['<all_urls>'],
    types: ['main_frame', 'sub_frame'],
  },
  ['requestHeaders']
)
browser.webRequest.onHeadersReceived.addListener(
  downloadHandler,
  {
    urls: ['<all_urls>'],
    types: ['main_frame', 'sub_frame'],
  },
  ['blocking', 'responseHeaders']
)
