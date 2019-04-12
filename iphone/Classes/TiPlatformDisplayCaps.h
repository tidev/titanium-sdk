/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_PLATFORM

@import JavaScriptCore;
@import TitaniumKit.ObjcProxy;

@protocol TiPlatformDisplayCapsExports <JSExport>

// Properties (and accesors)
READONLY_PROPERTY(NSString *, density, Density);
READONLY_PROPERTY(NSNumber *, dpi, Dpi);
READONLY_PROPERTY(NSNumber *, logicalDensityFactor, LogicalDensityFactor);
READONLY_PROPERTY(NSNumber *, platformHeight, PlatformHeight);
READONLY_PROPERTY(NSNumber *, platformWidth, PlatformWidth);
// TODO xdpi
// TODO ydpi

@end

@interface TiPlatformDisplayCaps : ObjcProxy <TiPlatformDisplayCapsExports>
@end

#endif
