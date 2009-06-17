/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <Foundation/Foundation.h>

enum {
	TitaniumInvalidState,
	TitaniumHasDataForModule,
	TitaniumHasDataForJavascript,
}; //Used with the locks.


@class TitaniumAppProtocol;

@interface TitaniumCmdThread : NSObject {
	NSString * magicToken;
	NSString * objectName;
	NSString * functionName;
	NSArray * argList;

	NSString * javaScriptResult; //Set by continuing.

	NSThread * moduleThread;

	NSTimeInterval timeout;
	BOOL success;
	NSString * moduleResult;	//This is javascript for the webview to act on.
	NSConditionLock * statusLock;
}

@property(readwrite,nonatomic,copy)		NSString * magicToken;
@property(readwrite,nonatomic,copy)		NSString * objectName;
@property(readwrite,nonatomic,copy)		NSString * functionName;
@property(readwrite,nonatomic,copy)		NSArray * argList;
@property(readwrite,nonatomic,copy)		NSString * javaScriptResult; //Set by continuing.
@property(readwrite,nonatomic,retain)	NSThread * moduleThread;
@property(readwrite,nonatomic,assign)	NSTimeInterval timeout;
@property(readwrite,nonatomic,assign)	BOOL success;
@property(readwrite,nonatomic,copy)		NSString * moduleResult;	//This is javascript for the webview to act on.
@property(readwrite,nonatomic,retain)	NSConditionLock * statusLock;

- (void) runWithURL: (NSURL *) url; //Spawns a new thread, and blocks until the module command is done or paused.
- (void) continueWithURL: (NSURL *) url; //stuffs javaScriptResult, and blocks for the background thread to do more work.

- (void) multiThreadedDoCommand; //This is the root function of the new thread.
- (NSString *) pauseForJavascriptFetch: (NSString *) javaScriptFunction; //This is called (indirectly) by the module. It sets up the moduleResult and blocks for the foreground thread.

- (void) doCommand;

@end

