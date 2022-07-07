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
  /**
   * Returns remote config reference object
   */
  get remoteConfig(): any;
  /**
   * Ready resolver to check and load firebase analytics
   */
  private configure;
  /**
   * Check for existing loaded script and load new scripts
   */
  private loadScripts;
  /**
   * Loaded single script with provided id and source
   * @param id - unique identifier of the script
   * @param src - source of the script
   */
  private loadScript;
  /**
   * Returns true/false if firebase object reference exists inside window
   */
  private hasFirebaseInitialized;
}
