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
} from "firebase/remote-config";
import {
  FirebaseRemoteConfigPlugin,
  initOptions,
  RCReturnData,
  RCValueOption,
} from "./definitions";

export class FirebaseRemoteConfigWeb extends WebPlugin
  implements FirebaseRemoteConfigPlugin {
  private appRef: FirebaseApp;
  private ErrorMissingDefaultConfigMessage = "No default configuration found";
  private ErrorRemoteConfigNotInitializedMessage =
    "Remote config is not initialized. Make sure initialize() is called first.";

  constructor() {
    super({
      name: "FirebaseRemoteConfig",
      platforms: ["web"],
    });
  }

  async initializeFirebase(app: FirebaseApp) {
    this.appRef = app;
  }

  async setDefaultConfig(options: any): Promise<void> {
    if (!options) throw new Error(this.ErrorMissingDefaultConfigMessage);
    if (!this.remoteConfig)
      throw new Error(this.ErrorRemoteConfigNotInitializedMessage);
    this.remoteConfig.defaultConfig = options;
  }

  async initialize(options?: initOptions): Promise<void> {
    if (!this.remoteConfig)
      throw new Error(this.ErrorRemoteConfigNotInitializedMessage);

    this.remoteConfig.settings = {
      minimumFetchIntervalMillis: 1000 * 60 * 60 * 12, // default: 12 hours
      fetchTimeoutMillis: 1000 * 60, // default: 1 minute
      ...options,
    };
  }

  async fetch(): Promise<void> {
    if (!this.remoteConfig)
      throw new Error(this.ErrorRemoteConfigNotInitializedMessage);
    return fetchConfig(this.remoteConfig);
  }

  async activate(): Promise<void> {
    if (!this.remoteConfig)
      throw new Error(this.ErrorRemoteConfigNotInitializedMessage);
    await activate(this.remoteConfig);
  }

  async fetchAndActivate(): Promise<void> {
    if (!this.remoteConfig)
      throw new Error(this.ErrorRemoteConfigNotInitializedMessage);
    await fetchAndActivate(this.remoteConfig);
  }

  async getBoolean(options: RCValueOption): Promise<RCReturnData> {
    if (!this.remoteConfig)
      throw new Error(this.ErrorRemoteConfigNotInitializedMessage);
    return {
      key: options.key,
      value: getBoolean(this.remoteConfig, options.key).toString(),
      source: "",
    };
  }

  async getNumber(options: RCValueOption): Promise<RCReturnData> {
    if (!this.remoteConfig)
      throw new Error(this.ErrorRemoteConfigNotInitializedMessage);
    return {
      key: options.key,
      value: getNumber(this.remoteConfig, options.key).toString(),
      source: "",
    };
  }

  async getString(options: RCValueOption): Promise<RCReturnData> {
    if (!this.remoteConfig)
      throw new Error(this.ErrorRemoteConfigNotInitializedMessage);
    return {
      key: options.key,
      value: getString(this.remoteConfig, options.key),
      source: "",
    };
  }

  /**
   * Returns remote config reference object
   */
  get remoteConfig() {
    return getRemoteConfig(this.appRef);
  }
}
