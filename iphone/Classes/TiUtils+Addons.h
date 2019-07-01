/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019-present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <TitaniumKit/TiUtils.h>

NS_ASSUME_NONNULL_BEGIN

@interface TiUtils (Addons)

/**
 Returns a unique identifier for this app.
 
 This will change upon a fresh install.
 
 @return UUID for this app.
 */
+ (NSString *)appIdentifier;

@end

NS_ASSUME_NONNULL_END
