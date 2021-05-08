import { browser } from 'webextension-polyfill-ts'

class ConfigData {
  exclMime: string[] = [
    'text/html',
    'text/plain',
    'application/json',
    'application/xml',
    'application/xhtml+xml',
    'application/pdf',
  ]
  ariaNgUrl: string = 'http://ariang.mayswind.net/latest'
  aria2Host: string = 'localhost'
  aria2Port: number = 6800
  aria2Secure: boolean = false
  aria2Secret: string = ''
  aria2Path: string = '/jsonrpc';

  [key: string]: any
}

class Config {
  private static defaultConfig = new ConfigData()

  static async getConfig(key: string): Promise<any> {
    const data = await browser.storage.local.get(key)
    return data[key]
  }

  static getAll(): Promise<ConfigData> {
    return browser.storage.local
      .get()
      .then((data) => Object.assign(Config.defaultConfig, data))
  }

  static save(data: Partial<ConfigData>): Promise<void> {
    return browser.storage.local.set(data)
  }
}

export { Config, ConfigData }
