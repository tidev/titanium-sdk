/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <TitaniumKit/TiModule.h>

@interface APIModule : TiModule {
}

- (void)logMessage:(NSArray *)messages severity:(NSString *)severity; // Used by TiConsole

@end
