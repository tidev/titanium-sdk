/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_GESTURE
#import <JavaScriptCore/JavaScriptCore.h>
#import <TitaniumKit/ObjcModule.h>

@protocol GestureExports <JSExport>

// Properties (and accessors)
READONLY_PROPERTY(bool, landscape, Landscape);
READONLY_PROPERTY(NSNumber *, orientation, Orientation);
READONLY_PROPERTY(bool, portrait, Portrait);

@end

@interface GestureModule : ObjcModule <GestureExports> {
  NSTimeInterval lastShakeTime;
}

@end

#endif
