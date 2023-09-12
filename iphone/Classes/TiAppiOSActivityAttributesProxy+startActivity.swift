/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

import TitaniumKit
#if canImport(ActivityKit)
import ActivityKit
#endif

extension TiAppiOSActivityAttributesProxy {

  @objc(_startActivity:)
  class func _startActivity(args: Any) {
    guard let params = args as? [String: String] else {
      fatalError("Invalid parameters passed to \"startActivity\" method!")
    }

#if canImport(ActivityKit)
    let attributes = TiActivityAttributes()
    let contentState = TiActivityAttributes.Status(value: params)

    do {
      if #available(iOS 16.1, *) {
        _ = try Activity<TiActivityAttributes>.request(attributes: attributes, contentState: contentState)
      }
    } catch let error {
      NSLog("[ERROR] Cannot start activity: \(error.localizedDescription)")
    }
#else
    NSLog("[ERROR] Cannot call \"startActivity\" on iOS < 16.1. Please add a guard to prevent this error log!")
#endif
  }
}
