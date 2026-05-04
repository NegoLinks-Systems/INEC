declare module 'agora-token' {
  export enum RtcRole {
    PUBLISHER = 1,
    SUBSCRIBER = 2,
  }
  export class RtcTokenBuilder {
    static buildTokenWithUid(
      appId: string,
      appCertificate: string,
      channelName: string,
      uid: number,
      role: RtcRole,
      tokenExpire: number,
      privilegeExpire: number
    ): string
  }
}
