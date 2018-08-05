/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiModule.h"

/**
 The Ti.API core-module that is used to log messages, exceptions.
 */
@interface APIModule : TiModule

/**
 Logs a new message with a given severity. Used internally by TiConsole.
 
 @param args An array of messages.
 @param severity The severity of the log messages.
 */
- (void)logMessage:(NSArray *)args severity:(NSString *)severity;

/**
 Logs a new debug message to the console.
 
 @param args The message to log.
 */
- (void)debug:(NSArray *)args;

/**
 Logs a new info message to the console.
 
 @param args The message to log.
 */
- (void)info:(NSArray *)args;

/**
 Logs a new warn message to the console.
 
 @param args The message to log.
 */
- (void)warn:(NSArray *)args;

/**
 Logs a new error message to the console.
 
 @param args The message to log.
 */
- (void)error:(NSArray *)args;

/**
 Logs a new trace message to the console.
 
 @param args The message to log.
 */
- (void)trace:(NSArray *)args;

/**
 Logs the current timestamp to the console.
 
 @param args An optional argument containing a dictionary that represents
             the error message linked to this timestamp.
 */
- (void)timestamp:(NSArray *)args;

/**
 Logs a notice to the console. Identical to `info:`.
 
 @param args The message to log.
 */
- (void)notice:(NSArray *)args;

/**
 Logs a critical message to the console.
 
 @param args The message to log. Identical to `error:`.
 */
- (void)critical:(NSArray *)args;

/**
 Logs a default log message to the console.
 
 @param args The message to log.
 */
- (void)log:(NSArray *)args;

@end
