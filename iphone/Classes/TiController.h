/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <TitaniumKit/TiViewProxy.h>

//TODO: rename tab controller

@protocol TiController

@optional
- (id)initWithViewProxy:(TiViewProxy *)proxy;

@required
- (TiViewProxy *)proxy;

@end
