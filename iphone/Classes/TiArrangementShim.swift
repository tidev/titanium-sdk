/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#if TI_SDK_IOS_27_1
import UIKit

/// Bridges the Swift-only arrangement styles of `UIArrangementViewController` (iOS 27.1+) to Objective-C.
///
/// `UIArrangement` can not be created from Objective-C, only from Swift using `.split` and `.overlay`.
/// The class is looked up by name at runtime, so Objective-C code compiles without it.
@objc(TiArrangementShim)
public final class TiArrangementShim: NSObject {

  /// Matches the `SPLIT_WINDOW_ARRANGEMENT_STYLE_*` constants of `Ti.UI.iOS`.
  @objc public static let styleSplit = 1
  @objc public static let styleOverlay = 2

  /// Applies the arrangement style to an `UIArrangementViewController`. Returns `false` if the style or
  /// the controller is not supported.
  @available(iOS 27.1, *)
  @MainActor
  @objc(applyStyle:toController:animated:)
  @discardableResult
  public static func apply(style: Int, to controller: UIViewController, animated: Bool) -> Bool {
    guard let arrangementController = controller as? UIArrangementViewController else {
      return false
    }

    switch style {
    case styleSplit:
      arrangementController.updateArrangement(.split, animated: animated)
    case styleOverlay:
      arrangementController.updateArrangement(.overlay, animated: animated)
    default:
      return false
    }
    return true
  }
}
#endif
