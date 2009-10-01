/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TitaniumCmdThread.h"
#import "TitaniumHost.h"
#import "SBJSON.h"
#import "TitaniumJSCode.h"

@implementation TitaniumCmdThread
@synthesize magicToken,objectName,functionName,argList,javaScriptResult;
@synthesize moduleThread,timeout,success,moduleResult,statusLock;

#pragma mark Init and release

- (void)dealloc;
{
	[magicToken release];
	[objectName release];
	[functionName release];
	[argList release];
	[javaScriptResult release]; //Set by continuing.
	[moduleResult release];	//This is javascript for the webview to act on.
	if (moduleThread == nil){
		//	if([statusLock)
		[statusLock unlock]; //TODO: what if there's a hung background thread? THis might be a crasher.
	} else {
		NSLog(@"[WARN] Thread was still in use while dealloced?");
		[moduleThread release];
	}
	[statusLock release];
	
	[super dealloc];
}

#pragma mark Accessors

- (NSString *) description;
{
	return [NSString stringWithFormat:@"<%@: 0x%x "
				"magicToken:%@ objectName:%@ functionName:%@ argList:%@ "
				"javaScriptResult:%@ moduleThread:%@ timeout:%f "
				"success:%d moduleResult:%@ statusLock:%@>",
				NSStringFromClass([self class]),self,
				magicToken, objectName, functionName, argList,
				javaScriptResult,moduleThread, timeout, success,
				moduleResult, statusLock];
}


- (void) setArgList: (NSArray *) newArgList;
{
	if (newArgList == argList) return;

	[argList autorelease];
	if ((newArgList == nil) || [newArgList isKindOfClass:[NSArray class]]){
		argList = [newArgList copy];
	} else {
		argList = [[NSArray alloc] initWithObjects:newArgList,nil];
	}
}

#pragma mark Url-based entry points

- (void) runWithURL: (NSURL *) url; //Spawns a new thread, and blocks until the module command is done or paused.
{
	[self setArgList:[SBJSON decodeUrlQuery:url]];

	NSArray * pathParts = [[url path] componentsSeparatedByString:@"/"];
	int pathPartsCount = [pathParts count]; //Entry 0 is /, entry 1 is _TICMD
	if (pathPartsCount > 2)[self setMagicToken:[pathParts objectAtIndex:2]];
	if (pathPartsCount > 3)[self setObjectName:[pathParts objectAtIndex:3]];
	if (pathPartsCount > 4)[self setFunctionName:[pathParts objectAtIndex:4]];

	BOOL needsMultithreading = NO;
	
	if (needsMultithreading) {
		statusLock = [[NSConditionLock alloc] init];
		[statusLock setName:[url absoluteString]];
		timeout = 1.0;
		[statusLock lock];
		[self performSelectorInBackground:@selector(multiThreadedDoCommand) withObject:nil];
		[statusLock unlockWithCondition:TitaniumHasDataForModule];
		success = YES; 
		[statusLock lockWhenCondition:TitaniumHasDataForJavascript];
		if (moduleThread == nil){
			[statusLock unlock];
			[statusLock release];
			statusLock = nil;
		}
	} else {
		[self doCommand];
	}
	
}

- (void) continueWithURL: (NSURL *) url; //stuffs javaScriptResult, and blocks for the background thread to do more work.
{
	[self setJavaScriptResult:[SBJSON decodeUrlQuery:url]];
	[self setModuleResult:nil];

	[statusLock unlockWithCondition:TitaniumHasDataForModule]; //This will trigger the background thread
	success = YES; 
	[statusLock lockWhenCondition:TitaniumHasDataForJavascript];
	if (moduleThread == nil){
		[statusLock unlock];
		[statusLock release];
		statusLock = nil;
	}
}

#pragma mark processing methods

