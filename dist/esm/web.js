import { WebPlugin } from "@capacitor/core";
import {
  fetchConfig,
  activate,
  fetchAndActivate,
  getBoolean,
  getRemoteConfig,
  getNumber,
  getString,
} from "firebase/remote-config";
export class FirebaseRemoteConfigWeb extends WebPlugin {
  constructor() {
    super({
      name: "FirebaseRemoteConfig",
      platforms: ["web"],
    });
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
  async getBoolean(options) {
    if (!this.remoteConfig)
      throw new Error(this.ErrorRemoteConfigNotInitializedMessage);
    return {
      key: options.key,
      value: getBoolean(this.remoteConfig, options.key).toString(),
      source: "",
    };
  }
  async getNumber(options) {
    if (!this.remoteConfig)
      throw new Error(this.ErrorRemoteConfigNotInitializedMessage);
    return {
      key: options.key,
      value: getNumber(this.remoteConfig, options.key).toString(),
      source: "",
    };
  }
  async getString(options) {
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
//# sourceMappingURL=web.js.map
