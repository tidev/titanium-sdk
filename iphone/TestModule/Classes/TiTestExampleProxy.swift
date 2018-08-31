//
//  TiTestExampleProxy.swift
//  TestModule
//
//  Copyright © 2018-present by Appcelerator. All rights reserved.
//

import UIKit
import TitaniumKit

/**
 
 Titanium Swift Module Requirements
 ---
 
 1. Use the @objc annotation to expose your class to Objective-C (used by the Titanium core)
 2. Use the @objc annotation to expose your method to Objective-C as well.
 3. Method arguments always have the "[Any]" type, specifying a various number of arguments.
    Unwrap them like you would do in Swift, e.g. "guard let arguments = arguments, let message = arguments.first"
 4. You can use any public Titanium API like before, e.g. TiUtils. Remember the type safety of Swift, like Int vs Int32
    and NSString vs. String.
 
 */

@objc(TiTestExampleProxy)
class TiTestExampleProxy: TiProxy {

  override func _init(withPageContext context: TiEvaluator!) -> TiTestExampleProxy! {
    super._init(withPageContext: context)

    // Custom proxy init
    
    return self
  }
  
  /**
   Test a number return value.
 
   - returns: The numeric return value
   
   - parameters:
       - unused An unused parameter
   */

  @objc(testNumber:)
  func testNumber(unused: Any?) -> Any {
    return TiUtils.intValue("42") // or return 42 directly
  }
  
  /**
   Test a string return value.
   
   - returns: The string return value
   
   - parameters:
   - unused An unused parameter
   */

  @objc(testString:)
  func testString(unused: Any?) -> String {
    return "Hello world"
  }
  
  /**
   Test a dictionary return value.
   
   - returns: The dictionary return value
   
   - parameters:
   - unused An unused parameter
   */
  
  @objc(testDictionary:)
  func testDictionary(unused: Any?) -> [String: String] {
    return ["hello": "world"]
  }
  
  /**
   Tests an array return value.
   
   - returns: The array return value
   
   - parameters:
   - unused An unused parameter
   */

  @objc(testArray:)
  func testArray(unused: Any?) -> [String] {
    return ["hello", "world"]
  }

  /**
   Tests a nil/null return value.
   
   - returns: The null return value
   
   - parameters:
   - unused An unused parameter
   */
  
  @objc(testNull:)
  func testNull(unused: Any?) -> Any? {
    return nil // Or "NSNull()" for dictionary safety
  }
}