- (void) doCommand;
{
	[self setModuleThread:[NSThread currentThread]];
	TitaniumHost * theHost = [TitaniumHost sharedHost];
	[theHost registerThread:self];
	
	id ourObject = [[theHost titaniumObject] valueForKeyPath:objectName];
	id objectResult = nil;
	NSError * error = nil;
	
	if ([ourObject respondsToSelector:@selector(runFunctionNamed:withObject:error:)]){
		objectResult = [ourObject runFunctionNamed:functionName withObject:argList error:&error];
	} else if ([ourObject isKindOfClass:[NSInvocation class]]) {
		NSMethodSignature * ourSig = [ourObject methodSignature];
		NSInvocation * ourInvocation = [NSInvocation invocationWithMethodSignature:ourSig];
		//To preserve the defaults of the invocation, we're hand-copying instead of just slipping it in.
		[ourInvocation setTarget:[ourObject target]];
		[ourInvocation setSelector:[ourObject selector]];
		NSUInteger sigArgCount = [ourSig numberOfArguments]-2;
		NSUInteger jsArgCount = [argList count]; //self and sel are already handled.
		for(NSUInteger currentArgIndex = 0; currentArgIndex < sigArgCount; currentArgIndex++){
			id thisArg;
			if (currentArgIndex < jsArgCount){
				thisArg = [argList objectAtIndex:currentArgIndex];
			} else {
				[ourObject getArgument:&thisArg atIndex:currentArgIndex+2];
			}
			[ourInvocation setArgument:&thisArg atIndex:currentArgIndex+2];
		}
		@try
		{
			if ([[ourObject target] respondsToSelector:@selector(setPageToken:)])
			{
				[[ourObject target] setPageToken:[[theHost currentThread] magicToken] ];
			}
			
			[ourInvocation invoke];
			if ([ourSig methodReturnLength] == sizeof(id)) {
				[ourInvocation getReturnValue:&objectResult];
			}
		}
		@catch (id e) {
			error = e;
		}
	} else {
		error = [NSError errorWithDomain:@"Titanium" code:1 userInfo:nil];
	}
	
	if (error != nil){
		NSLog(@"[ERROR] Error in calling \"%@\" function: \"%@\" args: \"%@\" result: \"%@\" error: \"%@\"",
			  objectName,functionName,argList,objectResult,error);
		[self setModuleResult:[NSString stringWithFormat:@"throw \"%@\";",[error description]]];
	}
	if (objectResult != nil) {
		SBJSON * jasonEncoder = [[SBJSON alloc] init];
		NSString * resultingJavascript = nil;
		if ([objectResult isKindOfClass:[TitaniumJSCode class]]){
			NSString * prelude = CleanJSEnd([objectResult preludeCode]);
			NSString * epilogue = CleanJSEnd([objectResult epilogueCode]);
			resultingJavascript = [[NSString alloc] initWithFormat:@"%@result=%@;%@",prelude,[objectResult valueCode],epilogue];
		} else if ([objectResult isKindOfClass:[NSError class]]) {
			resultingJavascript = [NSString stringWithFormat:@""];//TODO: raise error.
		} else {
			resultingJavascript = [[NSString alloc] initWithFormat:@"result=%@;",
								   [jasonEncoder stringWithFragment:objectResult error:&error]];
		}
		
		if (error != nil){
			NSLog(@"[ERROR] Error in converting result of \"%@\" function: \"%@\" args: \"%@\" result: \"%@\" error: \"%@\"",
				  objectName,functionName,argList,objectResult,error);
		}
		
		[self setModuleResult:resultingJavascript];
		[resultingJavascript release];
		[jasonEncoder release];
	}
	
	[theHost unregisterThread:self];
	[self setModuleThread:nil];
}

#pragma mark Multithreading methods

- (void) multiThreadedDoCommand; //This is the root function of the new thread.
{
	NSAutoreleasePool * ourPool = [[NSAutoreleasePool alloc] init];
	[statusLock lockWhenCondition:TitaniumHasDataForModule];
	
	[self doCommand];
	[statusLock unlockWithCondition:TitaniumHasDataForJavascript];
	[ourPool release];
}

- (NSString *) pauseForJavascriptFetch: (NSString *) javaScriptFunction; //This is called (indirectly) by the module. It sets up the moduleResult and blocks for the foreground thread.
{
	NSString * callbackJavascript = [[NSString alloc] initWithFormat:@"nextURL='/_TICON/%@/?'+Titanium._JSON(%@);",
									 magicToken,javaScriptFunction];
	[self setModuleResult:callbackJavascript];
	[callbackJavascript release];
	
	[statusLock unlockWithCondition:TitaniumHasDataForJavascript];
	[statusLock lockWhenCondition:TitaniumHasDataForModule];
	return javaScriptResult;
}

@end

