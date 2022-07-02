/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiViewProxy.h"

// marker interface for toolbars

/**
 Protocol for toolbar classes.
 */
@protocol TiToolbar <NSObject>
@required

/**
 Returns the underlying toolbar.
 @return The toolbar.
 */
- (UIToolbar *)toolbar;

@end
