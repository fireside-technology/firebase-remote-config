import { FirebaseApp } from "firebase/app";

export interface FirebaseRemoteConfigPlugin {
  initializeFirebase(app: FirebaseApp): Promise<void>;
  setDefaultConfig(options: any): Promise<void>;
  initialize(options?: initOptions): Promise<void>;
  fetch(): Promise<void>;
  activate(): Promise<void>;
  fetchAndActivate(): Promise<void>;
  getBoolean(options: RCValueOption): Promise<RCReturnData>;
  getNumber(options: RCValueOption): Promise<RCReturnData>;
  getString(options: RCValueOption): Promise<RCReturnData>;
}

export interface initOptions {
  minimumFetchInterval?: number;
  fetchTimeout?: number;
}

export interface RCValueOption {
  key: string;
}

export interface RCReturnData {
  key: string;
  value: string;
  source: string;
}
