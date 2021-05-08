declare module 'aria2' {
  namespace Aria2 {
    interface Options {
      host: string
      port: number
      secure: boolean
      secret?: string
      path: string
    }

    interface MethodOptions {
      out?: string
      referer?: string
      'user-agent'?: string
      header?: string[]
    }

    interface VersionResp {
      enabledFeatures: string[]
      version: string
    }
  }

  class Aria2 {
    constructor(options: Aria2.Options)

    call(method: string, ...params: any[]): Promise<Aria2.VersionResp | any>
  }

  export default Aria2
}
