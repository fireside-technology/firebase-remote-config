import Foundation
import Capacitor
import FirebaseCore
import FirebaseRemoteConfig

/**
 * Please read the Capacitor iOS Plugin Development Guide
 * here: https://capacitor.ionicframework.com/docs/plugins/ios
 */
@objc(FirebaseRemoteConfig)
public class FirebaseRemoteConfig: CAPPlugin {
    
    var remoteConfig: RemoteConfig?
    
    public override func load() {
        if (FirebaseApp.app() == nil) {
          FirebaseApp.configure();
        }
        
        if self.remoteConfig == nil {
            self.remoteConfig = RemoteConfig.remoteConfig()
            
            let standardUserDefaults = UserDefaults.standard
            let remoteConfigDefaults = standardUserDefaults.object(forKey: "FirebaseRemoteConfigDefaults".lowercased())
            
            if remoteConfigDefaults != nil {
                self.remoteConfig?.setDefaults(fromPlist: remoteConfigDefaults as? String)
            }
        }
    }
    
    @objc func initialize(_ call: CAPPluginCall) {
        let minFetchInterval = call.getInt("minimumFetchIntervalInSeconds") ?? 0
        
        if self.remoteConfig != nil {
            let settings: RemoteConfigSettings = RemoteConfigSettings()
            settings.minimumFetchInterval = TimeInterval(minFetchInterval)
            self.remoteConfig?.configSettings = settings
        }
    }
    
    @objc func fetch(_ call: CAPPluginCall) {

        if self.remoteConfig == nil {
            call.reject("Remote config is not initialized. Make sure initialize() is called at first.")
        }

        self.remoteConfig?.fetch(completionHandler: { (status, error) in
            if status == .success {
                call.resolve()
            } else {
                call.reject(error?.localizedDescription ?? "Error occurred while executing fetch()")
            }
        })
    }
    
    @objc func activate(_ call: CAPPluginCall) {

        if self.remoteConfig == nil {
            call.reject("Remote config is not initialized. Make sure initialize() is called at first.")
        }

        self.remoteConfig?.activate();
    }
    
    @objc func fetchAndActivate(_ call: CAPPluginCall) {

        if self.remoteConfig == nil {
            call.reject("Remote config is not initialized. Make sure initialize() is called at first.")
        }

        self.remoteConfig?.fetchAndActivate(completionHandler: { (status, error) in
            if status == .successFetchedFromRemote || status == .successUsingPreFetchedData {
                call.resolve()
            } else {
                call.reject("Error occurred while executing failAndActivate()")
            }
        })
    }
    
    @objc func getBoolean(_ call: CAPPluginCall) {

        if self.remoteConfig == nil {
            call.reject("Remote config is not initialized. Make sure initialize() is called at first.")
        }

        if call.hasOption("key") {
            let key = call.getString("key")
            
            if key != nil {
                let value = self.remoteConfig?.configValue(forKey: key).boolValue
                let source = self.remoteConfig?.configValue(forKey: key).source
                call.resolve([
                    "key": key! as String,
                    "value": value! as Bool,
                    "source": source!.rawValue as Int
                ])
            } else {
                call.reject("Key is missing")
            }
        } else {
            call.reject("Key is missing")
        }
    }
    
    @objc func getNumber(_ call: CAPPluginCall) {
    
        if self.remoteConfig == nil {
            call.reject("Remote config is not initialized. Make sure initialize() is called at first.")
        }
            
        if call.hasOption("key") {
            let key = call.getString("key")
            
            if key != nil {
                let value = self.remoteConfig?.configValue(forKey: key).numberValue
                let source = self.remoteConfig?.configValue(forKey: key).source
                call.resolve([
                    "key": key! as String,
                    "value": value!,
                    "source": source!.rawValue as Int
                ])
            } else {
                call.reject("Key is missing")
            }
        } else {
            call.reject("Key is missing")
        }
    }
    
    @objc func getString(_ call: CAPPluginCall) {
    
        if self.remoteConfig == nil {
            call.reject("Remote config is not initialized. Make sure initialize() is called at first.")
        }
        
        if call.hasOption("key") {
            let key = call.getString("key")
            
            if key != nil {
                let value = self.remoteConfig?.configValue(forKey: key).stringValue
                let source = self.remoteConfig?.configValue(forKey: key).source
                call.resolve([
                    "key": key! as String,
                    "value": value!,
                    "source": source!.rawValue as Int
                ])
            } else {
                call.reject("Key is missing")
            }
        } else {
            call.reject("Key is missing")
        }
    }
    
    @objc func getByteArray(_ call: CAPPluginCall) {
        call.resolve()
    }
}
