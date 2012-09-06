/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>

#pragma mark - TiScriptError

/**
 * Script Error class
 */
@interface TiScriptError : NSObject

/**
 * Returns source URL where error happenned.
 */
@property (nonatomic, readonly) NSString *sourceURL;

/**
 * Returns line number where error happenned.
 */
@property (nonatomic, readonly) NSInteger lineNo;

/**
 * Returns error related message
 */
@property (nonatomic, readonly) NSString *message;

- (id)initWithMessage:(NSString *)message sourceURL:(NSString *)sourceURL lineNo:(NSInteger)lineNo;
- (id)initWithDictionary:(NSDictionary *)dictionary;

@end

#pragma mark - TiExceptionHandlerDelegate

/**
 * Exception handler delegate protocol. 
 */
@protocol TiExceptionHandlerDelegate <NSObject>

/**
 * Called when Objective-C exception is thrown.
 * @param exception An original NSException object
 * @param stackTrace An array of strings containing stack trace description
 */
- (void)handleUncaughtException:(NSException *)exception withStackTrace:(NSArray *)stackTrace;
- (void)handleScriptError:(TiScriptError *)error;

@end

#pragma mark - TiExceptionHandler

/**
 * The Exception Handler class. Singleton instance accessed via <defaultExceptionHandler>
 */
@interface TiExceptionHandler : NSObject < TiExceptionHandlerDelegate >

/**
 * Delegate for error/exception handling
 * @see TiExceptionHandlerDelegate
 */
@property (nonatomic, assign) id<TiExceptionHandlerDelegate> delegate;

/**
 * Presents provided script error to user. Default behavior in development mode.
 * @param error The script error object/
 */
- (void)showScriptError:(TiScriptError *)error;

/**
 * Returns singleton instance of TiExceptionHandler.
 * @return singleton instance
 */
+ (TiExceptionHandler *)defaultExceptionHandler;

- (void)reportScriptError:(TiScriptError *)error;

@end

