/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>

/**
 * Custom UIWindow subclass that tracks which window was last interacted with.
 * In multi-scene mode (iPad Split View, Slide Over), both scenes report
 * activationState == foregroundActive simultaneously, and isKeyWindow returns
 * YES for both. The only reliable way to determine which scene has input focus
 * is to track which window was last touched via hitTest:withEvent:.
 */
@interface TiWindow : UIWindow

/**
 * The window that was most recently interacted with (received a hit test).
 * Returns nil if no window has been interacted with yet.
 */
+ (UIWindow *)lastActiveWindow API_AVAILABLE(ios(13_0));

@end