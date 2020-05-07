//
//  TiAppiOSBackgroundTaskProxy.swift
//  Titanium
//
//  Created by Jan Vennemann on 24.04.20.
//

import TitaniumKit
import Foundation.NSOperation
import BackgroundTasks

@available(iOS 13.0, *)
@objc
public class TiAppiOSBackgroundTaskProxy : TiProxy {
  
  @objc
  public var type: String!
  
  @objc
  public var identifier: String!
  
  @objc
  public var url: String!
  
  @objc
  public var interval: NSNumber!
  
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
    guard let type = properties["type"] as? String else {
      self.throwException("Invalid task", subreason: "No type specified", location: CODELOCATION)
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
    guard let interval = properties["interval"] as? NSNumber else {
      self.throwException("Invalid task", subreason: "No interval specified", location: CODELOCATION)
      return;
    } 
    
    // TODO: validate type and options
    if let options = properties["options"] as? [String] {
      self.options = options
    }
    self.type = type
    self.identifier = identifier
    self.url = url;
    self.interval = interval
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
    request.earliestBeginDate = Date(timeIntervalSinceNow: self.interval.doubleValue)
    
    do {
      try BGTaskScheduler.shared.submit(request)
    } catch {
      NSLog("Could not schedule background task: \(error)")
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
