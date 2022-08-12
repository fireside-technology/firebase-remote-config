import { WebPlugin } from "@capacitor/core";
import { FirebaseApp } from "firebase/app";
import {
  fetchConfig,
  activate,
  fetchAndActivate,
  getRemoteConfig,
  getValue,
  Value,
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

  async getValue(options: RCValueOption): Promise<Value> {
    if (!this.remoteConfig)
      throw new Error(this.ErrorRemoteConfigNotInitializedMessage);

    return getValue(this.remoteConfig, options.key);
  }

  async getBoolean(options: RCValueOption): Promise<RCReturnData> {
    const value = await this.getValue(options);
    return {
      key: options.key,
      value: value.asBoolean(),
      source: value.getSource(),
    };
  }

  async getNumber(options: RCValueOption): Promise<RCReturnData> {
    const value = await this.getValue(options);
    return {
      key: options.key,
      value: value.asNumber(),
      source: value.getSource(),
    };
  }

  async getString(options: RCValueOption): Promise<RCReturnData> {
    const value = await this.getValue(options);
    return {
      key: options.key,
      value: value.asString(),
      source: value.getSource(),
    };
  }

  /**
   * Returns remote config reference object
   */
  get remoteConfig() {
    return getRemoteConfig(this.appRef);
  }
}
