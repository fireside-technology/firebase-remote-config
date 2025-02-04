"use strict";

Object.defineProperty(exports, "__esModule", { value: true });

var core = require("@capacitor/core");

const FirebaseRemoteConfig = core.registerPlugin("FirebaseRemoteConfig", {
  web: () =>
    Promise.resolve()
      .then(function () {
        return web;
      })
      .then((m) => new m.FirebaseRemoteConfigWeb()),
});

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const stringToByteArray$1 = function (str) {
  // TODO(user): Use native implementations if/when available
  const out = [];
  let p = 0;
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 128) {
      out[p++] = c;
    } else if (c < 2048) {
      out[p++] = (c >> 6) | 192;
      out[p++] = (c & 63) | 128;
    } else if (
      (c & 0xfc00) === 0xd800 &&
      i + 1 < str.length &&
      (str.charCodeAt(i + 1) & 0xfc00) === 0xdc00
    ) {
      // Surrogate Pair
      c = 0x10000 + ((c & 0x03ff) << 10) + (str.charCodeAt(++i) & 0x03ff);
      out[p++] = (c >> 18) | 240;
      out[p++] = ((c >> 12) & 63) | 128;
      out[p++] = ((c >> 6) & 63) | 128;
      out[p++] = (c & 63) | 128;
    } else {
      out[p++] = (c >> 12) | 224;
      out[p++] = ((c >> 6) & 63) | 128;
      out[p++] = (c & 63) | 128;
    }
  }
  return out;
};
/**
 * Turns an array of numbers into the string given by the concatenation of the
 * characters to which the numbers correspond.
 * @param bytes Array of numbers representing characters.
 * @return Stringification of the array.
 */
const byteArrayToString = function (bytes) {
  // TODO(user): Use native implementations if/when available
  const out = [];
  let pos = 0,
    c = 0;
  while (pos < bytes.length) {
    const c1 = bytes[pos++];
    if (c1 < 128) {
      out[c++] = String.fromCharCode(c1);
    } else if (c1 > 191 && c1 < 224) {
      const c2 = bytes[pos++];
      out[c++] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
    } else if (c1 > 239 && c1 < 365) {
      // Surrogate Pair
      const c2 = bytes[pos++];
      const c3 = bytes[pos++];
      const c4 = bytes[pos++];
      const u =
        (((c1 & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63)) -
        0x10000;
      out[c++] = String.fromCharCode(0xd800 + (u >> 10));
      out[c++] = String.fromCharCode(0xdc00 + (u & 1023));
    } else {
      const c2 = bytes[pos++];
      const c3 = bytes[pos++];
      out[c++] = String.fromCharCode(
        ((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63)
      );
    }
  }
  return out.join("");
};
// We define it as an object literal instead of a class because a class compiled down to es5 can't
// be treeshaked. https://github.com/rollup/rollup/issues/1691
// Static lookup maps, lazily populated by init_()
const base64 = {
  /**
   * Maps bytes to characters.
   */
  byteToCharMap_: null,
  /**
   * Maps characters to bytes.
   */
  charToByteMap_: null,
  /**
   * Maps bytes to websafe characters.
   * @private
   */
  byteToCharMapWebSafe_: null,
  /**
   * Maps websafe characters to bytes.
   * @private
   */
  charToByteMapWebSafe_: null,
  /**
   * Our default alphabet, shared between
   * ENCODED_VALS and ENCODED_VALS_WEBSAFE
   */
  ENCODED_VALS_BASE:
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + "abcdefghijklmnopqrstuvwxyz" + "0123456789",
  /**
   * Our default alphabet. Value 64 (=) is special; it means "nothing."
   */
  get ENCODED_VALS() {
    return this.ENCODED_VALS_BASE + "+/=";
  },
  /**
   * Our websafe alphabet.
   */
  get ENCODED_VALS_WEBSAFE() {
    return this.ENCODED_VALS_BASE + "-_.";
  },
  /**
   * Whether this browser supports the atob and btoa functions. This extension
   * started at Mozilla but is now implemented by many browsers. We use the
   * ASSUME_* variables to avoid pulling in the full useragent detection library
   * but still allowing the standard per-browser compilations.
   *
   */
  HAS_NATIVE_SUPPORT: typeof atob === "function",
  /**
   * Base64-encode an array of bytes.
   *
   * @param input An array of bytes (numbers with
   *     value in [0, 255]) to encode.
   * @param webSafe Boolean indicating we should use the
   *     alternative alphabet.
   * @return The base64 encoded string.
   */
  encodeByteArray(input, webSafe) {
    if (!Array.isArray(input)) {
      throw Error("encodeByteArray takes an array as a parameter");
    }
    this.init_();
    const byteToCharMap = webSafe
      ? this.byteToCharMapWebSafe_
      : this.byteToCharMap_;
    const output = [];
    for (let i = 0; i < input.length; i += 3) {
      const byte1 = input[i];
      const haveByte2 = i + 1 < input.length;
      const byte2 = haveByte2 ? input[i + 1] : 0;
      const haveByte3 = i + 2 < input.length;
      const byte3 = haveByte3 ? input[i + 2] : 0;
      const outByte1 = byte1 >> 2;
      const outByte2 = ((byte1 & 0x03) << 4) | (byte2 >> 4);
      let outByte3 = ((byte2 & 0x0f) << 2) | (byte3 >> 6);
      let outByte4 = byte3 & 0x3f;
      if (!haveByte3) {
        outByte4 = 64;
        if (!haveByte2) {
          outByte3 = 64;
        }
      }
      output.push(
        byteToCharMap[outByte1],
        byteToCharMap[outByte2],
        byteToCharMap[outByte3],
        byteToCharMap[outByte4]
      );
    }
    return output.join("");
  },
  /**
   * Base64-encode a string.
   *
   * @param input A string to encode.
   * @param webSafe If true, we should use the
   *     alternative alphabet.
   * @return The base64 encoded string.
   */
  encodeString(input, webSafe) {
    // Shortcut for Mozilla browsers that implement
    // a native base64 encoder in the form of "btoa/atob"
    if (this.HAS_NATIVE_SUPPORT && !webSafe) {
      return btoa(input);
    }
    return this.encodeByteArray(stringToByteArray$1(input), webSafe);
  },
  /**
   * Base64-decode a string.
   *
   * @param input to decode.
   * @param webSafe True if we should use the
   *     alternative alphabet.
   * @return string representing the decoded value.
   */
  decodeString(input, webSafe) {
    // Shortcut for Mozilla browsers that implement
    // a native base64 encoder in the form of "btoa/atob"
    if (this.HAS_NATIVE_SUPPORT && !webSafe) {
      return atob(input);
    }
    return byteArrayToString(this.decodeStringToByteArray(input, webSafe));
  },
  /**
   * Base64-decode a string.
   *
   * In base-64 decoding, groups of four characters are converted into three
   * bytes.  If the encoder did not apply padding, the input length may not
   * be a multiple of 4.
   *
   * In this case, the last group will have fewer than 4 characters, and
   * padding will be inferred.  If the group has one or two characters, it decodes
   * to one byte.  If the group has three characters, it decodes to two bytes.
   *
   * @param input Input to decode.
   * @param webSafe True if we should use the web-safe alphabet.
   * @return bytes representing the decoded value.
   */
  decodeStringToByteArray(input, webSafe) {
    this.init_();
    const charToByteMap = webSafe
      ? this.charToByteMapWebSafe_
      : this.charToByteMap_;
    const output = [];
    for (let i = 0; i < input.length; ) {
      const byte1 = charToByteMap[input.charAt(i++)];
      const haveByte2 = i < input.length;
      const byte2 = haveByte2 ? charToByteMap[input.charAt(i)] : 0;
      ++i;
      const haveByte3 = i < input.length;
      const byte3 = haveByte3 ? charToByteMap[input.charAt(i)] : 64;
      ++i;
      const haveByte4 = i < input.length;
      const byte4 = haveByte4 ? charToByteMap[input.charAt(i)] : 64;
      ++i;
      if (byte1 == null || byte2 == null || byte3 == null || byte4 == null) {
        throw Error();
      }
      const outByte1 = (byte1 << 2) | (byte2 >> 4);
      output.push(outByte1);
      if (byte3 !== 64) {
        const outByte2 = ((byte2 << 4) & 0xf0) | (byte3 >> 2);
        output.push(outByte2);
        if (byte4 !== 64) {
          const outByte3 = ((byte3 << 6) & 0xc0) | byte4;
          output.push(outByte3);
        }
      }
    }
    return output;
  },
  /**
   * Lazy static initialization function. Called before
   * accessing any of the static map variables.
   * @private
   */
  init_() {
    if (!this.byteToCharMap_) {
      this.byteToCharMap_ = {};
      this.charToByteMap_ = {};
      this.byteToCharMapWebSafe_ = {};
      this.charToByteMapWebSafe_ = {};
      // We want quick mappings back and forth, so we precompute two maps.
      for (let i = 0; i < this.ENCODED_VALS.length; i++) {
        this.byteToCharMap_[i] = this.ENCODED_VALS.charAt(i);
        this.charToByteMap_[this.byteToCharMap_[i]] = i;
        this.byteToCharMapWebSafe_[i] = this.ENCODED_VALS_WEBSAFE.charAt(i);
        this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[i]] = i;
        // Be forgiving when decoding and correctly decode both encodings.
        if (i >= this.ENCODED_VALS_BASE.length) {
          this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(i)] = i;
          this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(i)] = i;
        }
      }
    }
  },
};
/**
 * URL-safe base64 encoding
 */
const base64Encode = function (str) {
  const utf8Bytes = stringToByteArray$1(str);
  return base64.encodeByteArray(utf8Bytes, true);
};
/**
 * URL-safe base64 encoding (without "." padding in the end).
 * e.g. Used in JSON Web Token (JWT) parts.
 */
const base64urlEncodeWithoutPadding = function (str) {
  // Use base64url encoding and remove padding in the end (dot characters).
  return base64Encode(str).replace(/\./g, "");
};
/**
 * This method checks if indexedDB is supported by current browser/service worker context
 * @return true if indexedDB is supported by current browser/service worker context
 */
function isIndexedDBAvailable() {
  return typeof indexedDB === "object";
}
/**
 * This method validates browser/sw context for indexedDB by opening a dummy indexedDB database and reject
 * if errors occur during the database open operation.
 *
 * @throws exception if current browser/sw context can't run idb.open (ex: Safari iframe, Firefox
 * private browsing)
 */
