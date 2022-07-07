/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifndef TI_USE_AUTOLAYOUT

#import <Foundation/Foundation.h>

@class TiViewProxy;

/**
 Layout queue utility class.
 */
@interface TiLayoutQueue : NSObject {
}

/**
 Adds view proxy to the layout queue.
 @param newViewProxy The view proxy to add.
 */
+ (void)addViewProxy:(TiViewProxy *)newViewProxy;

/**
 Forces view proxy refresh.
 @param thisProxy The view proxy to layout.
 */
+ (void)layoutProxy:(TiViewProxy *)thisProxy;

+ (void)resetQueue;
@end

#endif
