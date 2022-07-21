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
        }
    }
    
    @objc func initialize(_ call: CAPPluginCall) {
        let minFetchInterval = call.getInt("minimumFetchInterval") ?? 0
        let fetchTimeout = call.getInt("fetchTimeout") ?? 0

        guard let remoteConfig = self.remoteConfig else {
          call.reject("Missing initialization")
          return
        }

        let settings: RemoteConfigSettings = RemoteConfigSettings()
        settings.minimumFetchInterval = TimeInterval(minFetchInterval)
        settings.fetchTimeout = TimeInterval(fetchTimeout)
        remoteConfig.configSettings = settings
        call.resolve()
    }
    
    @objc func fetch(_ call: CAPPluginCall) {

        if self.remoteConfig == nil {
            call.reject("Remote config is not initialized. Make sure initialize() is called at first.")
        }

        self.remoteConfig?.fetch(completionHandler: { (status, error) in
            if status == .success {
                call.resolve()
                return
            }
            
            call.reject(error?.localizedDescription ?? "Error occurred while executing fetch()")
            return
        })
    }
    
    @objc func activate(_ call: CAPPluginCall) {

        if self.remoteConfig == nil {
            call.reject("Remote config is not initialized. Make sure initialize() is called at first.")
        }
            
        self.remoteConfig?.activate(completion: { (status, error) in
            if error != nil {
                call.reject(error?.localizedDescription ?? "Error occurred while executing activate()")
            } else {
                call.resolve()
            }
        })
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

        guard let key = call.options["key"] as? String else {
          call.reject("Key is missing")
          return
        }

        let value = self.remoteConfig?.configValue(forKey: key).boolValue
        let source = self.remoteConfig?.configValue(forKey: key).source
        call.resolve([
            "key": key,
            "value": value! as Bool,
            "source": source!.rawValue as Int
        ])
    }
    
    @objc func getNumber(_ call: CAPPluginCall) {
    
        if self.remoteConfig == nil {
            call.reject("Remote config is not initialized. Make sure initialize() is called at first.")
        }

        guard let key = call.options["key"] as? String else {
          call.reject("Key is missing")
          return
        }

        let value = self.remoteConfig?.configValue(forKey: key).numberValue
        let source = self.remoteConfig?.configValue(forKey: key).source
        call.resolve([
            "key": key,
            "value": value!,
            "source": source!.rawValue as Int
        ])
    }
    
    @objc func getString(_ call: CAPPluginCall) {
    
        if self.remoteConfig == nil {
            call.reject("Remote config is not initialized. Make sure initialize() is called at first.")
        }

        guard let key = call.options["key"] as? String else {
          call.reject("Key is missing")
          return
        }

        let value = self.remoteConfig?.configValue(forKey: key).stringValue
        let source = self.remoteConfig?.configValue(forKey: key).source
        call.resolve([
            "key": key,
            "value": value!,
            "source": source!.rawValue as Int
        ])
    }
    
    @objc func initializeFirebase(_ call: CAPPluginCall) {
        print("FirebaseRemoteConfig: initializeFirebase noop")
        call.resolve()
    }

    @objc func setDefaultConfig(_ call: CAPPluginCall) {
        let standardUserDefaults = UserDefaults.standard
        let remoteConfigDefaults = standardUserDefaults.object(forKey: "FirebaseRemoteConfigDefaults".lowercased())

        if remoteConfigDefaults != nil {
            self.remoteConfig?.setDefaults(fromPlist: remoteConfigDefaults as? String)
        }
        call.resolve()
    }
}
