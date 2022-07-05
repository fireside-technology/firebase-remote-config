import { WebPlugin } from "@capacitor/core";
import {
  FirebaseRemoteConfigPlugin,
  RCValueOption,
  RCReturnData,
  RCReturnDataArray,
} from "./definitions";

declare var window: any;

export class FirebaseRemoteConfigWeb extends WebPlugin
  implements FirebaseRemoteConfigPlugin {
  public readonly ready: Promise<any>;
  private readyResolver: Function;
  private remoteConfigRef: any;

  private scripts = [
    {
      key: "firebase-app",
      src: "https://www.gstatic.com/firebasejs/8.2.3/firebase-app.js",
    },
    {
      key: "firebase-rc",
      src: "https://www.gstatic.com/firebasejs/8.2.3/firebase-remote-config.js",
    },
  ];

  constructor() {
    super({
      name: "FirebaseRemoteConfig",
      platforms: ["web"],
    });

    this.ready = new Promise((resolve) => (this.readyResolver = resolve));
    this.configure().catch((err) => console.error(err));
  }

  initializeFirebase(options: any): Promise<void> {
    return new Promise(async (resolve, reject) => {
      await this.ready;

      if (options && !this.hasFirebaseInitialized()) {
        const app = window.firebase.initializeApp(options);
        this.remoteConfigRef = app.remoteConfig();

        resolve();
        return;
      }

      reject("Firebase App already initialized.");
    });
  }

  setDefaultWebConfig(options: any): Promise<void> {
    return new Promise(async (resolve, reject) => {
      await this.ready;

      if (!options) {
        reject("No default configuration found.");
        return;
      }

      if (!this.remoteConfigRef) {
        reject(
          "Remote config is not initialized. Make sure initialize() is called at first."
        );
        return;
      }

      this.remoteConfigRef.defaultConfig = options;
      resolve();
    });
  }

  initialize(options: {
    minimumFetchIntervalInSeconds: number;
  }): Promise<void> {
    return new Promise(async (resolve, reject) => {
      await this.ready;

      if (!this.remoteConfigRef) {
        reject(
          "Remote config is not initialized. Make sure initialize() is called at first."
        );
        return;
      }

      const interval =
        options && options.minimumFetchIntervalInSeconds
          ? options.minimumFetchIntervalInSeconds
          : 3600;

      this.remoteConfigRef.settings = {
        minimumFetchIntervalInSeconds: interval,
      };

      resolve();
    });
  }

  fetch(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      await this.ready;

      if (!this.remoteConfigRef) {
        reject(
          "Remote config is not initialized. Make sure initialize() is called at first."
        );
        return;
      }

      this.remoteConfigRef.fetch().then(resolve).catch(reject);
    });
  }

  activate(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      await this.ready;

      if (!this.remoteConfigRef) {
        reject(
          "Remote config is not initialized. Make sure initialize() is called at first."
        );
        return;
      }

      this.remoteConfigRef.activate().then(resolve).catch(reject);
    });
  }

  fetchAndActivate(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      await this.ready;

      if (!this.remoteConfigRef) {
        reject(
          "Remote config is not initialized. Make sure initialize() is called at first."
        );
        return;
      }

      window.firebase
        .remoteConfig()
        .fetchAndActivate()
        .then((data: any) => {
          console.log(data);
          resolve(data);
        })
        .catch(reject);
    });
  }

  getBoolean(options: RCValueOption): Promise<RCReturnData> {
    return new Promise(async (resolve, reject) => {
      await this.ready;

      if (!this.remoteConfigRef) {
        reject(
          "Remote config is not initialized. Make sure initialize() is called at first."
        );
        return;
      }

      resolve({
        key: options.key,
        value: await this.remoteConfigRef.getValue(options.key).asBoolean(),
        source: "",
      });
    });
  }

  getByteArray(options: RCValueOption): Promise<RCReturnDataArray> {
    return new Promise(async (resolve, reject) => {
      await this.ready;

      if (!this.remoteConfigRef) {
        reject(
          "Remote config is not initialized. Make sure initialize() is called at first."
        );
        return;
      }

      resolve({
        key: options.key,
        value: await this.remoteConfigRef.getValue(options.key).asString(),
        source: "",
      });
    });
  }

  getNumber(options: RCValueOption): Promise<RCReturnData> {
    return new Promise(async (resolve, reject) => {
      await this.ready;

      if (!this.remoteConfigRef) {
        reject(
          "Remote config is not initialized. Make sure initialize() is called at first."
        );
        return;
      }

      resolve({
        key: options.key,
        value: await this.remoteConfigRef.getValue(options.key).asNumber(),
        source: "",
      });
    });
  }

  getString(options: RCValueOption): Promise<RCReturnData> {
    return new Promise(async (resolve, reject) => {
      await this.ready;

      if (!this.remoteConfigRef) {
        reject(
          "Remote config is not initialized. Make sure initialize() is called at first."
        );
        return;
      }

      resolve({
        key: options.key,
        value: await this.remoteConfigRef.getValue(options.key),
        source: "",
      });
    });
  }

  /**
   * Returns remote config reference object
   */
  get remoteConfig() {
    return this.remoteConfigRef;
  }

  /**
   * Ready resolver to check and load firebase analytics
   */
  private async configure() {
    try {
      await this.loadScripts();

      if (
        window.firebase &&
        window.firebase.remoteConfig &&
        this.hasFirebaseInitialized()
      ) {
        this.remoteConfigRef = window.firebase.remoteConfig();
      }
    } catch (error) {
      throw error;
    }

    const interval = setInterval(() => {
      if (!window.firebase) {
        return;
      }
      clearInterval(interval);
      this.readyResolver();
    }, 50);
  }

  /**
   * Check for existing loaded script and load new scripts
   */
  private loadScripts() {
    const firebaseAppScript = this.scripts[0];
    const firebaseRemoteConfigScript = this.scripts[1];

    return new Promise(async (resolve, _reject) => {
      const scripts = this.scripts.map((script) => script.key);
      if (
        document.getElementById(scripts[0]) &&
        document.getElementById(scripts[1])
      ) {
        return resolve(null);
      }

      await this.loadScript(firebaseAppScript.key, firebaseAppScript.src);
      await this.loadScript(
        firebaseRemoteConfigScript.key,
        firebaseRemoteConfigScript.src
      );
      resolve(null);
    });
  }

  /**
   * Loaded single script with provided id and source
   * @param id - unique identifier of the script
   * @param src - source of the script
   */
  private loadScript(id: string, src: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const file = document.createElement("script");
      file.type = "text/javascript";
      file.src = src;
      file.id = id;
      file.onload = resolve;
      file.onerror = reject;
      document.querySelector("head").appendChild(file);
    });
  }

  /**
   * Returns true/false if firebase object reference exists inside window
   */
  private hasFirebaseInitialized() {
    if (!window.firebase) {
      return false;
    }

    const firebaseApps = window.firebase.apps;
    return !(firebaseApps && firebaseApps.length === 0);
  }
}
