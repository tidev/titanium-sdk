/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020-present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

import TitaniumKit

extension TiUtils {

  /**
  Returns a unique identifier for this app.
  
  This will change upon a fresh install.
  
  @return UUID for this app.
  */
  @objc(appIdentifier)
  class func appIdentifier() -> String? {
    let kAppUUIDString = "com.appcelerator.uuid"
    let defaults = UserDefaults.standard
    var uid = defaults.string(forKey: kAppUUIDString)

    if uid == nil {
      uid = TiUtils.createUUID()
      defaults.set(uid, forKey: kAppUUIDString)
      defaults.synchronize()
    }

    return uid
  }
}
