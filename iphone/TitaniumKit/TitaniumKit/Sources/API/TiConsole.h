/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "APIModule.h"
@import JavaScriptCore;

@protocol TiConsoleExports <JSExport>
- (void)time:(NSString *)label;
- (void)timeEnd:(NSString *)label;
JSExportAs(timeLog,
           -(void)timeLog
           : (id)args withData
           : (NSArray *)logData);
@end

// This is a version of the API module which has custom support for log() to
// make it behave like standard console.log(). This can be removed once we
// deprecate/remove/replace existing Ti.API.log() custom severity, which interferes
// with the ability to correctly process log() requests with exactly two arguments.
@interface TiConsole : APIModule <TiConsoleExports> {
  NSMutableDictionary *_times;
}
@end
