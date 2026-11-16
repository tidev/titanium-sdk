/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#if canImport(ActivityKit)
import TitaniumKit
import ActivityKit

@objc(TiAppiOSActivityAttributesProxy)
public class TiAppiOSActivityAttributesProxy : TiProxy {

  @objc(startActivity:)
  @available(iOS 16.1, *)
  func startActivity(args: [Any]) {
    guard let params = args.first as? [String: String] else {
      fatalError("Missing required parameters")
    }
    
    let attributes = TiActivityAttributes()
    let contentState = TiActivityAttributes.Status(value: params)

    do {
      let _ = try Activity<TiActivityAttributes>.request(attributes: attributes, contentState: contentState)
    } catch (let error) {
      NSLog("[ERROR] Cannot start activity: \(error.localizedDescription)")
    }
  }
}
#endif
