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
    this.ErrMissingDefaultConfig = new Error("No default configuration found");
    this.ErrRemoteConfigNotInitialized = new Error(
      "Remote config is not initialized. Make sure initialize() is called first."
    );
  }
  async initializeFirebase(app) {
    this.remoteConfigRef = getRemoteConfig(app);
  }
  async setDefaultConfig(options) {
    if (!options) throw this.ErrMissingDefaultConfig;
    if (!this.remoteConfigRef) throw this.ErrRemoteConfigNotInitialized;
    this.remoteConfigRef.defaultConfig = options;
  }
  async initialize(options) {
    if (!this.remoteConfigRef) throw this.ErrRemoteConfigNotInitialized;
    this.remoteConfigRef.settings = Object.assign(
      {
        minimumFetchIntervalMillis: 1000 * 60 * 60 * 12,
        fetchTimeoutMillis: 1000 * 60,
      },
      options
    );
  }
  async fetch() {
    if (!this.remoteConfigRef) throw this.ErrRemoteConfigNotInitialized;
    return fetchConfig(this.remoteConfigRef);
  }
  async activate() {
    if (!this.remoteConfigRef) throw this.ErrRemoteConfigNotInitialized;
    await activate(this.remoteConfigRef);
  }
  async fetchAndActivate() {
    if (!this.remoteConfigRef) throw this.ErrRemoteConfigNotInitialized;
    await fetchAndActivate(this.remoteConfigRef);
  }
  async getBoolean(options) {
    if (!this.remoteConfigRef) throw this.ErrRemoteConfigNotInitialized;
    return {
      key: options.key,
      value: getBoolean(this.remoteConfigRef, options.key).toString(),
      source: "",
    };
  }
  async getNumber(options) {
    if (!this.remoteConfigRef) throw this.ErrRemoteConfigNotInitialized;
    return {
      key: options.key,
      value: getNumber(this.remoteConfigRef, options.key).toString(),
      source: "",
    };
  }
  async getString(options) {
    if (!this.remoteConfigRef) throw this.ErrRemoteConfigNotInitialized;
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
//# sourceMappingURL=web.js.map
