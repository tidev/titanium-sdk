/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef DEBUGGER_ENABLED

#import <Foundation/Foundation.h>
#import "TiDebuggerContext.h"
#import "AsyncSocket.h"
#import "TiDebuggerCallFrame.h"

@class KrollContext;

@interface TiDebugger : NSObject
{
	NSMutableArray *contexts;
	BOOL attached;
	BOOL connecting;
	AsyncSocket *socket;
	NSCondition *condition;
	NSCondition *readCondition;
	NSMutableString *pendingReadBuffer;
	RefPtr<Ti::TiDebuggerCallFrame> currentCallFrame;
	Ti::TiDebuggerCallFrame* pauseOnCallFrame;
	BOOL pauseOnNextStatement;
	BOOL pauseOnExceptions;
	BOOL paused;
	BOOL pendingRead;
	NSMutableDictionary *breakpoints;
	NSMutableDictionary *sourceMappings;
}

+(TiDebugger*)sharedDebugger;

-(void)attach:(KrollContext*)context;
-(void)detach:(KrollContext*)context;
-(void)start;
-(void)stop;

-(void)sourceParsed:(NSString*)source 
		   sourceId:(long)sourceId
			context:(KrollContext*)context;

-(void)exception:(const DebuggerCallFrame&)callFrame
		sourceId:(long)sourceId
	  lineNumber:(int)lineNumber
		 context:(KrollContext*)context;

-(void)atStatement:(const DebuggerCallFrame&)callFrame
		sourceId:(long)sourceId
	  lineNumber:(int)lineNumber
		 context:(KrollContext*)context;

-(void)callEvent:(const DebuggerCallFrame&)callFrame
		  sourceId:(long)sourceId
		lineNumber:(int)lineNumber
		   context:(KrollContext*)context;

-(void)returnEvent:(const DebuggerCallFrame&)callFrame
		sourceId:(long)sourceId
	  lineNumber:(int)lineNumber
		 context:(KrollContext*)context;

-(void)willExecuteProgram:(const DebuggerCallFrame&)callFrame
				 sourceId:(long)sourceId
			   lineNumber:(int)lineNumber
				  context:(KrollContext*)context;

-(void)didExecuteProgram:(const DebuggerCallFrame&)callFrame
				 sourceId:(long)sourceId
			   lineNumber:(int)lineNumber
				  context:(KrollContext*)context;

-(void)didReachBreakpoint:(const DebuggerCallFrame&)callFrame
				sourceId:(long)sourceId
			  lineNumber:(int)lineNumber
				 context:(KrollContext*)context;

@end

#endif