function validateIndexedDBOpenable() {
  return new Promise((resolve, reject) => {
    try {
      let preExist = true;
      const DB_CHECK_NAME =
        "validate-browser-context-for-indexeddb-analytics-module";
      const request = self.indexedDB.open(DB_CHECK_NAME);
      request.onsuccess = () => {
        request.result.close();
        // delete database only when it doesn't pre-exist
        if (!preExist) {
          self.indexedDB.deleteDatabase(DB_CHECK_NAME);
        }
        resolve(true);
      };
      request.onupgradeneeded = () => {
        preExist = false;
      };
      request.onerror = () => {
        var _a;
        reject(
          ((_a = request.error) === null || _a === void 0
            ? void 0
            : _a.message) || ""
        );
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @fileoverview Standardized Firebase Error.
 *
 * Usage:
 *
 *   // Typescript string literals for type-safe codes
 *   type Err =
 *     'unknown' |
 *     'object-not-found'
 *     ;
 *
 *   // Closure enum for type-safe error codes
 *   // at-enum {string}
 *   var Err = {
 *     UNKNOWN: 'unknown',
 *     OBJECT_NOT_FOUND: 'object-not-found',
 *   }
 *
 *   let errors: Map<Err, string> = {
 *     'generic-error': "Unknown error",
 *     'file-not-found': "Could not find file: {$file}",
 *   };
 *
 *   // Type-safe function - must pass a valid error code as param.
 *   let error = new ErrorFactory<Err>('service', 'Service', errors);
 *
 *   ...
 *   throw error.create(Err.GENERIC);
 *   ...
 *   throw error.create(Err.FILE_NOT_FOUND, {'file': fileName});
 *   ...
 *   // Service: Could not file file: foo.txt (service/file-not-found).
 *
 *   catch (e) {
 *     assert(e.message === "Could not find file: foo.txt.");
 *     if ((e as FirebaseError)?.code === 'service/file-not-found') {
 *       console.log("Could not read file: " + e['file']);
 *     }
 *   }
 */
const ERROR_NAME = "FirebaseError";
// Based on code from:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#Custom_Error_Types
class FirebaseError extends Error {
  constructor(
    /** The error code for this error. */
    code,
    message,
    /** Custom data for this error. */
    customData
  ) {
    super(message);
    this.code = code;
    this.customData = customData;
    /** The custom name for all FirebaseErrors. */
    this.name = ERROR_NAME;
    // Fix For ES5
    // https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, FirebaseError.prototype);
    // Maintains proper stack trace for where our error was thrown.
    // Only available on V8.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ErrorFactory.prototype.create);
    }
  }
}
class ErrorFactory {
  constructor(service, serviceName, errors) {
    this.service = service;
    this.serviceName = serviceName;
    this.errors = errors;
  }
  create(code, ...data) {
    const customData = data[0] || {};
    const fullCode = `${this.service}/${code}`;
    const template = this.errors[code];
    const message = template ? replaceTemplate(template, customData) : "Error";
    // Service Name: Error message (service/code).
    const fullMessage = `${this.serviceName}: ${message} (${fullCode}).`;
    const error = new FirebaseError(fullCode, fullMessage, customData);
    return error;
  }
}
function replaceTemplate(template, data) {
  return template.replace(PATTERN, (_, key) => {
    const value = data[key];
    return value != null ? String(value) : `<${key}?>`;
  });
}
const PATTERN = /\{\$([^}]+)}/g;

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * The amount of milliseconds to exponentially increase.
 */
const DEFAULT_INTERVAL_MILLIS = 1000;
/**
 * The factor to backoff by.
 * Should be a number greater than 1.
 */
const DEFAULT_BACKOFF_FACTOR = 2;
/**
 * The maximum milliseconds to increase to.
 *
 * <p>Visible for testing
 */
const MAX_VALUE_MILLIS = 4 * 60 * 60 * 1000; // Four hours, like iOS and Android.
/**
 * The percentage of backoff time to randomize by.
 * See
 * http://go/safe-client-behavior#step-1-determine-the-appropriate-retry-interval-to-handle-spike-traffic
 * for context.
 *
 * <p>Visible for testing
 */
const RANDOM_FACTOR = 0.5;
/**
 * Based on the backoff method from
 * https://github.com/google/closure-library/blob/master/closure/goog/math/exponentialbackoff.js.
 * Extracted here so we don't need to pass metadata and a stateful ExponentialBackoff object around.
 */
function calculateBackoffMillis(
  backoffCount,
  intervalMillis = DEFAULT_INTERVAL_MILLIS,
  backoffFactor = DEFAULT_BACKOFF_FACTOR
) {
  // Calculates an exponentially increasing value.
  // Deviation: calculates value from count and a constant interval, so we only need to save value
  // and count to restore state.
  const currBaseValue = intervalMillis * Math.pow(backoffFactor, backoffCount);
  // A random "fuzz" to avoid waves of retries.
  // Deviation: randomFactor is required.
  const randomWait = Math.round(
    // A fraction of the backoff value to add/subtract.
    // Deviation: changes multiplication order to improve readability.
    RANDOM_FACTOR *
      currBaseValue *
      // A random float (rounded to int by Math.round above) in the range [-1, 1]. Determines
      // if we add or subtract.
      (Math.random() - 0.5) *
      2
  );
  // Limits backoff to max to avoid effectively permanent backoff.
  return Math.min(MAX_VALUE_MILLIS, currBaseValue + randomWait);
}

/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function getModularInstance(service) {
  if (service && service._delegate) {
    return service._delegate;
  } else {
    return service;
  }
}

/**
 * Component for service name T, e.g. `auth`, `auth-internal`
 */
class Component {
  /**
   *
   * @param name The public service name, e.g. app, auth, firestore, database
   * @param instanceFactory Service factory responsible for creating the public interface
   * @param type whether the service provided by the component is public or private
   */
  constructor(name, instanceFactory, type) {
    this.name = name;
    this.instanceFactory = instanceFactory;
    this.type = type;
    this.multipleInstances = false;
    /**
     * Properties to be added to the service namespace
     */
    this.serviceProps = {};
    this.instantiationMode = "LAZY" /* LAZY */;
    this.onInstanceCreated = null;
  }
  setInstantiationMode(mode) {
    this.instantiationMode = mode;
    return this;
  }
  setMultipleInstances(multipleInstances) {
    this.multipleInstances = multipleInstances;
    return this;
  }
  setServiceProps(props) {
    this.serviceProps = props;
    return this;
  }
  setInstanceCreatedCallback(callback) {
    this.onInstanceCreated = callback;
    return this;
  }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * The JS SDK supports 5 log levels and also allows a user the ability to
 * silence the logs altogether.
 *
 * The order is a follows:
 * DEBUG < VERBOSE < INFO < WARN < ERROR
 *
 * All of the log types above the current log level will be captured (i.e. if
 * you set the log level to `INFO`, errors will still be logged, but `DEBUG` and
 * `VERBOSE` logs will not)
 */
var LogLevel;
(function (LogLevel) {
  LogLevel[(LogLevel["DEBUG"] = 0)] = "DEBUG";
  LogLevel[(LogLevel["VERBOSE"] = 1)] = "VERBOSE";
  LogLevel[(LogLevel["INFO"] = 2)] = "INFO";
  LogLevel[(LogLevel["WARN"] = 3)] = "WARN";
  LogLevel[(LogLevel["ERROR"] = 4)] = "ERROR";
  LogLevel[(LogLevel["SILENT"] = 5)] = "SILENT";
})(LogLevel || (LogLevel = {}));
const levelStringToEnum = {
  debug: LogLevel.DEBUG,
  verbose: LogLevel.VERBOSE,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
  silent: LogLevel.SILENT,
};
/**
 * The default log level
 */
const defaultLogLevel = LogLevel.INFO;
/**
 * By default, `console.debug` is not displayed in the developer console (in
 * chrome). To avoid forcing users to have to opt-in to these logs twice
 * (i.e. once for firebase, and once in the console), we are sending `DEBUG`
 * logs to the `console.log` function.
 */
const ConsoleMethod = {
  [LogLevel.DEBUG]: "log",
  [LogLevel.VERBOSE]: "log",
  [LogLevel.INFO]: "info",
  [LogLevel.WARN]: "warn",
  [LogLevel.ERROR]: "error",
};
/**
 * The default log handler will forward DEBUG, VERBOSE, INFO, WARN, and ERROR
 * messages on to their corresponding console counterparts (if the log method
 * is supported by the current log level)
 */
const defaultLogHandler = (instance, logType, ...args) => {
  if (logType < instance.logLevel) {
    return;
  }
  const now = new Date().toISOString();
  const method = ConsoleMethod[logType];
  if (method) {
    console[method](`[${now}]  ${instance.name}:`, ...args);
  } else {
    throw new Error(
      `Attempted to log a message with an invalid logType (value: ${logType})`
    );
  }
};
class Logger {
  /**
   * Gives you an instance of a Logger to capture messages according to
   * Firebase's logging scheme.
   *
   * @param name The name that the logs will be associated with
   */
  constructor(name) {
    this.name = name;
    /**
     * The log level of the given Logger instance.
     */
    this._logLevel = defaultLogLevel;
    /**
     * The main (internal) log handler for the Logger instance.
     * Can be set to a new function in internal package code but not by user.
     */
    this._logHandler = defaultLogHandler;
    /**
     * The optional, additional, user-defined log handler for the Logger instance.
     */
    this._userLogHandler = null;
  }
  get logLevel() {
    return this._logLevel;
  }
  set logLevel(val) {
    if (!(val in LogLevel)) {
      throw new TypeError(`Invalid value "${val}" assigned to \`logLevel\``);
    }
    this._logLevel = val;
  }
  // Workaround for setter/getter having to be the same type.
  setLogLevel(val) {
    this._logLevel = typeof val === "string" ? levelStringToEnum[val] : val;
  }
  get logHandler() {
    return this._logHandler;
  }
  set logHandler(val) {
    if (typeof val !== "function") {
      throw new TypeError("Value assigned to `logHandler` must be a function");
    }
    this._logHandler = val;
  }
  get userLogHandler() {
    return this._userLogHandler;
  }
  set userLogHandler(val) {
    this._userLogHandler = val;
  }
  /**
   * The functions below are all based on the `console` interface
   */
  debug(...args) {
    this._userLogHandler && this._userLogHandler(this, LogLevel.DEBUG, ...args);
    this._logHandler(this, LogLevel.DEBUG, ...args);
  }
  log(...args) {
    this._userLogHandler &&
      this._userLogHandler(this, LogLevel.VERBOSE, ...args);
    this._logHandler(this, LogLevel.VERBOSE, ...args);
  }
  info(...args) {
    this._userLogHandler && this._userLogHandler(this, LogLevel.INFO, ...args);
    this._logHandler(this, LogLevel.INFO, ...args);
  }
  warn(...args) {
    this._userLogHandler && this._userLogHandler(this, LogLevel.WARN, ...args);
    this._logHandler(this, LogLevel.WARN, ...args);
  }
  error(...args) {
    this._userLogHandler && this._userLogHandler(this, LogLevel.ERROR, ...args);
    this._logHandler(this, LogLevel.ERROR, ...args);
  }
}

const instanceOfAny = (object, constructors) =>
  constructors.some((c) => object instanceof c);

let idbProxyableTypes;
let cursorAdvanceMethods;
// This is a function to prevent it throwing up in node environments.
function getIdbProxyableTypes() {
  return (
    idbProxyableTypes ||
    (idbProxyableTypes = [
      IDBDatabase,
      IDBObjectStore,
      IDBIndex,
      IDBCursor,
      IDBTransaction,
    ])
  );
}
// This is a function to prevent it throwing up in node environments.
function getCursorAdvanceMethods() {
  return (
    cursorAdvanceMethods ||
    (cursorAdvanceMethods = [
      IDBCursor.prototype.advance,
      IDBCursor.prototype.continue,
      IDBCursor.prototype.continuePrimaryKey,
    ])
  );
}
const cursorRequestMap = new WeakMap();
const transactionDoneMap = new WeakMap();
const transactionStoreNamesMap = new WeakMap();
const transformCache = new WeakMap();
const reverseTransformCache = new WeakMap();
function promisifyRequest(request) {
  const promise = new Promise((resolve, reject) => {
    const unlisten = () => {
      request.removeEventListener("success", success);
      request.removeEventListener("error", error);
    };
    const success = () => {
      resolve(wrap(request.result));
      unlisten();
    };
    const error = () => {
      reject(request.error);
      unlisten();
    };
    request.addEventListener("success", success);
    request.addEventListener("error", error);
  });
  promise
    .then((value) => {
      // Since cursoring reuses the IDBRequest (*sigh*), we cache it for later retrieval
      // (see wrapFunction).
      if (value instanceof IDBCursor) {
        cursorRequestMap.set(value, request);
      }
      // Catching to avoid "Uncaught Promise exceptions"
    })
    .catch(() => {});
  // This mapping exists in reverseTransformCache but doesn't doesn't exist in transformCache. This
  // is because we create many promises from a single IDBRequest.
  reverseTransformCache.set(promise, request);
  return promise;
}
function cacheDonePromiseForTransaction(tx) {
  // Early bail if we've already created a done promise for this transaction.
  if (transactionDoneMap.has(tx)) return;
  const done = new Promise((resolve, reject) => {
    const unlisten = () => {
      tx.removeEventListener("complete", complete);
      tx.removeEventListener("error", error);
      tx.removeEventListener("abort", error);
    };
    const complete = () => {
      resolve();
      unlisten();
    };
    const error = () => {
      reject(tx.error || new DOMException("AbortError", "AbortError"));
      unlisten();
    };
    tx.addEventListener("complete", complete);
    tx.addEventListener("error", error);
    tx.addEventListener("abort", error);
  });
  // Cache it for later retrieval.
  transactionDoneMap.set(tx, done);
}
let idbProxyTraps = {
  get(target, prop, receiver) {
    if (target instanceof IDBTransaction) {
      // Special handling for transaction.done.
      if (prop === "done") return transactionDoneMap.get(target);
      // Polyfill for objectStoreNames because of Edge.
      if (prop === "objectStoreNames") {
        return target.objectStoreNames || transactionStoreNamesMap.get(target);
      }
      // Make tx.store return the only store in the transaction, or undefined if there are many.
      if (prop === "store") {
        return receiver.objectStoreNames[1]
          ? undefined
          : receiver.objectStore(receiver.objectStoreNames[0]);
      }
    }
    // Else transform whatever we get back.
    return wrap(target[prop]);
  },
  set(target, prop, value) {
    target[prop] = value;
    return true;
  },
  has(target, prop) {
    if (
      target instanceof IDBTransaction &&
      (prop === "done" || prop === "store")
    ) {
      return true;
    }
    return prop in target;
  },
};
function replaceTraps(callback) {
  idbProxyTraps = callback(idbProxyTraps);
}
function wrapFunction(func) {
  // Due to expected object equality (which is enforced by the caching in `wrap`), we
  // only create one new func per func.
  // Edge doesn't support objectStoreNames (booo), so we polyfill it here.
  if (
    func === IDBDatabase.prototype.transaction &&
    !("objectStoreNames" in IDBTransaction.prototype)
  ) {
    return function (storeNames, ...args) {
      const tx = func.call(unwrap(this), storeNames, ...args);
      transactionStoreNamesMap.set(
        tx,
        storeNames.sort ? storeNames.sort() : [storeNames]
      );
      return wrap(tx);
    };
  }
  // Cursor methods are special, as the behaviour is a little more different to standard IDB. In
  // IDB, you advance the cursor and wait for a new 'success' on the IDBRequest that gave you the
  // cursor. It's kinda like a promise that can resolve with many values. That doesn't make sense
  // with real promises, so each advance methods returns a new promise for the cursor object, or
  // undefined if the end of the cursor has been reached.
  if (getCursorAdvanceMethods().includes(func)) {
    return function (...args) {
      // Calling the original function with the proxy as 'this' causes ILLEGAL INVOCATION, so we use
      // the original object.
      func.apply(unwrap(this), args);
      return wrap(cursorRequestMap.get(this));
    };
  }
  return function (...args) {
    // Calling the original function with the proxy as 'this' causes ILLEGAL INVOCATION, so we use
    // the original object.
    return wrap(func.apply(unwrap(this), args));
  };
}
function transformCachableValue(value) {
  if (typeof value === "function") return wrapFunction(value);
  // This doesn't return, it just creates a 'done' promise for the transaction,
  // which is later returned for transaction.done (see idbObjectHandler).
  if (value instanceof IDBTransaction) cacheDonePromiseForTransaction(value);
  if (instanceOfAny(value, getIdbProxyableTypes()))
    return new Proxy(value, idbProxyTraps);
  // Return the same value back if we're not going to transform it.
  return value;
}
function wrap(value) {
  // We sometimes generate multiple promises from a single IDBRequest (eg when cursoring), because
  // IDB is weird and a single IDBRequest can yield many responses, so these can't be cached.
  if (value instanceof IDBRequest) return promisifyRequest(value);
  // If we've already transformed this value before, reuse the transformed value.
  // This is faster, but it also provides object equality.
  if (transformCache.has(value)) return transformCache.get(value);
  const newValue = transformCachableValue(value);
  // Not all types are transformed.
  // These may be primitive types, so they can't be WeakMap keys.
  if (newValue !== value) {
    transformCache.set(value, newValue);
    reverseTransformCache.set(newValue, value);
  }
  return newValue;
}
const unwrap = (value) => reverseTransformCache.get(value);

/**
 * Open a database.
 *
 * @param name Name of the database.
 * @param version Schema version.
 * @param callbacks Additional callbacks.
 */
function openDB(
  name,
  version,
  { blocked, upgrade, blocking, terminated } = {}
) {
  const request = indexedDB.open(name, version);
  const openPromise = wrap(request);
  if (upgrade) {
    request.addEventListener("upgradeneeded", (event) => {
      upgrade(
        wrap(request.result),
        event.oldVersion,
        event.newVersion,
        wrap(request.transaction)
      );
    });
  }
  if (blocked) request.addEventListener("blocked", () => blocked());
  openPromise
    .then((db) => {
      if (terminated) db.addEventListener("close", () => terminated());
      if (blocking) db.addEventListener("versionchange", () => blocking());
    })
    .catch(() => {});
  return openPromise;
}

const readMethods = ["get", "getKey", "getAll", "getAllKeys", "count"];
const writeMethods = ["put", "add", "delete", "clear"];
const cachedMethods = new Map();
function getMethod(target, prop) {
  if (
    !(
      target instanceof IDBDatabase &&
      !(prop in target) &&
      typeof prop === "string"
    )
  ) {
    return;
  }
  if (cachedMethods.get(prop)) return cachedMethods.get(prop);
  const targetFuncName = prop.replace(/FromIndex$/, "");
  const useIndex = prop !== targetFuncName;
  const isWrite = writeMethods.includes(targetFuncName);
  if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) ||
    !(isWrite || readMethods.includes(targetFuncName))
  ) {
    return;
  }
  const method = async function (storeName, ...args) {
    // isWrite ? 'readwrite' : undefined gzipps better, but fails in Edge :(
    const tx = this.transaction(storeName, isWrite ? "readwrite" : "readonly");
    let target = tx.store;
    if (useIndex) target = target.index(args.shift());
    // Must reject if op rejects.
    // If it's a write operation, must reject if tx.done rejects.
    // Must reject with op rejection first.
    // Must resolve with op value.
    // Must handle both promises (no unhandled rejections)
    return (
      await Promise.all([target[targetFuncName](...args), isWrite && tx.done])
    )[0];
  };
  cachedMethods.set(prop, method);
  return method;
}
replaceTraps((oldTraps) => ({
  ...oldTraps,
  get: (target, prop, receiver) =>
    getMethod(target, prop) || oldTraps.get(target, prop, receiver),
  has: (target, prop) =>
    !!getMethod(target, prop) || oldTraps.has(target, prop),
}));

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class PlatformLoggerServiceImpl {
  constructor(container) {
    this.container = container;
  }
  // In initial implementation, this will be called by installations on
  // auth token refresh, and installations will send this string.
  getPlatformInfoString() {
    const providers = this.container.getProviders();
    // Loop through providers and get library/version pairs from any that are
    // version components.
    return providers
      .map((provider) => {
        if (isVersionServiceProvider(provider)) {
          const service = provider.getImmediate();
          return `${service.library}/${service.version}`;
        } else {
          return null;
        }
      })
      .filter((logString) => logString)
      .join(" ");
  }
}
/**
 *
 * @param provider check if this provider provides a VersionService
 *
 * NOTE: Using Provider<'app-version'> is a hack to indicate that the provider
 * provides VersionService. The provider is not necessarily a 'app-version'
 * provider.
 */
function isVersionServiceProvider(provider) {
  const component = provider.getComponent();
  return (
    (component === null || component === void 0 ? void 0 : component.type) ===
    "VERSION" /* VERSION */
  );
}

const name$o = "@firebase/app";
const version$1$1 = "0.7.30";

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const logger = new Logger("@firebase/app");

const name$n = "@firebase/app-compat";

const name$m = "@firebase/analytics-compat";

const name$l = "@firebase/analytics";

const name$k = "@firebase/app-check-compat";

const name$j = "@firebase/app-check";

const name$i = "@firebase/auth";

const name$h = "@firebase/auth-compat";

const name$g = "@firebase/database";

const name$f = "@firebase/database-compat";

const name$e = "@firebase/functions";

const name$d = "@firebase/functions-compat";

const name$c = "@firebase/installations";

const name$b = "@firebase/installations-compat";

const name$a = "@firebase/messaging";

const name$9 = "@firebase/messaging-compat";

const name$8 = "@firebase/performance";

const name$7 = "@firebase/performance-compat";

const name$6 = "@firebase/remote-config";

const name$5 = "@firebase/remote-config-compat";

const name$4 = "@firebase/storage";

const name$3 = "@firebase/storage-compat";

const name$2 = "@firebase/firestore";

const name$1$1 = "@firebase/firestore-compat";

const name$p = "firebase";
const version$2 = "9.9.2";

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * The default app name
 *
 * @internal
 */
const DEFAULT_ENTRY_NAME = "[DEFAULT]";
const PLATFORM_LOG_STRING = {
  [name$o]: "fire-core",
  [name$n]: "fire-core-compat",
  [name$l]: "fire-analytics",
  [name$m]: "fire-analytics-compat",
  [name$j]: "fire-app-check",
  [name$k]: "fire-app-check-compat",
  [name$i]: "fire-auth",
  [name$h]: "fire-auth-compat",
  [name$g]: "fire-rtdb",
  [name$f]: "fire-rtdb-compat",
  [name$e]: "fire-fn",
  [name$d]: "fire-fn-compat",
  [name$c]: "fire-iid",
  [name$b]: "fire-iid-compat",
  [name$a]: "fire-fcm",
  [name$9]: "fire-fcm-compat",
  [name$8]: "fire-perf",
  [name$7]: "fire-perf-compat",
  [name$6]: "fire-rc",
  [name$5]: "fire-rc-compat",
  [name$4]: "fire-gcs",
  [name$3]: "fire-gcs-compat",
  [name$2]: "fire-fst",
  [name$1$1]: "fire-fst-compat",
  "fire-js": "fire-js",
  [name$p]: "fire-js-all",
};

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @internal
 */
const _apps = new Map();
/**
 * Registered components.
 *
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _components = new Map();
/**
 * @param component - the component being added to this app's container
 *
 * @internal
 */
function _addComponent(app, component) {
  try {
    app.container.addComponent(component);
  } catch (e) {
    logger.debug(
      `Component ${component.name} failed to register with FirebaseApp ${app.name}`,
      e
    );
  }
}
/**
 *
 * @param component - the component to register
 * @returns whether or not the component is registered successfully
 *
 * @internal
 */
function _registerComponent(component) {
  const componentName = component.name;
  if (_components.has(componentName)) {
    logger.debug(
      `There were multiple attempts to register component ${componentName}.`
    );
    return false;
  }
  _components.set(componentName, component);
  // add the component to existing app instances
  for (const app of _apps.values()) {
    _addComponent(app, component);
  }
  return true;
}
/**
 *
 * @param app - FirebaseApp instance
 * @param name - service name
 *
 * @returns the provider for the service with the matching name
 *
 * @internal
 */
function _getProvider(app, name) {
  const heartbeatController = app.container
    .getProvider("heartbeat")
    .getImmediate({ optional: true });
  if (heartbeatController) {
    void heartbeatController.triggerHeartbeat();
  }
  return app.container.getProvider(name);
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const ERRORS = {
  ["no-app" /* NO_APP */]:
    "No Firebase App '{$appName}' has been created - " +
    "call Firebase App.initializeApp()",
  ["bad-app-name" /* BAD_APP_NAME */]: "Illegal App name: '{$appName}",
  ["duplicate-app" /* DUPLICATE_APP */]:
    "Firebase App named '{$appName}' already exists with different options or config",
  ["app-deleted" /* APP_DELETED */]:
    "Firebase App named '{$appName}' already deleted",
  ["invalid-app-argument" /* INVALID_APP_ARGUMENT */]:
    "firebase.{$appName}() takes either no argument or a " +
    "Firebase App instance.",
  ["invalid-log-argument" /* INVALID_LOG_ARGUMENT */]:
    "First argument to `onLog` must be null or a function.",
  ["idb-open" /* IDB_OPEN */]:
    "Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.",
  ["idb-get" /* IDB_GET */]:
    "Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.",
  ["idb-set" /* IDB_WRITE */]:
    "Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.",
  ["idb-delete" /* IDB_DELETE */]:
    "Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.",
};
const ERROR_FACTORY$2 = new ErrorFactory("app", "Firebase", ERRORS);

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * The current SDK version.
 *
 * @public
 */
const SDK_VERSION = version$2;
/**
 * Retrieves a {@link @firebase/app#FirebaseApp} instance.
 *
 * When called with no arguments, the default app is returned. When an app name
 * is provided, the app corresponding to that name is returned.
 *
 * An exception is thrown if the app being retrieved has not yet been
 * initialized.
 *
 * @example
 * ```javascript
 * // Return the default app
 * const app = getApp();
 * ```
 *
 * @example
 * ```javascript
 * // Return a named app
 * const otherApp = getApp("otherApp");
 * ```
 *
 * @param name - Optional name of the app to return. If no name is
 *   provided, the default is `"[DEFAULT]"`.
 *
 * @returns The app corresponding to the provided app name.
 *   If no app name is provided, the default app is returned.
 *
 * @public
 */
function getApp(name = DEFAULT_ENTRY_NAME) {
  const app = _apps.get(name);
  if (!app) {
    throw ERROR_FACTORY$2.create("no-app" /* NO_APP */, { appName: name });
  }
  return app;
}
/**
 * Registers a library's name and version for platform logging purposes.
 * @param library - Name of 1p or 3p library (e.g. firestore, angularfire)
 * @param version - Current version of that library.
 * @param variant - Bundle variant, e.g., node, rn, etc.
 *
 * @public
 */
function registerVersion(libraryKeyOrName, version, variant) {
  var _a;
  // TODO: We can use this check to whitelist strings when/if we set up
  // a good whitelist system.
  let library =
    (_a = PLATFORM_LOG_STRING[libraryKeyOrName]) !== null && _a !== void 0
      ? _a
      : libraryKeyOrName;
  if (variant) {
    library += `-${variant}`;
  }
  const libraryMismatch = library.match(/\s|\//);
  const versionMismatch = version.match(/\s|\//);
  if (libraryMismatch || versionMismatch) {
    const warning = [
      `Unable to register library "${library}" with version "${version}":`,
    ];
    if (libraryMismatch) {
      warning.push(
        `library name "${library}" contains illegal characters (whitespace or "/")`
      );
    }
    if (libraryMismatch && versionMismatch) {
      warning.push("and");
    }
    if (versionMismatch) {
      warning.push(
        `version name "${version}" contains illegal characters (whitespace or "/")`
      );
    }
    logger.warn(warning.join(" "));
    return;
  }
  _registerComponent(
    new Component(
      `${library}-version`,
      () => ({ library, version }),
      "VERSION" /* VERSION */
    )
  );
}

/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const DB_NAME$1 = "firebase-heartbeat-database";
const DB_VERSION$1 = 1;
const STORE_NAME = "firebase-heartbeat-store";
let dbPromise$1 = null;
function getDbPromise$1() {
  if (!dbPromise$1) {
    dbPromise$1 = openDB(DB_NAME$1, DB_VERSION$1, {
      upgrade: (db, oldVersion) => {
        // We don't use 'break' in this switch statement, the fall-through
        // behavior is what we want, because if there are multiple versions between
        // the old version and the current version, we want ALL the migrations
        // that correspond to those versions to run, not only the last one.
        // eslint-disable-next-line default-case
        switch (oldVersion) {
          case 0:
            db.createObjectStore(STORE_NAME);
        }
      },
    }).catch((e) => {
      throw ERROR_FACTORY$2.create("idb-open" /* IDB_OPEN */, {
        originalErrorMessage: e.message,
      });
    });
  }
  return dbPromise$1;
}
async function readHeartbeatsFromIndexedDB(app) {
  var _a;
  try {
    const db = await getDbPromise$1();
    return db
      .transaction(STORE_NAME)
      .objectStore(STORE_NAME)
      .get(computeKey(app));
  } catch (e) {
    if (e instanceof FirebaseError) {
      logger.warn(e.message);
    } else {
      const idbGetError = ERROR_FACTORY$2.create("idb-get" /* IDB_GET */, {
        originalErrorMessage:
          (_a = e) === null || _a === void 0 ? void 0 : _a.message,
      });
      logger.warn(idbGetError.message);
    }
  }
}
async function writeHeartbeatsToIndexedDB(app, heartbeatObject) {
  var _a;
  try {
    const db = await getDbPromise$1();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const objectStore = tx.objectStore(STORE_NAME);
    await objectStore.put(heartbeatObject, computeKey(app));
    return tx.done;
  } catch (e) {
    if (e instanceof FirebaseError) {
      logger.warn(e.message);
    } else {
      const idbGetError = ERROR_FACTORY$2.create("idb-set" /* IDB_WRITE */, {
        originalErrorMessage:
          (_a = e) === null || _a === void 0 ? void 0 : _a.message,
      });
      logger.warn(idbGetError.message);
    }
  }
}
function computeKey(app) {
  return `${app.name}!${app.options.appId}`;
}

/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const MAX_HEADER_BYTES = 1024;
// 30 days
const STORED_HEARTBEAT_RETENTION_MAX_MILLIS = 30 * 24 * 60 * 60 * 1000;
class HeartbeatServiceImpl {
  constructor(container) {
    this.container = container;
    /**
     * In-memory cache for heartbeats, used by getHeartbeatsHeader() to generate
     * the header string.
     * Stores one record per date. This will be consolidated into the standard
     * format of one record per user agent string before being sent as a header.
     * Populated from indexedDB when the controller is instantiated and should
     * be kept in sync with indexedDB.
     * Leave public for easier testing.
     */
    this._heartbeatsCache = null;
    const app = this.container.getProvider("app").getImmediate();
    this._storage = new HeartbeatStorageImpl(app);
    this._heartbeatsCachePromise = this._storage.read().then((result) => {
      this._heartbeatsCache = result;
      return result;
    });
  }
  /**
   * Called to report a heartbeat. The function will generate
   * a HeartbeatsByUserAgent object, update heartbeatsCache, and persist it
   * to IndexedDB.
   * Note that we only store one heartbeat per day. So if a heartbeat for today is
   * already logged, subsequent calls to this function in the same day will be ignored.
   */
  async triggerHeartbeat() {
    const platformLogger = this.container
      .getProvider("platform-logger")
      .getImmediate();
    // This is the "Firebase user agent" string from the platform logger
    // service, not the browser user agent.
    const agent = platformLogger.getPlatformInfoString();
    const date = getUTCDateString();
    if (this._heartbeatsCache === null) {
      this._heartbeatsCache = await this._heartbeatsCachePromise;
    }
    // Do not store a heartbeat if one is already stored for this day
    // or if a header has already been sent today.
    if (
      this._heartbeatsCache.lastSentHeartbeatDate === date ||
      this._heartbeatsCache.heartbeats.some(
        (singleDateHeartbeat) => singleDateHeartbeat.date === date
      )
    ) {
      return;
    } else {
      // There is no entry for this date. Create one.
      this._heartbeatsCache.heartbeats.push({ date, agent });
    }
    // Remove entries older than 30 days.
    this._heartbeatsCache.heartbeats = this._heartbeatsCache.heartbeats.filter(
      (singleDateHeartbeat) => {
        const hbTimestamp = new Date(singleDateHeartbeat.date).valueOf();
        const now = Date.now();
        return now - hbTimestamp <= STORED_HEARTBEAT_RETENTION_MAX_MILLIS;
      }
    );
    return this._storage.overwrite(this._heartbeatsCache);
  }
  /**
   * Returns a base64 encoded string which can be attached to the heartbeat-specific header directly.
   * It also clears all heartbeats from memory as well as in IndexedDB.
   *
   * NOTE: Consuming product SDKs should not send the header if this method
   * returns an empty string.
   */
  async getHeartbeatsHeader() {
    if (this._heartbeatsCache === null) {
      await this._heartbeatsCachePromise;
    }
    // If it's still null or the array is empty, there is no data to send.
    if (
      this._heartbeatsCache === null ||
      this._heartbeatsCache.heartbeats.length === 0
    ) {
      return "";
    }
    const date = getUTCDateString();
    // Extract as many heartbeats from the cache as will fit under the size limit.
    const { heartbeatsToSend, unsentEntries } = extractHeartbeatsForHeader(
      this._heartbeatsCache.heartbeats
    );
    const headerString = base64urlEncodeWithoutPadding(
      JSON.stringify({ version: 2, heartbeats: heartbeatsToSend })
    );
    // Store last sent date to prevent another being logged/sent for the same day.
    this._heartbeatsCache.lastSentHeartbeatDate = date;
    if (unsentEntries.length > 0) {
      // Store any unsent entries if they exist.
      this._heartbeatsCache.heartbeats = unsentEntries;
      // This seems more likely than emptying the array (below) to lead to some odd state
      // since the cache isn't empty and this will be called again on the next request,
      // and is probably safest if we await it.
      await this._storage.overwrite(this._heartbeatsCache);
    } else {
      this._heartbeatsCache.heartbeats = [];
      // Do not wait for this, to reduce latency.
      void this._storage.overwrite(this._heartbeatsCache);
    }
    return headerString;
  }
}
function getUTCDateString() {
  const today = new Date();
  // Returns date format 'YYYY-MM-DD'
  return today.toISOString().substring(0, 10);
}
function extractHeartbeatsForHeader(
  heartbeatsCache,
  maxSize = MAX_HEADER_BYTES
) {
  // Heartbeats grouped by user agent in the standard format to be sent in
  // the header.
  const heartbeatsToSend = [];
  // Single date format heartbeats that are not sent.
  let unsentEntries = heartbeatsCache.slice();
  for (const singleDateHeartbeat of heartbeatsCache) {
    // Look for an existing entry with the same user agent.
    const heartbeatEntry = heartbeatsToSend.find(
      (hb) => hb.agent === singleDateHeartbeat.agent
    );
    if (!heartbeatEntry) {
      // If no entry for this user agent exists, create one.
      heartbeatsToSend.push({
        agent: singleDateHeartbeat.agent,
        dates: [singleDateHeartbeat.date],
      });
      if (countBytes(heartbeatsToSend) > maxSize) {
        // If the header would exceed max size, remove the added heartbeat
        // entry and stop adding to the header.
        heartbeatsToSend.pop();
        break;
      }
    } else {
      heartbeatEntry.dates.push(singleDateHeartbeat.date);
      // If the header would exceed max size, remove the added date
      // and stop adding to the header.
      if (countBytes(heartbeatsToSend) > maxSize) {
        heartbeatEntry.dates.pop();
        break;
      }
    }
    // Pop unsent entry from queue. (Skipped if adding the entry exceeded
    // quota and the loop breaks early.)
    unsentEntries = unsentEntries.slice(1);
  }
  return {
    heartbeatsToSend,
    unsentEntries,
  };
}
class HeartbeatStorageImpl {
  constructor(app) {
    this.app = app;
    this._canUseIndexedDBPromise = this.runIndexedDBEnvironmentCheck();
  }
  async runIndexedDBEnvironmentCheck() {
    if (!isIndexedDBAvailable()) {
      return false;
    } else {
      return validateIndexedDBOpenable()
        .then(() => true)
        .catch(() => false);
    }
  }
  /**
   * Read all heartbeats.
   */
  async read() {
    const canUseIndexedDB = await this._canUseIndexedDBPromise;
    if (!canUseIndexedDB) {
      return { heartbeats: [] };
    } else {
      const idbHeartbeatObject = await readHeartbeatsFromIndexedDB(this.app);
      return idbHeartbeatObject || { heartbeats: [] };
    }
  }
  // overwrite the storage with the provided heartbeats
  async overwrite(heartbeatsObject) {
    var _a;
    const canUseIndexedDB = await this._canUseIndexedDBPromise;
    if (!canUseIndexedDB) {
      return;
    } else {
      const existingHeartbeatsObject = await this.read();
      return writeHeartbeatsToIndexedDB(this.app, {
        lastSentHeartbeatDate:
          (_a = heartbeatsObject.lastSentHeartbeatDate) !== null &&
          _a !== void 0
            ? _a
            : existingHeartbeatsObject.lastSentHeartbeatDate,
        heartbeats: heartbeatsObject.heartbeats,
      });
    }
  }
  // add heartbeats
  async add(heartbeatsObject) {
    var _a;
    const canUseIndexedDB = await this._canUseIndexedDBPromise;
    if (!canUseIndexedDB) {
      return;
    } else {
      const existingHeartbeatsObject = await this.read();
      return writeHeartbeatsToIndexedDB(this.app, {
        lastSentHeartbeatDate:
          (_a = heartbeatsObject.lastSentHeartbeatDate) !== null &&
          _a !== void 0
            ? _a
            : existingHeartbeatsObject.lastSentHeartbeatDate,
        heartbeats: [
          ...existingHeartbeatsObject.heartbeats,
          ...heartbeatsObject.heartbeats,
        ],
      });
    }
  }
}
/**
 * Calculate bytes of a HeartbeatsByUserAgent array after being wrapped
 * in a platform logging header JSON object, stringified, and converted
 * to base 64.
 */
function countBytes(heartbeatsCache) {
  // base64 has a restricted set of characters, all of which should be 1 byte.
  return base64urlEncodeWithoutPadding(
    // heartbeatsCache wrapper properties
    JSON.stringify({ version: 2, heartbeats: heartbeatsCache })
  ).length;
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function registerCoreComponents(variant) {
  _registerComponent(
    new Component(
      "platform-logger",
      (container) => new PlatformLoggerServiceImpl(container),
      "PRIVATE" /* PRIVATE */
    )
  );
  _registerComponent(
    new Component(
      "heartbeat",
      (container) => new HeartbeatServiceImpl(container),
      "PRIVATE" /* PRIVATE */
    )
  );
  // Register `app` package.
  registerVersion(name$o, version$1$1, variant);
  // BUILD_TARGET will be replaced by values like esm5, esm2017, cjs5, etc during the compilation
  registerVersion(name$o, version$1$1, "esm2017");
  // Register platform SDK identifier (no version).
  registerVersion("fire-js", "");
}

/**
 * Firebase App
 *
 * @remarks This package coordinates the communication between the different Firebase components
 * @packageDocumentation
 */
registerCoreComponents("");

const name$1 = "@firebase/installations";
const version$1 = "0.5.12";

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const PENDING_TIMEOUT_MS = 10000;
const PACKAGE_VERSION = `w:${version$1}`;
const INTERNAL_AUTH_VERSION = "FIS_v2";
const INSTALLATIONS_API_URL = "https://firebaseinstallations.googleapis.com/v1";
const TOKEN_EXPIRATION_BUFFER = 60 * 60 * 1000; // One hour
const SERVICE = "installations";
const SERVICE_NAME = "Installations";

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const ERROR_DESCRIPTION_MAP$1 = {
  ["missing-app-config-values" /* MISSING_APP_CONFIG_VALUES */]:
    'Missing App configuration value: "{$valueName}"',
  ["not-registered" /* NOT_REGISTERED */]:
    "Firebase Installation is not registered.",
  ["installation-not-found" /* INSTALLATION_NOT_FOUND */]:
    "Firebase Installation not found.",
  ["request-failed" /* REQUEST_FAILED */]:
    '{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',
  ["app-offline" /* APP_OFFLINE */]:
    "Could not process request. Application offline.",
  ["delete-pending-registration" /* DELETE_PENDING_REGISTRATION */]:
    "Can't delete installation while there is a pending registration request.",
};
const ERROR_FACTORY$1 = new ErrorFactory(
  SERVICE,
  SERVICE_NAME,
  ERROR_DESCRIPTION_MAP$1
);
/** Returns true if error is a FirebaseError that is based on an error from the server. */
function isServerError(error) {
  return (
    error instanceof FirebaseError &&
    error.code.includes("request-failed" /* REQUEST_FAILED */)
  );
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function getInstallationsEndpoint({ projectId }) {
  return `${INSTALLATIONS_API_URL}/projects/${projectId}/installations`;
}
function extractAuthTokenInfoFromResponse(response) {
  return {
    token: response.token,
    requestStatus: 2 /* COMPLETED */,
    expiresIn: getExpiresInFromResponseExpiresIn(response.expiresIn),
    creationTime: Date.now(),
  };
}
async function getErrorFromResponse(requestName, response) {
  const responseJson = await response.json();
  const errorData = responseJson.error;
  return ERROR_FACTORY$1.create("request-failed" /* REQUEST_FAILED */, {
    requestName,
    serverCode: errorData.code,
    serverMessage: errorData.message,
    serverStatus: errorData.status,
  });
}
function getHeaders({ apiKey }) {
  return new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-goog-api-key": apiKey,
  });
}
function getHeadersWithAuth(appConfig, { refreshToken }) {
  const headers = getHeaders(appConfig);
  headers.append("Authorization", getAuthorizationHeader(refreshToken));
  return headers;
}
/**
 * Calls the passed in fetch wrapper and returns the response.
 * If the returned response has a status of 5xx, re-runs the function once and
 * returns the response.
 */
async function retryIfServerError(fn) {
  const result = await fn();
  if (result.status >= 500 && result.status < 600) {
    // Internal Server Error. Retry request.
    return fn();
  }
  return result;
}
function getExpiresInFromResponseExpiresIn(responseExpiresIn) {
  // This works because the server will never respond with fractions of a second.
  return Number(responseExpiresIn.replace("s", "000"));
}
function getAuthorizationHeader(refreshToken) {
  return `${INTERNAL_AUTH_VERSION} ${refreshToken}`;
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
async function createInstallationRequest(
  { appConfig, heartbeatServiceProvider },
  { fid }
) {
  const endpoint = getInstallationsEndpoint(appConfig);
  const headers = getHeaders(appConfig);
  // If heartbeat service exists, add the heartbeat string to the header.
  const heartbeatService = heartbeatServiceProvider.getImmediate({
    optional: true,
  });
  if (heartbeatService) {
    const heartbeatsHeader = await heartbeatService.getHeartbeatsHeader();
    if (heartbeatsHeader) {
      headers.append("x-firebase-client", heartbeatsHeader);
    }
  }
  const body = {
    fid,
    authVersion: INTERNAL_AUTH_VERSION,
    appId: appConfig.appId,
    sdkVersion: PACKAGE_VERSION,
  };
  const request = {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  };
  const response = await retryIfServerError(() => fetch(endpoint, request));
  if (response.ok) {
    const responseValue = await response.json();
    const registeredInstallationEntry = {
      fid: responseValue.fid || fid,
      registrationStatus: 2 /* COMPLETED */,
      refreshToken: responseValue.refreshToken,
      authToken: extractAuthTokenInfoFromResponse(responseValue.authToken),
    };
    return registeredInstallationEntry;
  } else {
    throw await getErrorFromResponse("Create Installation", response);
  }
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/** Returns a promise that resolves after given time passes. */
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function bufferToBase64UrlSafe(array) {
  const b64 = btoa(String.fromCharCode(...array));
  return b64.replace(/\+/g, "-").replace(/\//g, "_");
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const VALID_FID_PATTERN = /^[cdef][\w-]{21}$/;
const INVALID_FID = "";
/**
 * Generates a new FID using random values from Web Crypto API.
 * Returns an empty string if FID generation fails for any reason.
 */
function generateFid() {
  try {
    // A valid FID has exactly 22 base64 characters, which is 132 bits, or 16.5
    // bytes. our implementation generates a 17 byte array instead.
    const fidByteArray = new Uint8Array(17);
    const crypto = self.crypto || self.msCrypto;
    crypto.getRandomValues(fidByteArray);
    // Replace the first 4 random bits with the constant FID header of 0b0111.
    fidByteArray[0] = 0b01110000 + (fidByteArray[0] % 0b00010000);
    const fid = encode(fidByteArray);
    return VALID_FID_PATTERN.test(fid) ? fid : INVALID_FID;
  } catch (_a) {
    // FID generation errored
    return INVALID_FID;
  }
}
/** Converts a FID Uint8Array to a base64 string representation. */
function encode(fidByteArray) {
  const b64String = bufferToBase64UrlSafe(fidByteArray);
  // Remove the 23rd character that was added because of the extra 4 bits at the
  // end of our 17 byte array, and the '=' padding.
  return b64String.substr(0, 22);
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/** Returns a string key that can be used to identify the app. */
function getKey(appConfig) {
  return `${appConfig.appName}!${appConfig.appId}`;
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const fidChangeCallbacks = new Map();
/**
 * Calls the onIdChange callbacks with the new FID value, and broadcasts the
 * change to other tabs.
 */
function fidChanged(appConfig, fid) {
  const key = getKey(appConfig);
  callFidChangeCallbacks(key, fid);
  broadcastFidChange(key, fid);
}
function callFidChangeCallbacks(key, fid) {
  const callbacks = fidChangeCallbacks.get(key);
  if (!callbacks) {
    return;
  }
  for (const callback of callbacks) {
    callback(fid);
  }
}
function broadcastFidChange(key, fid) {
  const channel = getBroadcastChannel();
  if (channel) {
    channel.postMessage({ key, fid });
  }
  closeBroadcastChannel();
}
let broadcastChannel = null;
/** Opens and returns a BroadcastChannel if it is supported by the browser. */
function getBroadcastChannel() {
  if (!broadcastChannel && "BroadcastChannel" in self) {
    broadcastChannel = new BroadcastChannel("[Firebase] FID Change");
    broadcastChannel.onmessage = (e) => {
      callFidChangeCallbacks(e.data.key, e.data.fid);
    };
  }
  return broadcastChannel;
}
function closeBroadcastChannel() {
  if (fidChangeCallbacks.size === 0 && broadcastChannel) {
    broadcastChannel.close();
    broadcastChannel = null;
  }
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const DATABASE_NAME = "firebase-installations-database";
const DATABASE_VERSION = 1;
const OBJECT_STORE_NAME = "firebase-installations-store";
let dbPromise = null;
function getDbPromise() {
  if (!dbPromise) {
    dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
      upgrade: (db, oldVersion) => {
        // We don't use 'break' in this switch statement, the fall-through
        // behavior is what we want, because if there are multiple versions between
        // the old version and the current version, we want ALL the migrations
        // that correspond to those versions to run, not only the last one.
        // eslint-disable-next-line default-case
        switch (oldVersion) {
          case 0:
            db.createObjectStore(OBJECT_STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}
/** Assigns or overwrites the record for the given key with the given value. */
async function set(appConfig, value) {
  const key = getKey(appConfig);
  const db = await getDbPromise();
  const tx = db.transaction(OBJECT_STORE_NAME, "readwrite");
  const objectStore = tx.objectStore(OBJECT_STORE_NAME);
  const oldValue = await objectStore.get(key);
  await objectStore.put(value, key);
  await tx.done;
  if (!oldValue || oldValue.fid !== value.fid) {
    fidChanged(appConfig, value.fid);
  }
  return value;
}
/** Removes record(s) from the objectStore that match the given key. */
async function remove(appConfig) {
  const key = getKey(appConfig);
  const db = await getDbPromise();
  const tx = db.transaction(OBJECT_STORE_NAME, "readwrite");
  await tx.objectStore(OBJECT_STORE_NAME).delete(key);
  await tx.done;
}
/**
 * Atomically updates a record with the result of updateFn, which gets
 * called with the current value. If newValue is undefined, the record is
 * deleted instead.
 * @return Updated value
 */
async function update(appConfig, updateFn) {
  const key = getKey(appConfig);
  const db = await getDbPromise();
  const tx = db.transaction(OBJECT_STORE_NAME, "readwrite");
  const store = tx.objectStore(OBJECT_STORE_NAME);
  const oldValue = await store.get(key);
  const newValue = updateFn(oldValue);
  if (newValue === undefined) {
    await store.delete(key);
  } else {
    await store.put(newValue, key);
  }
  await tx.done;
  if (newValue && (!oldValue || oldValue.fid !== newValue.fid)) {
    fidChanged(appConfig, newValue.fid);
  }
  return newValue;
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Updates and returns the InstallationEntry from the database.
 * Also triggers a registration request if it is necessary and possible.
 */
async function getInstallationEntry(installations) {
  let registrationPromise;
  const installationEntry = await update(
    installations.appConfig,
    (oldEntry) => {
      const installationEntry = updateOrCreateInstallationEntry(oldEntry);
      const entryWithPromise = triggerRegistrationIfNecessary(
        installations,
        installationEntry
      );
      registrationPromise = entryWithPromise.registrationPromise;
      return entryWithPromise.installationEntry;
    }
  );
  if (installationEntry.fid === INVALID_FID) {
    // FID generation failed. Waiting for the FID from the server.
    return { installationEntry: await registrationPromise };
  }
  return {
    installationEntry,
    registrationPromise,
  };
}
/**
 * Creates a new Installation Entry if one does not exist.
 * Also clears timed out pending requests.
 */
function updateOrCreateInstallationEntry(oldEntry) {
  const entry = oldEntry || {
    fid: generateFid(),
    registrationStatus: 0 /* NOT_STARTED */,
  };
  return clearTimedOutRequest(entry);
}
/**
 * If the Firebase Installation is not registered yet, this will trigger the
 * registration and return an InProgressInstallationEntry.
 *
 * If registrationPromise does not exist, the installationEntry is guaranteed
 * to be registered.
 */
function triggerRegistrationIfNecessary(installations, installationEntry) {
  if (installationEntry.registrationStatus === 0 /* NOT_STARTED */) {
    if (!navigator.onLine) {
      // Registration required but app is offline.
      const registrationPromiseWithError = Promise.reject(
        ERROR_FACTORY$1.create("app-offline" /* APP_OFFLINE */)
      );
      return {
        installationEntry,
        registrationPromise: registrationPromiseWithError,
      };
    }
    // Try registering. Change status to IN_PROGRESS.
    const inProgressEntry = {
      fid: installationEntry.fid,
      registrationStatus: 1 /* IN_PROGRESS */,
      registrationTime: Date.now(),
    };
    const registrationPromise = registerInstallation(
      installations,
      inProgressEntry
    );
    return { installationEntry: inProgressEntry, registrationPromise };
  } else if (installationEntry.registrationStatus === 1 /* IN_PROGRESS */) {
    return {
      installationEntry,
      registrationPromise: waitUntilFidRegistration(installations),
    };
  } else {
    return { installationEntry };
  }
}
/** This will be executed only once for each new Firebase Installation. */
async function registerInstallation(installations, installationEntry) {
  try {
    const registeredInstallationEntry = await createInstallationRequest(
      installations,
      installationEntry
    );
    return set(installations.appConfig, registeredInstallationEntry);
  } catch (e) {
    if (isServerError(e) && e.customData.serverCode === 409) {
      // Server returned a "FID can not be used" error.
      // Generate a new ID next time.
      await remove(installations.appConfig);
    } else {
      // Registration failed. Set FID as not registered.
      await set(installations.appConfig, {
        fid: installationEntry.fid,
        registrationStatus: 0 /* NOT_STARTED */,
      });
    }
    throw e;
  }
}
/** Call if FID registration is pending in another request. */
async function waitUntilFidRegistration(installations) {
  // Unfortunately, there is no way of reliably observing when a value in
  // IndexedDB changes (yet, see https://github.com/WICG/indexed-db-observers),
  // so we need to poll.
  let entry = await updateInstallationRequest(installations.appConfig);
  while (entry.registrationStatus === 1 /* IN_PROGRESS */) {
    // createInstallation request still in progress.
    await sleep(100);
    entry = await updateInstallationRequest(installations.appConfig);
  }
  if (entry.registrationStatus === 0 /* NOT_STARTED */) {
    // The request timed out or failed in a different call. Try again.
    const { installationEntry, registrationPromise } =
      await getInstallationEntry(installations);
    if (registrationPromise) {
      return registrationPromise;
    } else {
      // if there is no registrationPromise, entry is registered.
      return installationEntry;
    }
  }
  return entry;
}
/**
 * Called only if there is a CreateInstallation request in progress.
 *
 * Updates the InstallationEntry in the DB based on the status of the
 * CreateInstallation request.
 *
 * Returns the updated InstallationEntry.
 */
function updateInstallationRequest(appConfig) {
  return update(appConfig, (oldEntry) => {
    if (!oldEntry) {
      throw ERROR_FACTORY$1.create(
        "installation-not-found" /* INSTALLATION_NOT_FOUND */
      );
    }
    return clearTimedOutRequest(oldEntry);
  });
}
function clearTimedOutRequest(entry) {
  if (hasInstallationRequestTimedOut(entry)) {
    return {
      fid: entry.fid,
      registrationStatus: 0 /* NOT_STARTED */,
    };
  }
  return entry;
}
function hasInstallationRequestTimedOut(installationEntry) {
  return (
    installationEntry.registrationStatus === 1 /* IN_PROGRESS */ &&
    installationEntry.registrationTime + PENDING_TIMEOUT_MS < Date.now()
  );
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
async function generateAuthTokenRequest(
  { appConfig, heartbeatServiceProvider },
  installationEntry
) {
  const endpoint = getGenerateAuthTokenEndpoint(appConfig, installationEntry);
  const headers = getHeadersWithAuth(appConfig, installationEntry);
  // If heartbeat service exists, add the heartbeat string to the header.
  const heartbeatService = heartbeatServiceProvider.getImmediate({
    optional: true,
  });
  if (heartbeatService) {
    const heartbeatsHeader = await heartbeatService.getHeartbeatsHeader();
    if (heartbeatsHeader) {
      headers.append("x-firebase-client", heartbeatsHeader);
    }
  }
  const body = {
    installation: {
      sdkVersion: PACKAGE_VERSION,
      appId: appConfig.appId,
    },
  };
  const request = {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  };
  const response = await retryIfServerError(() => fetch(endpoint, request));
  if (response.ok) {
    const responseValue = await response.json();
    const completedAuthToken = extractAuthTokenInfoFromResponse(responseValue);
    return completedAuthToken;
  } else {
    throw await getErrorFromResponse("Generate Auth Token", response);
  }
}
function getGenerateAuthTokenEndpoint(appConfig, { fid }) {
  return `${getInstallationsEndpoint(appConfig)}/${fid}/authTokens:generate`;
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Returns a valid authentication token for the installation. Generates a new
 * token if one doesn't exist, is expired or about to expire.
 *
 * Should only be called if the Firebase Installation is registered.
 */
async function refreshAuthToken(installations, forceRefresh = false) {
  let tokenPromise;
  const entry = await update(installations.appConfig, (oldEntry) => {
    if (!isEntryRegistered(oldEntry)) {
      throw ERROR_FACTORY$1.create("not-registered" /* NOT_REGISTERED */);
    }
    const oldAuthToken = oldEntry.authToken;
    if (!forceRefresh && isAuthTokenValid(oldAuthToken)) {
      // There is a valid token in the DB.
      return oldEntry;
    } else if (oldAuthToken.requestStatus === 1 /* IN_PROGRESS */) {
      // There already is a token request in progress.
      tokenPromise = waitUntilAuthTokenRequest(installations, forceRefresh);
      return oldEntry;
    } else {
      // No token or token expired.
      if (!navigator.onLine) {
        throw ERROR_FACTORY$1.create("app-offline" /* APP_OFFLINE */);
      }
      const inProgressEntry = makeAuthTokenRequestInProgressEntry(oldEntry);
      tokenPromise = fetchAuthTokenFromServer(installations, inProgressEntry);
      return inProgressEntry;
    }
  });
  const authToken = tokenPromise ? await tokenPromise : entry.authToken;
  return authToken;
}
/**
 * Call only if FID is registered and Auth Token request is in progress.
 *
 * Waits until the current pending request finishes. If the request times out,
 * tries once in this thread as well.
 */
async function waitUntilAuthTokenRequest(installations, forceRefresh) {
  // Unfortunately, there is no way of reliably observing when a value in
  // IndexedDB changes (yet, see https://github.com/WICG/indexed-db-observers),
  // so we need to poll.
  let entry = await updateAuthTokenRequest(installations.appConfig);
  while (entry.authToken.requestStatus === 1 /* IN_PROGRESS */) {
    // generateAuthToken still in progress.
    await sleep(100);
    entry = await updateAuthTokenRequest(installations.appConfig);
  }
  const authToken = entry.authToken;
  if (authToken.requestStatus === 0 /* NOT_STARTED */) {
    // The request timed out or failed in a different call. Try again.
    return refreshAuthToken(installations, forceRefresh);
  } else {
    return authToken;
  }
}
/**
 * Called only if there is a GenerateAuthToken request in progress.
 *
 * Updates the InstallationEntry in the DB based on the status of the
 * GenerateAuthToken request.
 *
 * Returns the updated InstallationEntry.
 */
function updateAuthTokenRequest(appConfig) {
  return update(appConfig, (oldEntry) => {
    if (!isEntryRegistered(oldEntry)) {
      throw ERROR_FACTORY$1.create("not-registered" /* NOT_REGISTERED */);
    }
    const oldAuthToken = oldEntry.authToken;
    if (hasAuthTokenRequestTimedOut(oldAuthToken)) {
      return Object.assign(Object.assign({}, oldEntry), {
        authToken: { requestStatus: 0 /* NOT_STARTED */ },
      });
    }
    return oldEntry;
  });
}
async function fetchAuthTokenFromServer(installations, installationEntry) {
  try {
    const authToken = await generateAuthTokenRequest(
      installations,
      installationEntry
    );
    const updatedInstallationEntry = Object.assign(
      Object.assign({}, installationEntry),
      { authToken }
    );
    await set(installations.appConfig, updatedInstallationEntry);
    return authToken;
  } catch (e) {
    if (
      isServerError(e) &&
      (e.customData.serverCode === 401 || e.customData.serverCode === 404)
    ) {
      // Server returned a "FID not found" or a "Invalid authentication" error.
      // Generate a new ID next time.
      await remove(installations.appConfig);
    } else {
      const updatedInstallationEntry = Object.assign(
        Object.assign({}, installationEntry),
        { authToken: { requestStatus: 0 /* NOT_STARTED */ } }
      );
      await set(installations.appConfig, updatedInstallationEntry);
    }
    throw e;
  }
}
function isEntryRegistered(installationEntry) {
  return (
    installationEntry !== undefined &&
    installationEntry.registrationStatus === 2 /* COMPLETED */
  );
}
function isAuthTokenValid(authToken) {
  return (
    authToken.requestStatus === 2 /* COMPLETED */ &&
    !isAuthTokenExpired(authToken)
  );
}
function isAuthTokenExpired(authToken) {
  const now = Date.now();
  return (
    now < authToken.creationTime ||
    authToken.creationTime + authToken.expiresIn < now + TOKEN_EXPIRATION_BUFFER
  );
}
/** Returns an updated InstallationEntry with an InProgressAuthToken. */
function makeAuthTokenRequestInProgressEntry(oldEntry) {
  const inProgressAuthToken = {
    requestStatus: 1 /* IN_PROGRESS */,
    requestTime: Date.now(),
  };
  return Object.assign(Object.assign({}, oldEntry), {
    authToken: inProgressAuthToken,
  });
}
function hasAuthTokenRequestTimedOut(authToken) {
  return (
    authToken.requestStatus === 1 /* IN_PROGRESS */ &&
    authToken.requestTime + PENDING_TIMEOUT_MS < Date.now()
  );
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Creates a Firebase Installation if there isn't one for the app and
 * returns the Installation ID.
 * @param installations - The `Installations` instance.
 *
 * @public
 */
async function getId(installations) {
  const installationsImpl = installations;
  const { installationEntry, registrationPromise } = await getInstallationEntry(
    installationsImpl
  );
  if (registrationPromise) {
    registrationPromise.catch(console.error);
  } else {
    // If the installation is already registered, update the authentication
    // token if needed.
    refreshAuthToken(installationsImpl).catch(console.error);
  }
  return installationEntry.fid;
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Returns a Firebase Installations auth token, identifying the current
 * Firebase Installation.
 * @param installations - The `Installations` instance.
 * @param forceRefresh - Force refresh regardless of token expiration.
 *
 * @public
 */
async function getToken(installations, forceRefresh = false) {
  const installationsImpl = installations;
  await completeInstallationRegistration(installationsImpl);
  // At this point we either have a Registered Installation in the DB, or we've
  // already thrown an error.
  const authToken = await refreshAuthToken(installationsImpl, forceRefresh);
  return authToken.token;
}
async function completeInstallationRegistration(installations) {
  const { registrationPromise } = await getInstallationEntry(installations);
  if (registrationPromise) {
    // A createInstallation request is in progress. Wait until it finishes.
    await registrationPromise;
  }
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function extractAppConfig(app) {
  if (!app || !app.options) {
    throw getMissingValueError("App Configuration");
  }
  if (!app.name) {
    throw getMissingValueError("App Name");
  }
  // Required app config keys
  const configKeys = ["projectId", "apiKey", "appId"];
  for (const keyName of configKeys) {
    if (!app.options[keyName]) {
      throw getMissingValueError(keyName);
    }
  }
  return {
    appName: app.name,
    projectId: app.options.projectId,
    apiKey: app.options.apiKey,
    appId: app.options.appId,
  };
}
function getMissingValueError(valueName) {
  return ERROR_FACTORY$1.create(
    "missing-app-config-values" /* MISSING_APP_CONFIG_VALUES */,
    {
      valueName,
    }
  );
}

/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const INSTALLATIONS_NAME = "installations";
const INSTALLATIONS_NAME_INTERNAL = "installations-internal";
const publicFactory = (container) => {
  const app = container.getProvider("app").getImmediate();
  // Throws if app isn't configured properly.
  const appConfig = extractAppConfig(app);
  const heartbeatServiceProvider = _getProvider(app, "heartbeat");
  const installationsImpl = {
    app,
    appConfig,
    heartbeatServiceProvider,
    _delete: () => Promise.resolve(),
  };
  return installationsImpl;
};
const internalFactory = (container) => {
  const app = container.getProvider("app").getImmediate();
  // Internal FIS instance relies on public FIS instance.
  const installations = _getProvider(app, INSTALLATIONS_NAME).getImmediate();
  const installationsInternal = {
    getId: () => getId(installations),
    getToken: (forceRefresh) => getToken(installations, forceRefresh),
  };
  return installationsInternal;
};
function registerInstallations() {
  _registerComponent(
    new Component(INSTALLATIONS_NAME, publicFactory, "PUBLIC" /* PUBLIC */)
  );
  _registerComponent(
    new Component(
      INSTALLATIONS_NAME_INTERNAL,
      internalFactory,
      "PRIVATE" /* PRIVATE */
    )
  );
}

/**
 * Firebase Installations
 *
 * @packageDocumentation
 */
registerInstallations();
registerVersion(name$1, version$1);
// BUILD_TARGET will be replaced by values like esm5, esm2017, cjs5, etc during the compilation
registerVersion(name$1, version$1, "esm2017");

const name = "@firebase/remote-config";
const version = "0.3.11";

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Shims a minimal AbortSignal.
 *
 * <p>AbortController's AbortSignal conveniently decouples fetch timeout logic from other aspects
 * of networking, such as retries. Firebase doesn't use AbortController enough to justify a
 * polyfill recommendation, like we do with the Fetch API, but this minimal shim can easily be
 * swapped out if/when we do.
 */
class RemoteConfigAbortSignal {
  constructor() {
    this.listeners = [];
  }
  addEventListener(listener) {
    this.listeners.push(listener);
  }
  abort() {
    this.listeners.forEach((listener) => listener());
  }
}

/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const RC_COMPONENT_NAME = "remote-config";

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const ERROR_DESCRIPTION_MAP = {
  ["registration-window" /* REGISTRATION_WINDOW */]:
    "Undefined window object. This SDK only supports usage in a browser environment.",
  ["registration-project-id" /* REGISTRATION_PROJECT_ID */]:
    "Undefined project identifier. Check Firebase app initialization.",
  ["registration-api-key" /* REGISTRATION_API_KEY */]:
    "Undefined API key. Check Firebase app initialization.",
  ["registration-app-id" /* REGISTRATION_APP_ID */]:
    "Undefined app identifier. Check Firebase app initialization.",
  ["storage-open" /* STORAGE_OPEN */]:
    "Error thrown when opening storage. Original error: {$originalErrorMessage}.",
  ["storage-get" /* STORAGE_GET */]:
    "Error thrown when reading from storage. Original error: {$originalErrorMessage}.",
  ["storage-set" /* STORAGE_SET */]:
    "Error thrown when writing to storage. Original error: {$originalErrorMessage}.",
  ["storage-delete" /* STORAGE_DELETE */]:
    "Error thrown when deleting from storage. Original error: {$originalErrorMessage}.",
  ["fetch-client-network" /* FETCH_NETWORK */]:
    "Fetch client failed to connect to a network. Check Internet connection." +
    " Original error: {$originalErrorMessage}.",
  ["fetch-timeout" /* FETCH_TIMEOUT */]:
    "The config fetch request timed out. " +
    ' Configure timeout using "fetchTimeoutMillis" SDK setting.',
  ["fetch-throttle" /* FETCH_THROTTLE */]:
    "The config fetch request timed out while in an exponential backoff state." +
    ' Configure timeout using "fetchTimeoutMillis" SDK setting.' +
    " Unix timestamp in milliseconds when fetch request throttling ends: {$throttleEndTimeMillis}.",
  ["fetch-client-parse" /* FETCH_PARSE */]:
    "Fetch client could not parse response." +
    " Original error: {$originalErrorMessage}.",
  ["fetch-status" /* FETCH_STATUS */]:
    "Fetch server returned an HTTP error status. HTTP status: {$httpStatus}.",
  ["indexed-db-unavailable" /* INDEXED_DB_UNAVAILABLE */]:
    "Indexed DB is not supported by current browser",
};
const ERROR_FACTORY = new ErrorFactory(
  "remoteconfig" /* service */,
  "Remote Config" /* service name */,
  ERROR_DESCRIPTION_MAP
);
// Note how this is like typeof/instanceof, but for ErrorCode.
function hasErrorCode(e, errorCode) {
  return e instanceof FirebaseError && e.code.indexOf(errorCode) !== -1;
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const DEFAULT_VALUE_FOR_BOOLEAN = false;
const DEFAULT_VALUE_FOR_STRING = "";
const DEFAULT_VALUE_FOR_NUMBER = 0;
const BOOLEAN_TRUTHY_VALUES = ["1", "true", "t", "yes", "y", "on"];
class Value {
  constructor(_source, _value = DEFAULT_VALUE_FOR_STRING) {
    this._source = _source;
    this._value = _value;
  }
  asString() {
    return this._value;
  }
  asBoolean() {
    if (this._source === "static") {
      return DEFAULT_VALUE_FOR_BOOLEAN;
    }
    return BOOLEAN_TRUTHY_VALUES.indexOf(this._value.toLowerCase()) >= 0;
  }
  asNumber() {
    if (this._source === "static") {
      return DEFAULT_VALUE_FOR_NUMBER;
    }
    let num = Number(this._value);
    if (isNaN(num)) {
      num = DEFAULT_VALUE_FOR_NUMBER;
    }
    return num;
  }
  getSource() {
    return this._source;
  }
}

/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 *
 * @param app - The {@link @firebase/app#FirebaseApp} instance.
 * @returns A {@link RemoteConfig} instance.
 *
 * @public
 */
function getRemoteConfig(app = getApp()) {
  app = getModularInstance(app);
  const rcProvider = _getProvider(app, RC_COMPONENT_NAME);
  return rcProvider.getImmediate();
}
/**
 * Makes the last fetched config available to the getters.
 * @param remoteConfig - The {@link RemoteConfig} instance.
 * @returns A `Promise` which resolves to true if the current call activated the fetched configs.
 * If the fetched configs were already activated, the `Promise` will resolve to false.
 *
 * @public
 */
async function activate(remoteConfig) {
  const rc = getModularInstance(remoteConfig);
  const [lastSuccessfulFetchResponse, activeConfigEtag] = await Promise.all([
    rc._storage.getLastSuccessfulFetchResponse(),
    rc._storage.getActiveConfigEtag(),
  ]);
  if (
    !lastSuccessfulFetchResponse ||
    !lastSuccessfulFetchResponse.config ||
    !lastSuccessfulFetchResponse.eTag ||
    lastSuccessfulFetchResponse.eTag === activeConfigEtag
  ) {
    // Either there is no successful fetched config, or is the same as current active
    // config.
    return false;
  }
  await Promise.all([
    rc._storageCache.setActiveConfig(lastSuccessfulFetchResponse.config),
    rc._storage.setActiveConfigEtag(lastSuccessfulFetchResponse.eTag),
  ]);
  return true;
}
/**
 * Ensures the last activated config are available to the getters.
 * @param remoteConfig - The {@link RemoteConfig} instance.
 *
 * @returns A `Promise` that resolves when the last activated config is available to the getters.
 * @public
 */
function ensureInitialized(remoteConfig) {
  const rc = getModularInstance(remoteConfig);
  if (!rc._initializePromise) {
    rc._initializePromise = rc._storageCache.loadFromStorage().then(() => {
      rc._isInitializationComplete = true;
    });
  }
  return rc._initializePromise;
}
/**
 * Fetches and caches configuration from the Remote Config service.
 * @param remoteConfig - The {@link RemoteConfig} instance.
 * @public
 */
async function fetchConfig(remoteConfig) {
  const rc = getModularInstance(remoteConfig);
  // Aborts the request after the given timeout, causing the fetch call to
  // reject with an `AbortError`.
  //
  // <p>Aborting after the request completes is a no-op, so we don't need a
  // corresponding `clearTimeout`.
  //
  // Locating abort logic here because:
  // * it uses a developer setting (timeout)
  // * it applies to all retries (like curl's max-time arg)
  // * it is consistent with the Fetch API's signal input
  const abortSignal = new RemoteConfigAbortSignal();
  setTimeout(async () => {
    // Note a very low delay, eg < 10ms, can elapse before listeners are initialized.
    abortSignal.abort();
  }, rc.settings.fetchTimeoutMillis);
  // Catches *all* errors thrown by client so status can be set consistently.
  try {
    await rc._client.fetch({
      cacheMaxAgeMillis: rc.settings.minimumFetchIntervalMillis,
      signal: abortSignal,
    });
    await rc._storageCache.setLastFetchStatus("success");
  } catch (e) {
    const lastFetchStatus = hasErrorCode(
      e,
      "fetch-throttle" /* FETCH_THROTTLE */
    )
      ? "throttle"
      : "failure";
    await rc._storageCache.setLastFetchStatus(lastFetchStatus);
    throw e;
  }
}
/**
 * Gets the {@link Value} for the given key.
 *
 * @param remoteConfig - The {@link RemoteConfig} instance.
 * @param key - The name of the parameter.
 *
 * @returns The value for the given key.
 *
 * @public
 */
function getValue(remoteConfig, key) {
  const rc = getModularInstance(remoteConfig);
  if (!rc._isInitializationComplete) {
    rc._logger.debug(
      `A value was requested for key "${key}" before SDK initialization completed.` +
        " Await on ensureInitialized if the intent was to get a previously activated value."
    );
  }
  const activeConfig = rc._storageCache.getActiveConfig();
  if (activeConfig && activeConfig[key] !== undefined) {
    return new Value("remote", activeConfig[key]);
  } else if (rc.defaultConfig && rc.defaultConfig[key] !== undefined) {
    return new Value("default", String(rc.defaultConfig[key]));
  }
  rc._logger.debug(
    `Returning static value for key "${key}".` +
      " Define a default or remote value if this is unintentional."
  );
  return new Value("static");
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Implements the {@link RemoteConfigClient} abstraction with success response caching.
 *
 * <p>Comparable to the browser's Cache API for responses, but the Cache API requires a Service
 * Worker, which requires HTTPS, which would significantly complicate SDK installation. Also, the
 * Cache API doesn't support matching entries by time.
 */
class CachingClient {
  constructor(client, storage, storageCache, logger) {
    this.client = client;
    this.storage = storage;
    this.storageCache = storageCache;
    this.logger = logger;
  }
  /**
   * Returns true if the age of the cached fetched configs is less than or equal to
   * {@link Settings#minimumFetchIntervalInSeconds}.
   *
   * <p>This is comparable to passing `headers = { 'Cache-Control': max-age <maxAge> }` to the
   * native Fetch API.
   *
   * <p>Visible for testing.
   */
  isCachedDataFresh(cacheMaxAgeMillis, lastSuccessfulFetchTimestampMillis) {
    // Cache can only be fresh if it's populated.
    if (!lastSuccessfulFetchTimestampMillis) {
      this.logger.debug("Config fetch cache check. Cache unpopulated.");
      return false;
    }
    // Calculates age of cache entry.
    const cacheAgeMillis = Date.now() - lastSuccessfulFetchTimestampMillis;
    const isCachedDataFresh = cacheAgeMillis <= cacheMaxAgeMillis;
    this.logger.debug(
      "Config fetch cache check." +
        ` Cache age millis: ${cacheAgeMillis}.` +
        ` Cache max age millis (minimumFetchIntervalMillis setting): ${cacheMaxAgeMillis}.` +
        ` Is cache hit: ${isCachedDataFresh}.`
    );
    return isCachedDataFresh;
  }
  async fetch(request) {
    // Reads from persisted storage to avoid cache miss if callers don't wait on initialization.
    const [lastSuccessfulFetchTimestampMillis, lastSuccessfulFetchResponse] =
      await Promise.all([
        this.storage.getLastSuccessfulFetchTimestampMillis(),
        this.storage.getLastSuccessfulFetchResponse(),
      ]);
    // Exits early on cache hit.
    if (
      lastSuccessfulFetchResponse &&
      this.isCachedDataFresh(
        request.cacheMaxAgeMillis,
        lastSuccessfulFetchTimestampMillis
      )
    ) {
      return lastSuccessfulFetchResponse;
    }
    // Deviates from pure decorator by not honoring a passed ETag since we don't have a public API
    // that allows the caller to pass an ETag.
    request.eTag =
      lastSuccessfulFetchResponse && lastSuccessfulFetchResponse.eTag;
    // Falls back to service on cache miss.
    const response = await this.client.fetch(request);
    // Fetch throws for non-success responses, so success is guaranteed here.
    const storageOperations = [
      // Uses write-through cache for consistency with synchronous public API.
      this.storageCache.setLastSuccessfulFetchTimestampMillis(Date.now()),
    ];
    if (response.status === 200) {
      // Caches response only if it has changed, ie non-304 responses.
      storageOperations.push(
        this.storage.setLastSuccessfulFetchResponse(response)
      );
    }
    await Promise.all(storageOperations);
    return response;
  }
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Attempts to get the most accurate browser language setting.
 *
 * <p>Adapted from getUserLanguage in packages/auth/src/utils.js for TypeScript.
 *
 * <p>Defers default language specification to server logic for consistency.
 *
 * @param navigatorLanguage Enables tests to override read-only {@link NavigatorLanguage}.
 */
function getUserLanguage(navigatorLanguage = navigator) {
  return (
    // Most reliable, but only supported in Chrome/Firefox.
    (navigatorLanguage.languages && navigatorLanguage.languages[0]) ||
    // Supported in most browsers, but returns the language of the browser
    // UI, not the language set in browser settings.
    navigatorLanguage.language
    // Polyfill otherwise.
  );
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Implements the Client abstraction for the Remote Config REST API.
 */
class RestClient {
  constructor(
    firebaseInstallations,
    sdkVersion,
    namespace,
    projectId,
    apiKey,
    appId
  ) {
    this.firebaseInstallations = firebaseInstallations;
    this.sdkVersion = sdkVersion;
    this.namespace = namespace;
    this.projectId = projectId;
    this.apiKey = apiKey;
    this.appId = appId;
  }
  /**
   * Fetches from the Remote Config REST API.
   *
   * @throws a {@link ErrorCode.FETCH_NETWORK} error if {@link GlobalFetch#fetch} can't
   * connect to the network.
   * @throws a {@link ErrorCode.FETCH_PARSE} error if {@link Response#json} can't parse the
   * fetch response.
   * @throws a {@link ErrorCode.FETCH_STATUS} error if the service returns an HTTP error status.
   */
  async fetch(request) {
    var _a, _b, _c;
    const [installationId, installationToken] = await Promise.all([
      this.firebaseInstallations.getId(),
      this.firebaseInstallations.getToken(),
    ]);
    const urlBase =
      window.FIREBASE_REMOTE_CONFIG_URL_BASE ||
      "https://firebaseremoteconfig.googleapis.com";
    const url = `${urlBase}/v1/projects/${this.projectId}/namespaces/${this.namespace}:fetch?key=${this.apiKey}`;
    const headers = {
      "Content-Type": "application/json",
      "Content-Encoding": "gzip",
      // Deviates from pure decorator by not passing max-age header since we don't currently have
      // service behavior using that header.
      "If-None-Match": request.eTag || "*",
    };
    const requestBody = {
      /* eslint-disable camelcase */
      sdk_version: this.sdkVersion,
      app_instance_id: installationId,
      app_instance_id_token: installationToken,
      app_id: this.appId,
      language_code: getUserLanguage(),
      /* eslint-enable camelcase */
    };
    const options = {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    };
    // This logic isn't REST-specific, but shimming abort logic isn't worth another decorator.
    const fetchPromise = fetch(url, options);
    const timeoutPromise = new Promise((_resolve, reject) => {
      // Maps async event listener to Promise API.
      request.signal.addEventListener(() => {
        // Emulates https://heycam.github.io/webidl/#aborterror
        const error = new Error("The operation was aborted.");
        error.name = "AbortError";
        reject(error);
      });
    });
    let response;
    try {
      await Promise.race([fetchPromise, timeoutPromise]);
      response = await fetchPromise;
    } catch (originalError) {
      let errorCode = "fetch-client-network"; /* FETCH_NETWORK */
      if (
        ((_a = originalError) === null || _a === void 0 ? void 0 : _a.name) ===
        "AbortError"
      ) {
        errorCode = "fetch-timeout" /* FETCH_TIMEOUT */;
      }
      throw ERROR_FACTORY.create(errorCode, {
        originalErrorMessage:
          (_b = originalError) === null || _b === void 0 ? void 0 : _b.message,
      });
    }
    let status = response.status;
    // Normalizes nullable header to optional.
    const responseEtag = response.headers.get("ETag") || undefined;
    let config;
    let state;
    // JSON parsing throws SyntaxError if the response body isn't a JSON string.
    // Requesting application/json and checking for a 200 ensures there's JSON data.
    if (response.status === 200) {
      let responseBody;
      try {
        responseBody = await response.json();
      } catch (originalError) {
        throw ERROR_FACTORY.create("fetch-client-parse" /* FETCH_PARSE */, {
          originalErrorMessage:
            (_c = originalError) === null || _c === void 0
              ? void 0
              : _c.message,
        });
      }
      config = responseBody["entries"];
      state = responseBody["state"];
    }
    // Normalizes based on legacy state.
    if (state === "INSTANCE_STATE_UNSPECIFIED") {
      status = 500;
    } else if (state === "NO_CHANGE") {
      status = 304;
    } else if (state === "NO_TEMPLATE" || state === "EMPTY_CONFIG") {
      // These cases can be fixed remotely, so normalize to safe value.
      config = {};
    }
    // Normalize to exception-based control flow for non-success cases.
    // Encapsulates HTTP specifics in this class as much as possible. Status is still the best for
    // differentiating success states (200 from 304; the state body param is undefined in a
    // standard 304).
    if (status !== 304 && status !== 200) {
      throw ERROR_FACTORY.create("fetch-status" /* FETCH_STATUS */, {
        httpStatus: status,
      });
    }
    return { status, eTag: responseEtag, config };
  }
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Supports waiting on a backoff by:
 *
 * <ul>
 *   <li>Promisifying setTimeout, so we can set a timeout in our Promise chain</li>
 *   <li>Listening on a signal bus for abort events, just like the Fetch API</li>
 *   <li>Failing in the same way the Fetch API fails, so timing out a live request and a throttled
 *       request appear the same.</li>
 * </ul>
 *
 * <p>Visible for testing.
 */
function setAbortableTimeout(signal, throttleEndTimeMillis) {
  return new Promise((resolve, reject) => {
    // Derives backoff from given end time, normalizing negative numbers to zero.
    const backoffMillis = Math.max(throttleEndTimeMillis - Date.now(), 0);
    const timeout = setTimeout(resolve, backoffMillis);
    // Adds listener, rather than sets onabort, because signal is a shared object.
    signal.addEventListener(() => {
      clearTimeout(timeout);
      // If the request completes before this timeout, the rejection has no effect.
      reject(
        ERROR_FACTORY.create("fetch-throttle" /* FETCH_THROTTLE */, {
          throttleEndTimeMillis,
        })
      );
    });
  });
}
/**
 * Returns true if the {@link Error} indicates a fetch request may succeed later.
 */
function isRetriableError(e) {
  if (!(e instanceof FirebaseError) || !e.customData) {
    return false;
  }
  // Uses string index defined by ErrorData, which FirebaseError implements.
  const httpStatus = Number(e.customData["httpStatus"]);
  return (
    httpStatus === 429 ||
    httpStatus === 500 ||
    httpStatus === 503 ||
    httpStatus === 504
  );
}
/**
 * Decorates a Client with retry logic.
 *
 * <p>Comparable to CachingClient, but uses backoff logic instead of cache max age and doesn't cache
 * responses (because the SDK has no use for error responses).
 */
class RetryingClient {
  constructor(client, storage) {
    this.client = client;
    this.storage = storage;
  }
  async fetch(request) {
    const throttleMetadata = (await this.storage.getThrottleMetadata()) || {
      backoffCount: 0,
      throttleEndTimeMillis: Date.now(),
    };
    return this.attemptFetch(request, throttleMetadata);
  }
  /**
   * A recursive helper for attempting a fetch request repeatedly.
   *
   * @throws any non-retriable errors.
   */
  async attemptFetch(request, { throttleEndTimeMillis, backoffCount }) {
    // Starts with a (potentially zero) timeout to support resumption from stored state.
    // Ensures the throttle end time is honored if the last attempt timed out.
    // Note the SDK will never make a request if the fetch timeout expires at this point.
    await setAbortableTimeout(request.signal, throttleEndTimeMillis);
    try {
      const response = await this.client.fetch(request);
      // Note the SDK only clears throttle state if response is success or non-retriable.
      await this.storage.deleteThrottleMetadata();
      return response;
    } catch (e) {
      if (!isRetriableError(e)) {
        throw e;
      }
      // Increments backoff state.
      const throttleMetadata = {
        throttleEndTimeMillis:
          Date.now() + calculateBackoffMillis(backoffCount),
        backoffCount: backoffCount + 1,
      };
      // Persists state.
      await this.storage.setThrottleMetadata(throttleMetadata);
      return this.attemptFetch(request, throttleMetadata);
    }
  }
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const DEFAULT_FETCH_TIMEOUT_MILLIS = 60 * 1000; // One minute
const DEFAULT_CACHE_MAX_AGE_MILLIS = 12 * 60 * 60 * 1000; // Twelve hours.
/**
 * Encapsulates business logic mapping network and storage dependencies to the public SDK API.
 *
 * See {@link https://github.com/FirebasePrivate/firebase-js-sdk/blob/master/packages/firebase/index.d.ts|interface documentation} for method descriptions.
 */
class RemoteConfig {
  constructor(
    // Required by FirebaseServiceFactory interface.
    app,
    // JS doesn't support private yet
    // (https://github.com/tc39/proposal-class-fields#private-fields), so we hint using an
    // underscore prefix.
    /**
     * @internal
     */
    _client,
    /**
     * @internal
     */
    _storageCache,
    /**
     * @internal
     */
    _storage,
    /**
     * @internal
     */
    _logger
  ) {
    this.app = app;
    this._client = _client;
    this._storageCache = _storageCache;
    this._storage = _storage;
    this._logger = _logger;
    /**
     * Tracks completion of initialization promise.
     * @internal
     */
    this._isInitializationComplete = false;
    this.settings = {
      fetchTimeoutMillis: DEFAULT_FETCH_TIMEOUT_MILLIS,
      minimumFetchIntervalMillis: DEFAULT_CACHE_MAX_AGE_MILLIS,
    };
    this.defaultConfig = {};
  }
  get fetchTimeMillis() {
    return this._storageCache.getLastSuccessfulFetchTimestampMillis() || -1;
  }
  get lastFetchStatus() {
    return this._storageCache.getLastFetchStatus() || "no-fetch-yet";
  }
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Converts an error event associated with a {@link IDBRequest} to a {@link FirebaseError}.
 */
function toFirebaseError(event, errorCode) {
  var _a;
  const originalError = event.target.error || undefined;
  return ERROR_FACTORY.create(errorCode, {
    originalErrorMessage:
      originalError &&
      ((_a = originalError) === null || _a === void 0 ? void 0 : _a.message),
  });
}
/**
 * A general-purpose store keyed by app + namespace + {@link
 * ProjectNamespaceKeyFieldValue}.
 *
 * <p>The Remote Config SDK can be used with multiple app installations, and each app can interact
 * with multiple namespaces, so this store uses app (ID + name) and namespace as common parent keys
 * for a set of key-value pairs. See {@link Storage#createCompositeKey}.
 *
 * <p>Visible for testing.
 */
const APP_NAMESPACE_STORE = "app_namespace_store";
const DB_NAME = "firebase_remote_config";
const DB_VERSION = 1;
// Visible for testing.
function openDatabase() {
  return new Promise((resolve, reject) => {
    var _a;
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = (event) => {
        reject(toFirebaseError(event, "storage-open" /* STORAGE_OPEN */));
      };
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        // We don't use 'break' in this switch statement, the fall-through
        // behavior is what we want, because if there are multiple versions between
        // the old version and the current version, we want ALL the migrations
        // that correspond to those versions to run, not only the last one.
        // eslint-disable-next-line default-case
        switch (event.oldVersion) {
          case 0:
            db.createObjectStore(APP_NAMESPACE_STORE, {
              keyPath: "compositeKey",
            });
        }
      };
    } catch (error) {
      reject(
        ERROR_FACTORY.create("storage-open" /* STORAGE_OPEN */, {
          originalErrorMessage:
            (_a = error) === null || _a === void 0 ? void 0 : _a.message,
        })
      );
    }
  });
}
/**
 * Abstracts data persistence.
 */
class Storage {
  /**
   * @param appId enables storage segmentation by app (ID + name).
   * @param appName enables storage segmentation by app (ID + name).
   * @param namespace enables storage segmentation by namespace.
   */
  constructor(appId, appName, namespace, openDbPromise = openDatabase()) {
    this.appId = appId;
    this.appName = appName;
    this.namespace = namespace;
    this.openDbPromise = openDbPromise;
  }
  getLastFetchStatus() {
    return this.get("last_fetch_status");
  }
  setLastFetchStatus(status) {
    return this.set("last_fetch_status", status);
  }
  // This is comparable to a cache entry timestamp. If we need to expire other data, we could
  // consider adding timestamp to all storage records and an optional max age arg to getters.
  getLastSuccessfulFetchTimestampMillis() {
    return this.get("last_successful_fetch_timestamp_millis");
  }
  setLastSuccessfulFetchTimestampMillis(timestamp) {
    return this.set("last_successful_fetch_timestamp_millis", timestamp);
  }
  getLastSuccessfulFetchResponse() {
    return this.get("last_successful_fetch_response");
  }
  setLastSuccessfulFetchResponse(response) {
    return this.set("last_successful_fetch_response", response);
  }
  getActiveConfig() {
    return this.get("active_config");
  }
  setActiveConfig(config) {
    return this.set("active_config", config);
  }
  getActiveConfigEtag() {
    return this.get("active_config_etag");
  }
  setActiveConfigEtag(etag) {
    return this.set("active_config_etag", etag);
  }
  getThrottleMetadata() {
    return this.get("throttle_metadata");
  }
  setThrottleMetadata(metadata) {
    return this.set("throttle_metadata", metadata);
  }
  deleteThrottleMetadata() {
    return this.delete("throttle_metadata");
  }
  async get(key) {
    const db = await this.openDbPromise;
    return new Promise((resolve, reject) => {
      var _a;
      const transaction = db.transaction([APP_NAMESPACE_STORE], "readonly");
      const objectStore = transaction.objectStore(APP_NAMESPACE_STORE);
      const compositeKey = this.createCompositeKey(key);
      try {
        const request = objectStore.get(compositeKey);
        request.onerror = (event) => {
          reject(toFirebaseError(event, "storage-get" /* STORAGE_GET */));
        };
        request.onsuccess = (event) => {
          const result = event.target.result;
          if (result) {
            resolve(result.value);
          } else {
            resolve(undefined);
          }
        };
      } catch (e) {
        reject(
          ERROR_FACTORY.create("storage-get" /* STORAGE_GET */, {
            originalErrorMessage:
              (_a = e) === null || _a === void 0 ? void 0 : _a.message,
          })
        );
      }
    });
  }
  async set(key, value) {
    const db = await this.openDbPromise;
    return new Promise((resolve, reject) => {
      var _a;
      const transaction = db.transaction([APP_NAMESPACE_STORE], "readwrite");
      const objectStore = transaction.objectStore(APP_NAMESPACE_STORE);
      const compositeKey = this.createCompositeKey(key);
      try {
        const request = objectStore.put({
          compositeKey,
          value,
        });
        request.onerror = (event) => {
          reject(toFirebaseError(event, "storage-set" /* STORAGE_SET */));
        };
        request.onsuccess = () => {
          resolve();
        };
      } catch (e) {
        reject(
          ERROR_FACTORY.create("storage-set" /* STORAGE_SET */, {
            originalErrorMessage:
              (_a = e) === null || _a === void 0 ? void 0 : _a.message,
          })
        );
      }
    });
  }
  async delete(key) {
    const db = await this.openDbPromise;
    return new Promise((resolve, reject) => {
      var _a;
      const transaction = db.transaction([APP_NAMESPACE_STORE], "readwrite");
      const objectStore = transaction.objectStore(APP_NAMESPACE_STORE);
      const compositeKey = this.createCompositeKey(key);
      try {
        const request = objectStore.delete(compositeKey);
        request.onerror = (event) => {
          reject(toFirebaseError(event, "storage-delete" /* STORAGE_DELETE */));
        };
        request.onsuccess = () => {
          resolve();
        };
      } catch (e) {
        reject(
          ERROR_FACTORY.create("storage-delete" /* STORAGE_DELETE */, {
            originalErrorMessage:
              (_a = e) === null || _a === void 0 ? void 0 : _a.message,
          })
        );
      }
    });
  }
  // Facilitates composite key functionality (which is unsupported in IE).
  createCompositeKey(key) {
    return [this.appId, this.appName, this.namespace, key].join();
  }
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * A memory cache layer over storage to support the SDK's synchronous read requirements.
 */
class StorageCache {
  constructor(storage) {
    this.storage = storage;
  }
  /**
   * Memory-only getters
   */
  getLastFetchStatus() {
    return this.lastFetchStatus;
  }
  getLastSuccessfulFetchTimestampMillis() {
    return this.lastSuccessfulFetchTimestampMillis;
  }
  getActiveConfig() {
    return this.activeConfig;
  }
  /**
   * Read-ahead getter
   */
  async loadFromStorage() {
    const lastFetchStatusPromise = this.storage.getLastFetchStatus();
    const lastSuccessfulFetchTimestampMillisPromise =
      this.storage.getLastSuccessfulFetchTimestampMillis();
    const activeConfigPromise = this.storage.getActiveConfig();
    // Note:
    // 1. we consistently check for undefined to avoid clobbering defined values
    //   in memory
    // 2. we defer awaiting to improve readability, as opposed to destructuring
    //   a Promise.all result, for example
    const lastFetchStatus = await lastFetchStatusPromise;
    if (lastFetchStatus) {
      this.lastFetchStatus = lastFetchStatus;
    }
    const lastSuccessfulFetchTimestampMillis =
      await lastSuccessfulFetchTimestampMillisPromise;
    if (lastSuccessfulFetchTimestampMillis) {
      this.lastSuccessfulFetchTimestampMillis =
        lastSuccessfulFetchTimestampMillis;
    }
    const activeConfig = await activeConfigPromise;
    if (activeConfig) {
      this.activeConfig = activeConfig;
    }
  }
  /**
   * Write-through setters
   */
  setLastFetchStatus(status) {
    this.lastFetchStatus = status;
    return this.storage.setLastFetchStatus(status);
  }
  setLastSuccessfulFetchTimestampMillis(timestampMillis) {
    this.lastSuccessfulFetchTimestampMillis = timestampMillis;
    return this.storage.setLastSuccessfulFetchTimestampMillis(timestampMillis);
  }
  setActiveConfig(activeConfig) {
    this.activeConfig = activeConfig;
    return this.storage.setActiveConfig(activeConfig);
  }
}

/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function registerRemoteConfig() {
  _registerComponent(
    new Component(
      RC_COMPONENT_NAME,
      remoteConfigFactory,
      "PUBLIC" /* PUBLIC */
    ).setMultipleInstances(true)
  );
  registerVersion(name, version);
  // BUILD_TARGET will be replaced by values like esm5, esm2017, cjs5, etc during the compilation
  registerVersion(name, version, "esm2017");
  function remoteConfigFactory(container, { instanceIdentifier: namespace }) {
    /* Dependencies */
    // getImmediate for FirebaseApp will always succeed
    const app = container.getProvider("app").getImmediate();
    // The following call will always succeed because rc has `import '@firebase/installations'`
    const installations = container
      .getProvider("installations-internal")
      .getImmediate();
    // Guards against the SDK being used in non-browser environments.
    if (typeof window === "undefined") {
      throw ERROR_FACTORY.create(
        "registration-window" /* REGISTRATION_WINDOW */
      );
    }
    // Guards against the SDK being used when indexedDB is not available.
    if (!isIndexedDBAvailable()) {
      throw ERROR_FACTORY.create(
        "indexed-db-unavailable" /* INDEXED_DB_UNAVAILABLE */
      );
    }
    // Normalizes optional inputs.
    const { projectId, apiKey, appId } = app.options;
    if (!projectId) {
      throw ERROR_FACTORY.create(
        "registration-project-id" /* REGISTRATION_PROJECT_ID */
      );
    }
    if (!apiKey) {
      throw ERROR_FACTORY.create(
        "registration-api-key" /* REGISTRATION_API_KEY */
      );
    }
    if (!appId) {
      throw ERROR_FACTORY.create(
        "registration-app-id" /* REGISTRATION_APP_ID */
      );
    }
    namespace = namespace || "firebase";
    const storage = new Storage(appId, app.name, namespace);
    const storageCache = new StorageCache(storage);
    const logger = new Logger(name);
    // Sets ERROR as the default log level.
    // See RemoteConfig#setLogLevel for corresponding normalization to ERROR log level.
    logger.logLevel = LogLevel.ERROR;
    const restClient = new RestClient(
      installations,
      // Uses the JS SDK version, by which the RC package version can be deduced, if necessary.
      SDK_VERSION,
      namespace,
      projectId,
      apiKey,
      appId
    );
    const retryingClient = new RetryingClient(restClient, storage);
    const cachingClient = new CachingClient(
      retryingClient,
      storage,
      storageCache,
      logger
    );
    const remoteConfigInstance = new RemoteConfig(
      app,
      cachingClient,
      storageCache,
      storage,
      logger
    );
    // Starts warming cache.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ensureInitialized(remoteConfigInstance);
    return remoteConfigInstance;
  }
}

/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// This API is put in a separate file, so we can stub fetchConfig and activate in tests.
// It's not possible to stub standalone functions from the same module.
/**
 *
 * Performs fetch and activate operations, as a convenience.
 *
 * @param remoteConfig - The {@link RemoteConfig} instance.
 *
 * @returns A `Promise` which resolves to true if the current call activated the fetched configs.
 * If the fetched configs were already activated, the `Promise` will resolve to false.
 *
 * @public
 */
async function fetchAndActivate(remoteConfig) {
  remoteConfig = getModularInstance(remoteConfig);
  await fetchConfig(remoteConfig);
  return activate(remoteConfig);
}

/**
 * Firebase Remote Config
 *
 * @packageDocumentation
 */
/** register component and version */
registerRemoteConfig();

class FirebaseRemoteConfigWeb extends core.WebPlugin {
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

var web = /*#__PURE__*/ Object.freeze({
  __proto__: null,
  FirebaseRemoteConfigWeb: FirebaseRemoteConfigWeb,
});

exports.FirebaseRemoteConfig = FirebaseRemoteConfig;
//# sourceMappingURL=plugin.cjs.js.map
