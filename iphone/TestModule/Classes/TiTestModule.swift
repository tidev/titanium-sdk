//
//  TestModuleModule.swift
//  TestModule
//
//  Copyright © 2018-present by Appcelerator. All rights reserved.
//

import UIKit
import TitaniumKit

@objc(TiTestModule)
class TiTestModule: TiModule {
  public let testProperty: String = "Hello World"
  
  func moduleGUID() -> String {
    return "e65f94f4-5fd7-424a-a2b8-5f4642f291a9"
  }
  
  override func moduleId() -> String! {
    return "ti.test"
  }

  override func startup() {
    super.startup()
    debugPrint("[DEBUG] \(self) loaded")
  }
  
  @objc(tryThis:)
  func tryThis(arguments: Array<Any>?) -> String {
    guard let arguments = arguments, let message = arguments.first else { return "No arguments" }
    
    return "\(message) from TiSwift!"
  }
}
