var capacitorPlugin = (function (exports, core) {
  "use strict";

  const FirebaseRemoteConfig = core.registerPlugin("FirebaseRemoteConfig", {
    web: () =>
      Promise.resolve()
        .then(function () {
          return web;
        })
        .then((m) => new m.FirebaseRemoteConfigWeb()),
  });

  class FirebaseRemoteConfigWeb extends core.WebPlugin {
    constructor() {
      super({
        name: "FirebaseRemoteConfig",
        platforms: ["web"],
      });
      this.scripts = [
        {
          key: "firebase-app",
          src: "https://www.gstatic.com/firebasejs/7.15.4/firebase-app.js",
        },
        {
          key: "firebase-rc",
          src:
            "https://www.gstatic.com/firebasejs/7.15.4/firebase-remote-config.js",
        },
      ];
      this.ready = new Promise((resolve) => (this.readyResolver = resolve));
      this.configure();
    }
    initializeFirebase(options) {
      return new Promise(async (resolve, reject) => {
        await this.ready;
        if (options && !this.isFirebaseInitialized()) {
          const app = window.firebase.initializeApp(options);
          this.remoteConfigRef = app.remoteConfig();
          resolve();
          return;
        }
        reject("Firebase App already initialized.");
      });
    }
    setDefaultWebConfig(options) {
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
    initialize(options) {
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
    fetch() {
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
    activate() {
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
    fetchAndActivate() {
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
          .then((data) => {
            console.log(data);
            resolve(data);
          })
          .catch(reject);
      });
    }
    getBoolean(options) {
      return new Promise(async (resolve, reject) => {
        await this.ready;
        if (!this.remoteConfigRef) {
          reject(
            "Remote config is not initialized. Make sure initialize() is called at first."
          );
          return;
        }
        resolve(this.remoteConfigRef.getValue(options.key).asBoolean());
      });
    }
    getByteArray(options) {
      return new Promise(async (resolve, reject) => {
        await this.ready;
        if (!this.remoteConfigRef) {
          reject(
            "Remote config is not initialized. Make sure initialize() is called at first."
          );
          return;
        }
        resolve(this.remoteConfigRef.getValue(options.key).asString());
      });
    }
    getNumber(options) {
      return new Promise(async (resolve, reject) => {
        await this.ready;
        if (!this.remoteConfigRef) {
          reject(
            "Remote config is not initialized. Make sure initialize() is called at first."
          );
          return;
        }
        resolve(this.remoteConfigRef.getValue(options.key).asNumber());
      });
    }
    getString(options) {
      return new Promise(async (resolve, reject) => {
        await this.ready;
        if (!this.remoteConfigRef) {
          reject(
            "Remote config is not initialized. Make sure initialize() is called at first."
          );
          return;
        }
        // "key": key! as String,
        //  "value": value! as Bool,
        //  "source": source!.rawValue as Int
        resolve(this.remoteConfigRef.getValue(options.key));
      });
    }
    get remoteConfig() {
      return this.remoteConfigRef;
    }
    async configure() {
      try {
        await this.loadScripts();
        if (window.firebase && this.isFirebaseInitialized()) {
          this.remoteConfigRef = window.firebase.remoteConfig();
        } else {
          console.error("Firebase App has not yet initialized.");
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
    loadScripts() {
      return new Promise((resolve, reject) => {
        const scripts = this.scripts.map((script) => script.key);
        if (
          document.getElementById(scripts[0]) &&
          document.getElementById(scripts[1])
        ) {
          return resolve();
        }
        this.scripts.forEach((script) => {
          const file = document.createElement("script");
          file.type = "text/javascript";
          file.src = script.src;
          file.id = script.key;
          file.onload = resolve;
          file.onerror = reject;
          document.querySelector("head").appendChild(file);
        });
      });
    }
    isFirebaseInitialized() {
      if (!window.firebase) {
        return false;
      }
      const firebaseApps = window.firebase.apps;
      if (firebaseApps && firebaseApps.length === 0) {
        return false;
      }
      return true;
    }
  }

  var web = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    FirebaseRemoteConfigWeb: FirebaseRemoteConfigWeb,
  });

  exports.FirebaseRemoteConfig = FirebaseRemoteConfig;

  Object.defineProperty(exports, "__esModule", { value: true });

  return exports;
})({}, capacitorExports);
//# sourceMappingURL=plugin.js.map
