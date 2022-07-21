import { WebPlugin } from "@capacitor/core";
import { FirebaseApp } from "firebase/app";
import {
  fetchConfig,
  activate,
  fetchAndActivate,
  getBoolean,
  getRemoteConfig,
  getNumber,
  getString,
  RemoteConfig,
} from "firebase/remote-config";
import {
  FirebaseRemoteConfigPlugin,
  initOptions,
  RCReturnData,
  RCValueOption,
} from "./definitions";

export class FirebaseRemoteConfigWeb extends WebPlugin
  implements FirebaseRemoteConfigPlugin {
  private remoteConfigRef: RemoteConfig;
  public ErrorMissingDefaultConfigMessage = "No default configuration found";
  public ErrorRemoteConfigNotInitializedMessage =
    "Remote config is not initialized. Make sure initialize() is called first.";

  constructor() {
    super({
      name: "FirebaseRemoteConfig",
      platforms: ["web"],
    });
  }

  async initializeFirebase(app: FirebaseApp) {
    this.remoteConfigRef = getRemoteConfig(app);
  }

  async setDefaultConfig(options: any): Promise<void> {
    if (!options) throw new Error(this.ErrorMissingDefaultConfigMessage);
    if (!this.remoteConfigRef)
      throw new Error(this.ErrorRemoteConfigNotInitializedMessage);
    this.remoteConfigRef.defaultConfig = options;
  }

  async initialize(options?: initOptions): Promise<void> {
    if (!this.remoteConfigRef)
      throw new Error(this.ErrorRemoteConfigNotInitializedMessage);

    this.remoteConfigRef.settings = {
      minimumFetchIntervalMillis: 1000 * 60 * 60 * 12, // default: 12 hours
      fetchTimeoutMillis: 1000 * 60, // default: 1 minute
      ...options,
    };
  }

  async fetch(): Promise<void> {
    if (!this.remoteConfigRef)
      throw new Error(this.ErrorRemoteConfigNotInitializedMessage);
    return fetchConfig(this.remoteConfigRef);
  }

  async activate(): Promise<void> {
    if (!this.remoteConfigRef)
      throw new Error(this.ErrorRemoteConfigNotInitializedMessage);
    await activate(this.remoteConfigRef);
  }

  async fetchAndActivate(): Promise<void> {
    if (!this.remoteConfigRef)
      throw new Error(this.ErrorRemoteConfigNotInitializedMessage);
    await fetchAndActivate(this.remoteConfigRef);
  }

  async getBoolean(options: RCValueOption): Promise<RCReturnData> {
    if (!this.remoteConfigRef)
      throw new Error(this.ErrorRemoteConfigNotInitializedMessage);
    return {
      key: options.key,
      value: getBoolean(this.remoteConfigRef, options.key).toString(),
      source: "",
    };
  }

  async getNumber(options: RCValueOption): Promise<RCReturnData> {
    if (!this.remoteConfigRef)
      throw new Error(this.ErrorRemoteConfigNotInitializedMessage);
    return {
      key: options.key,
      value: getNumber(this.remoteConfigRef, options.key).toString(),
      source: "",
    };
  }

  async getString(options: RCValueOption): Promise<RCReturnData> {
    if (!this.remoteConfigRef)
      throw new Error(this.ErrorRemoteConfigNotInitializedMessage);
    return {
      key: options.key,
      value: getString(this.remoteConfigRef, options.key),
      source: "",
    };
  }

  /**
   * Returns remote config reference object
   */
  get remoteConfig() {
    return this.remoteConfigRef;
  }
}
