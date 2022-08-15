import { WebPlugin } from "@capacitor/core";
import { FirebaseApp } from "firebase/app";
import { Value } from "firebase/remote-config";
import {
  FirebaseRemoteConfigPlugin,
  initOptions,
  RCReturnData,
  RCValueOption,
} from "./definitions";
export declare class FirebaseRemoteConfigWeb
  extends WebPlugin
  implements FirebaseRemoteConfigPlugin
{
  private appRef;
  private ErrorMissingDefaultConfigMessage;
  private ErrorRemoteConfigNotInitializedMessage;
  initializeFirebase(app: FirebaseApp): Promise<void>;
  setDefaultConfig(options: any): Promise<void>;
  initialize(options?: initOptions): Promise<void>;
  fetch(): Promise<void>;
  activate(): Promise<void>;
  fetchAndActivate(): Promise<void>;
  getValue(options: RCValueOption): Promise<Value>;
  getBoolean(options: RCValueOption): Promise<RCReturnData>;
  getNumber(options: RCValueOption): Promise<RCReturnData>;
  getString(options: RCValueOption): Promise<RCReturnData>;
  /**
   * Returns remote config reference object
   */
  get remoteConfig(): import("@firebase/remote-config").RemoteConfig;
}
