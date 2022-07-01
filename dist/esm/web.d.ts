import { WebPlugin } from "@capacitor/core";
import {
  FirebaseRemoteConfigPlugin,
  RCValueOption,
  RCReturnData,
  RCReturnDataArray,
} from "./definitions";
export declare class FirebaseRemoteConfigWeb extends WebPlugin
  implements FirebaseRemoteConfigPlugin {
  readonly ready: Promise<any>;
  private readyResolver;
  private remoteConfigRef;
  private scripts;
  constructor();
  initializeFirebase(options: any): Promise<void>;
  setDefaultWebConfig(options: any): Promise<void>;
  initialize(options: { minimumFetchIntervalInSeconds: number }): Promise<void>;
  fetch(): Promise<void>;
  activate(): Promise<void>;
  fetchAndActivate(): Promise<void>;
  getBoolean(options: RCValueOption): Promise<RCReturnData>;
  getByteArray(options: RCValueOption): Promise<RCReturnDataArray>;
  getNumber(options: RCValueOption): Promise<RCReturnData>;
  getString(options: RCValueOption): Promise<RCReturnData>;
  get remoteConfig(): any;
  private configure;
  private loadScripts;
  private isFirebaseInitialized;
}
