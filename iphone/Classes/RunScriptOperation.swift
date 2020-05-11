//
//  RunScriptOperation.swift
//  Titanium
//
//  Created by Jan Vennemann on 24.04.20.
//

import Foundation
import TitaniumKit

@available(iOS 13.0, *)
class RunScriptOperation : Operation {
  private let url: String
  private let host: TiHost
  private var bridge: KrollBridge? = nil
  private var resolved = false
  private var contextRunning = false
  
  @objc
  init(url: String, host: TiHost) {
    self.url = url
    self.host = host
  }
  
  override var isExecuting: Bool {
    return self.contextRunning
  }
  
  override var isFinished: Bool {
    return self.resolved
  }
  
  override func start() {
    guard !isCancelled else {
      return
    }
    
    self.bridge = KrollBridge(host: self.host)
    let url = TiHost.resourceBasedURL("ti.task.js", baseURL: nil)
    // pass in an empty preload dictionary to force booting into our provided url
    // instead of ti.main.js
    bridge?.boot(self, url: url, preload: [:])
    
    willChangeValue(forKey: #keyPath(isExecuting))
    contextRunning = true
    didChangeValue(forKey: #keyPath(isExecuting))
  }
  
  override func cancel() {
    super.cancel()
    let condition = NSCondition()
    self.bridge?.shutdown(condition)
  }
  
  @objc(booted:)
  public func booted(_ bridge: KrollBridge) {
    let context = JSContext(jsGlobalContextRef: bridge.krollContext()?.context())!
    context.exceptionHandler = { (context, value) in
      if let error = value {
        NSLog("Error: \(error.toString() ?? "\(error)")")
      } else {
        NSLog("Unknown error in background task")
      }
    }
    let task = context.evaluateScript("require('\(self.url)');");
    let callbackBlock: @convention(block) () -> Void = {
      self.finish()
    }
    let callback = JSValue(object: callbackBlock, in: context)!;
    task?.call(withArguments: [callback]);
  }
  
  func finish() {
    let condition = NSCondition()
    self.bridge?.shutdown(condition)
    
    // TODO: is there a way to check when bridge shutdown is complete?
    willChangeValue(forKey: #keyPath(isExecuting))
    willChangeValue(forKey: #keyPath(isFinished))
    
    self.contextRunning = false
    self.resolved = true
    
    didChangeValue(forKey: #keyPath(isFinished))
    didChangeValue(forKey: #keyPath(isExecuting))
  }
}
