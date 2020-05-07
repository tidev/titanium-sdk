//
//  TiAppiOSBackgroundTaskProxy.swift
//  Titanium
//
//  Created by Jan Vennemann on 24.04.20.
//

import TitaniumKit
import BackgroundTasks

@available(iOS 13.0, *)
@objc
public class TiAppiOSBackgroundTaskProxy : TiProxy {
  
  var type: String {
    get {
      return self.value(forUndefinedKey: "type") as! String
    }
  }
  
  var identifier: String {
    get {
      return self.value(forUndefinedKey: "identifier") as! String
    }
  }
  
  var url: String {
    get {
      return self.value(forUndefinedKey: "url") as! String
    }
  }
  
  var interval: Double? {
    if let interval = self.value(forUndefinedKey: "interval") as? NSNumber {
      return interval.doubleValue
    } else {
      return nil
    }
  }
  
  var options: [String] {
    get {
      return self.value(forUndefinedKey: "options") as? [String] ?? []
    }
  }
  
  private var _repeat: JSValue {
    get {
      guard let rawValue = self.value(forUndefinedKey: "repeat") else {
        return JSValue(bool: true, in: self.context)
      }
      if let number = rawValue as? NSNumber {
        return JSValue(bool: number.boolValue, in: self.context)
      } else if let function = rawValue as? KrollCallback {
        return JSValue(jsValueRef: function.function(), in: self.context)
      } else {
        return JSValue(bool: true, in: self.context)
      }
    }
  }
  
  private var context: JSContext!
  
  public override func _init(withPageContext context: TiEvaluator!) -> Self? {
    if let self = super._init(withPageContext: context) as! Self? {
      self.context = JSContext(jsGlobalContextRef: context.krollContext()?.context())
    }
    
    return self
  }
  
  public override func _init(withProperties properties: [AnyHashable : Any]!) {
    guard let type = properties["type"] as? String, (type == "refresh" || type == "processing") else {
      self.throwException("Invalid task", subreason: "Missing or invalid type", location: CODELOCATION)
      return;
    }
    guard let identifier = properties["identifier"] as? String else {
      self.throwException("Invalid task", subreason: "No identifier specified", location: CODELOCATION)
      return;
    }
    guard let url = properties["url"] as? String else {
      self.throwException("Invalid task", subreason: "No url specified", location: CODELOCATION)
      return;
    }
    
    super._init(withProperties: properties)
  }
  
  @objc
  public func schedule() {
    var request: BGTaskRequest
    if self.type == "refresh" {
      request = BGAppRefreshTaskRequest(identifier: self.identifier)
    } else {
      let processingRequest = BGProcessingTaskRequest(identifier: self.identifier)
      if self.options.contains("network") {
        processingRequest.requiresNetworkConnectivity = true
      }
      if self.options.contains("power") {
        processingRequest.requiresExternalPower = true
      }
      request = processingRequest
    }
    if let interval = self.interval {
      request.earliestBeginDate = Date(timeIntervalSinceNow: interval)
    }
    
    do {
      try BGTaskScheduler.shared.submit(request)
    } catch {
      NSLog("Could not schedule background task: \(error)")
    }
  }
  
  func shouldRepeat() -> Bool {
    if (self._repeat.isBoolean) {
      return self._repeat.toBool()
    } else if (self._repeat.isFunction) {
      return self._repeat.call(withArguments: [])?.toBool() ?? false
    } else {
      return true
    }
  }
}

@available(iOS 13.0, *)
extension TiApp {
  @objc(registerBackgroundTask:)
  func registerBackgroundTask(_ taskProxy: TiAppiOSBackgroundTaskProxy) {
    if (self.backgroundTasks == nil) {
      self.backgroundTasks = NSMutableDictionary()
    }
    self.backgroundTasks.setObject(taskProxy, forKey: taskProxy.identifier as NSString);
    BGTaskScheduler.shared.register(forTaskWithIdentifier: taskProxy.identifier, using: nil) { (task) in
      self.handleBackgroundTask(task)
    }
  }
  
  func handleBackgroundTask(_ task: BGTask) {
    let taskProxy = self.backgroundTasks[task.identifier] as! TiAppiOSBackgroundTaskProxy
    if (taskProxy.shouldRepeat()) {
        taskProxy.schedule()
    }
    let url = taskProxy.url
    let queue = Foundation.OperationQueue()
    
    let operation = RunScriptOperation(url: url, host: taskProxy._host())
    task.expirationHandler = {
      queue.cancelAllOperations()
    }
    operation.completionBlock = {
      task.setTaskCompleted(success: !operation.isCancelled)
    }
    
    queue.addOperations([operation], waitUntilFinished: false)
  }
}
