import { WebPlugin } from "@capacitor/core";
import {
  fetchConfig,
  activate,
  fetchAndActivate,
  getRemoteConfig,
  getValue,
} from "firebase/remote-config";
export class FirebaseRemoteConfigWeb extends WebPlugin {
  constructor() {
    super(...arguments);
    this.ErrorMissingDefaultConfigMessage = "No default configuration found";
    this.ErrorRemoteConfigNotInitializedMessage =
      "Remote config is not initialized. Make sure initialize() is called first.";
  }
  async initializeFirebase(app) {
    this.appRef = app;
  }
  async setDefaultConfig(options) {
    if (!options) throw new Error(this.ErrorMissingDefaultConfigMessage);
    if (!this.remoteConfig)
      throw new Error(this.ErrorRemoteConfigNotInitializedMessage);
    this.remoteConfig.defaultConfig = options;
  }
  async initialize(options) {
    if (!this.remoteConfig)
      throw new Error(this.ErrorRemoteConfigNotInitializedMessage);
    this.remoteConfig.settings = Object.assign(
      {
        minimumFetchIntervalMillis: 1000 * 60 * 60 * 12,
        fetchTimeoutMillis: 1000 * 60,
      },
      options
    );
  }
  async fetch() {
    if (!this.remoteConfig)
      throw new Error(this.ErrorRemoteConfigNotInitializedMessage);
    return fetchConfig(this.remoteConfig);
  }
  async activate() {
    if (!this.remoteConfig)
      throw new Error(this.ErrorRemoteConfigNotInitializedMessage);
    await activate(this.remoteConfig);
  }
  async fetchAndActivate() {
    if (!this.remoteConfig)
      throw new Error(this.ErrorRemoteConfigNotInitializedMessage);
    await fetchAndActivate(this.remoteConfig);
  }
  async getValue(options) {
    if (!this.remoteConfig)
      throw new Error(this.ErrorRemoteConfigNotInitializedMessage);
    return getValue(this.remoteConfig, options.key);
  }
  async getBoolean(options) {
    const value = await this.getValue(options);
    return {
      key: options.key,
      value: value.asBoolean(),
      source: value.getSource(),
    };
  }
  async getNumber(options) {
    const value = await this.getValue(options);
    return {
      key: options.key,
      value: value.asNumber(),
      source: value.getSource(),
    };
  }
  async getString(options) {
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
//# sourceMappingURL=web.js.map
