//
//  TiAppiOSBackgroundTaskProxy.swift
//  Titanium
//
//  Created by Jan Vennemann on 24.04.20.
//

import TitaniumKit
import Foundation.NSOperation
import BackgroundTasks

@objc
public protocol BackgroundTaskProxy {
  @objc(stop:)
  func stop(args: Any)
  
  @objc(unregister:)
  func unregister(args: Any)
}

@available(iOS 13.0, *)
@objc
public class TiAppiOSBackgroundTaskProxy : TiProxy, BackgroundTaskProxy {
  @objc
  public var type: String!
  
  @objc
  public var identifier: String!
  
  @objc
  public var url: String!
  
  @objc
  public var interval: NSNumber?
  
  @objc
  public var `repeat`: NSNumber {
    get {
      return NSNumber.init(booleanLiteral: self._repeat)
    }
    set {
      self._repeat = newValue.boolValue
    }
  }
  
  @objc
  public var options = [String]()
  
  private var _repeat: Bool!
  
  public override func _init(withProperties properties: [AnyHashable : Any]!) {
    guard let type = properties["type"] as? String, (type == "refresh" || type == "process") else {
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
      request.earliestBeginDate = Date(timeIntervalSinceNow: interval.doubleValue)
    }
    
    do {
      try BGTaskScheduler.shared.submit(request)
    } catch {
      NSLog("Could not schedule background task: \(error)")
    }
  }
  
  public func stop(args: Any) {
    BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: self.identifier)
  }
  
  public func unregister(args: Any) {
    TiApp.sharedApp()?.unregisterBackgroundTask(self)
  }
}

@available(iOS 13.0, *)
extension TiApp {
  @objc(registerBackgroundTask:)
  func registerBackgroundTask(_ taskProxy: TiAppiOSBackgroundTaskProxy) {
    if (self.backgroundTasks == nil) {
      self.backgroundTasks = NSMutableDictionary()
    }
    self.backgroundTasks.setObject(taskProxy, forKey: taskProxy.identifier! as NSCopying);
    BGTaskScheduler.shared.register(forTaskWithIdentifier: taskProxy.identifier, using: nil) { (task) in
      self.handleBackgroundTask(task)
    }
  }
  
  @objc(unregisterBackgroundTask:)
  func unregisterBackgroundTask(_ taskProxy: TiAppiOSBackgroundTaskProxy) {
    self.backgroundTasks.removeObject(forKey: taskProxy.identifier!);
  }
  
  func handleBackgroundTask(_ task: BGTask) {
    let taskProxy = self.backgroundTasks[task.identifier] as! TiAppiOSBackgroundTaskProxy
    taskProxy.schedule()
    let url = taskProxy.url!
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
