/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "ObjcProxy.h"
@import JavaScriptCore;

@protocol APIExports <JSExport>

/**
 Logs a new debug message to the console.

 @param args The message to log.
 */
- (void)debug:(id)args;

/**
 Logs a new info message to the console.

 @param args The message to log.
 */
- (void)info:(id)args;

/**
 Logs a new warn message to the console.

 @param args The message to log.
 */
- (void)warn:(id)args;

/**
 Logs a new error message to the console.

 @param args The message to log.
 */
- (void)error:(id)args;

/**
 Logs a new trace message to the console.

 @param args The message to log.
 */
- (void)trace:(id)args;

/**
 Logs the current timestamp to the console.

 @param args An optional argument containing a dictionary that represents
             the error message linked to this timestamp.
 */
- (void)timestamp:(id)args;

/**
 Logs a notice to the console. Identical to `info:`.

 @param args The message to log.
 */
- (void)notice:(id)args;

/**
 Logs a critical message to the console.

 @param args The message to log. Identical to `error:`.
 */
- (void)critical:(id)args;

JSExportAs(log,
           -(void)log
           : (id)level withMessage
           : (id)args);
- (void)reportUnhandledException:(NSArray *)args;

@end

@interface APIModule : ObjcProxy <APIExports>
/**
 Logs a new message with a given severity. Used internally by TiConsole.

 @param args An array of messages.
 @param severity The severity of the log messages.
*/
- (void)logMessage:(id)args severity:(NSString *)severity; // Used by TiConsole
@end
