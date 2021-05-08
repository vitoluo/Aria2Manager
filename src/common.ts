import { ConfigData } from '@/config'
import Aria2 from 'aria2'
import { Downloads } from 'webextension-polyfill-ts'

export interface BrowserMessage {
  type: BrowserMessageType
  data:
    | ConfigData
    | DownloadInfoMsg
    | DownloadInfo
    | Downloads.DownloadOptionsType
    | Aria2AddUri
}

export enum BrowserMessageType {
  ConfigModify,
  DownloadInfo,
  Aria2Dl,
  BrowserDl,
}

export interface DownloadInfoMsg {
  windowId: number
}

export class DownloadInfo {
  url: string = ''
  filename: string = ''
  referer: string = ''
  cookie: string = ''
  'user-agent': string = '';

  [key: string]: any
}

export interface Aria2AddUri {
  uris: string[]
  options?: Aria2.MethodOptions
}

export function getAria2(configData: ConfigData): Aria2 {
  return new Aria2({
    host: configData.aria2Host,
    port: configData.aria2Port,
    secure: configData.aria2Secure,
    secret: configData.aria2Secret,
    path: configData.aria2Path,
  })
}
