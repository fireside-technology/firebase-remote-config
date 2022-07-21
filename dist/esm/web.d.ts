import { WebPlugin } from "@capacitor/core";
import { FirebaseApp } from "firebase/app";
import { RemoteConfig } from "firebase/remote-config";
import {
  FirebaseRemoteConfigPlugin,
  initOptions,
  RCReturnData,
  RCValueOption,
} from "./definitions";
export declare class FirebaseRemoteConfigWeb extends WebPlugin
  implements FirebaseRemoteConfigPlugin {
  private remoteConfigRef;
  ErrorMissingDefaultConfigMessage: string;
  ErrorRemoteConfigNotInitializedMessage: string;
  constructor();
  initializeFirebase(app: FirebaseApp): Promise<void>;
  setDefaultConfig(options: any): Promise<void>;
  initialize(options?: initOptions): Promise<void>;
  fetch(): Promise<void>;
  activate(): Promise<void>;
  fetchAndActivate(): Promise<void>;
  getBoolean(options: RCValueOption): Promise<RCReturnData>;
  getNumber(options: RCValueOption): Promise<RCReturnData>;
  getString(options: RCValueOption): Promise<RCReturnData>;
  /**
   * Returns remote config reference object
   */
  get remoteConfig(): RemoteConfig;
}
