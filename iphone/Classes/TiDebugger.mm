/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef DEBUGGER_ENABLED

#import "config.h"
#import "TiBase.h"
#import "TiDebugger.h"
#import "KrollContext.h"
#import "KrollObject.h"
#import "SBJSON.h"
#import "MainThread.h"
#import "PropertyNameArray.h"
#import "TiGlobalObject.h"
#import "TiObject.h"
#import "TiValueRef.h"


#ifndef _QUOTEME
#define _QUOTEME(x) #x
#define STRING(x) _QUOTEME(x)
#endif


@implementation TiDebugger

+(TiDebugger*)sharedDebugger
{
	static TiDebugger *debugger = [[TiDebugger alloc] init];
	return debugger;
}

-(id)init
{
	if (self = [super init])
	{
		pauseOnExceptions = YES; //TODO: make a setter/getter/event
		condition = [[NSCondition alloc] init];
		readCondition = [[NSCondition alloc] init];
		breakpoints = [[NSMutableDictionary dictionary] retain];
		sourceMappings = [[NSMutableDictionary dictionary] retain];
		pendingReadBuffer = [[NSMutableString alloc] initWithCapacity:1024];
	}
	return self;
}

-(void)dealloc
{
	RELEASE_TO_NIL(condition);
	RELEASE_TO_NIL(readCondition);
	RELEASE_TO_NIL(contexts);
	RELEASE_TO_NIL(pendingReadBuffer);
	RELEASE_TO_NIL(breakpoints);
	[super dealloc];
}

-(void)attach:(KrollContext*)context
{
	if (contexts!=nil)
	{
		contexts = [[NSMutableArray alloc] initWithCapacity:2];
	}
	[contexts addObject:context];
}

-(void)detach:(KrollContext*)context
{
	[contexts removeObject:context];
}

-(BOOL)waitForDebugger
{
	[condition lock];
	if (attached==NO)
	{
		[condition waitUntilDate:[NSDate dateWithTimeIntervalSinceNow:15]];
	}
	[condition unlock];
	return attached;
}

-(void)startDebugConnection
{
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	socket = [[AsyncSocket alloc] initWithDelegate:self];
	attached = NO;
	connecting = YES;
	[socket setRunLoopModes:[NSArray arrayWithObject:NSRunLoopCommonModes]];
	NSError *error = nil;
	BOOL result = [socket connectToHost:[NSString stringWithFormat:@"%s",STRING(DEBUGGER_IPADDRESS)] onPort:DEBUGGER_PORT withTimeout:10 error:&error];
	if (error!=nil)
	{
		NSLog(@"[ERROR] Error attaching debugger: %@",[error description]);
	}
	[pool release];
}

-(void)start
{
	//TODO: run this on a separate non-UI thread
	[self startDebugConnection];
}

-(void)stop
{
	[socket disconnect];
	RELEASE_TO_NIL(socket);
	connecting = NO;
	attached = NO;
}

#pragma mark Callbacks

- (void)onSocket:(AsyncSocket *)sock didConnectToHost:(NSString *)host port:(UInt16)port
{
	NSLog(@"[DEBUG] Connected to debugger on %@:%d",host,port);
	[condition lock];
	attached = YES;
	connecting = NO;
	[condition signal];
	[condition unlock];
}

- (void)onSocket:(AsyncSocket *)sock willDisconnectWithError:(NSError *)err
{
	NSLog(@"[ERROR] Error connecting to debugger: %@",err);
	[condition lock];
	attached = NO;
	connecting = NO;
	[condition signal];
	[condition unlock];
	RELEASE_TO_NIL(socket);
}

- (void)onSocketDidDisconnect:(AsyncSocket *)sock
{
	RELEASE_TO_NIL(socket);
	attached = NO;
}

/**
 * Called when a socket has completed reading the requested data into memory.
 * Not called if there is an error.
 **/
- (void)onSocket:(AsyncSocket *)sock didReadData:(NSData *)data withTag:(long)tag
{
	NSString *str = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
	NSLog(@"READ: %@",str);
	[pendingReadBuffer setString:str];
	if (pendingRead)
	{
		[readCondition lock];
		[readCondition signal];
		[readCondition unlock];
	}
	[str release];
}

/**
 * Called when a socket has read in data, but has not yet completed the read.
 * This would occur if using readToData: or readToLength: methods.
 * It may be used to for things such as updating progress bars.
 **/
- (void)onSocket:(AsyncSocket *)sock didReadPartialDataOfLength:(CFIndex)partialLength tag:(long)tag
{
}


#define ENSURE_CONNECTED \
if (connecting==YES) [self waitForDebugger];\
if(attached==NO)return;

-(long)sourceToSourceId:(NSString*)source
{
	return [[sourceMappings objectForKey:source] longValue];
}

-(NSString*)sourceIdToSource:(long)sourceId
{
	return [sourceMappings objectForKey:NUMLONG(sourceId)];
}

-(void)addBreakpoint:(NSString*)source lineNumber:(int)lineNumber
{
	NSNumber* sourceId = NUMLONG([self sourceToSourceId:source]);
	NSMutableDictionary *b = [breakpoints objectForKey:sourceId];
	if (b==nil)
	{
		b = [NSMutableDictionary dictionary];
		[breakpoints setObject:b forKey:sourceId];
	}
	[b setObject:NUMBOOL(YES) forKey:NUMINT(lineNumber)];
}

-(void)removeBreakpoint:(NSString*)source lineNumber:(int)lineNumber
{
	NSNumber* sourceId = NUMLONG([self sourceToSourceId:source]);
	NSMutableDictionary *b = [breakpoints objectForKey:sourceId];
	if (b!=nil)
	{
		[b removeObjectForKey:sourceId];
	}
}

-(void)enableBreakpoint:(NSString*)source lineNumber:(int)lineNumber
{
	NSNumber* sourceId = NUMLONG([self sourceToSourceId:source]);
	NSMutableDictionary *b = [breakpoints objectForKey:sourceId];
	if (b!=nil)
	{
		[b setObject:NUMBOOL(YES) forKey:NUMINT(lineNumber)];
	}
}

-(void)disableBreakpoint:(NSString*)source lineNumber:(int)lineNumber
{
	NSNumber* sourceId = NUMLONG([self sourceToSourceId:source]);
	NSMutableDictionary *b = [breakpoints objectForKey:sourceId];
	if (b!=nil)
	{
		[b setObject:NUMBOOL(NO) forKey:NUMINT(lineNumber)];
	}
}

-(void)clearBreakpoints
{
	if (breakpoints!=nil)
	{
		[breakpoints removeAllObjects];
	}
}

-(BOOL)hasBreakpoint:(long)sourceId lineNumber:(int)lineNumber
{
	NSMutableDictionary *b = [breakpoints objectForKey:NUMLONG(sourceId)];
	if (b!=nil)
	{
		id value = [b objectForKey:NUMINT(lineNumber)];
		if (value!=nil && [value boolValue])
		{
			return YES;
		}
	}
	return NO;
}

-(void)writeData:(NSData*)data
{
	if (socket)
	{
		pendingRead = YES;
		[socket writeData:data withTimeout:10 tag:0];
		NSMutableData *input = [[NSMutableData alloc] initWithCapacity:4096];
		NSTimeInterval timeout = 60 * 5; // 5 minutes?
		[socket readDataToData:[AsyncSocket CRLFData] withTimeout:timeout buffer:input bufferOffset:0 maxLength:4096 tag:0];
		[input release];
	}
}

-(NSData*)evaluate:(NSString*)expression
{
	//FIXME: this isn't working
	NSMutableDictionary *dict = [NSMutableDictionary dictionary];
	if (currentCallFrame)
	{
		TiValue exception;
		UString script;
		script.append([expression UTF8String]);
		TiValue result = currentCallFrame->evaluate(script,exception);
		if (exception)
		{
			UString str = exception.toString(currentCallFrame->scopeChain()->globalObject->globalExec());
			[dict setObject:[NSString stringWithUTF8String:str.UTF8String(false).c_str()] forKey:@"error"];
		}
		else 
		{
			UString str = result.toString(currentCallFrame->scopeChain()->globalObject->globalExec());
			[dict setObject:[NSString stringWithUTF8String:str.UTF8String(false).c_str()] forKey:@"result"];
		}
	}
	else 
	{
		[dict setObject:@"no current call frame" forKey:@"error"];
	}
	NSString *json = [SBJSON stringify:dict];
	return [json dataUsingEncoding:NSUTF8StringEncoding];
}

-(BOOL)handleDebugResponse:(NSDictionary*)dict next:(NSData**)next
{
	NSString *nextOp = [dict objectForKey:@"next"];
	
	if ([nextOp isEqualToString:@"setbreakpoint"])
	{
		[self addBreakpoint:[dict objectForKey:@"source"] lineNumber:[[dict objectForKey:@"line"] intValue]];
	}
	else if ([nextOp isEqualToString:@"removebreakpoint"])
	{
		[self removeBreakpoint:[dict objectForKey:@"source"] lineNumber:[[dict objectForKey:@"line"] intValue]];
	}
	else if ([nextOp isEqualToString:@"enablebreakpoint"])
	{
		[self enableBreakpoint:[dict objectForKey:@"source"] lineNumber:[[dict objectForKey:@"line"] intValue]];
	}
	else if ([nextOp isEqualToString:@"disablebreakpoint"])
	{
		[self disableBreakpoint:[dict objectForKey:@"source"] lineNumber:[[dict objectForKey:@"line"] intValue]];
	}
	else if ([nextOp isEqualToString:@"clearbreakpoints"])
	{
		[self clearBreakpoints];
	}
	else if ([nextOp isEqualToString:@"evaluate"])
	{
		*next = [self evaluate:[dict objectForKey:@"expression"]];
	}
	else if ([nextOp isEqualToString:@"continue"])
	{
		pauseOnNextStatement = false;
	}
	else if ([nextOp isEqualToString:@"stepin"])
	{
		pauseOnNextStatement = true;
	}
	else if ([nextOp isEqualToString:@"stepout"])
	{
		pauseOnCallFrame = currentCallFrame ? currentCallFrame->caller() : 0;
	}
	else if ([nextOp isEqualToString:@"stepover"])
	{
		pauseOnCallFrame = currentCallFrame.get();
	}
	else 
	{
		return NO;
	}
	return YES;
}

-(void)performDebug:(NSString*)send
{
	NSMutableData *data = [NSMutableData data];
	[data setData:[send dataUsingEncoding:NSUTF8StringEncoding]];
	SBJSON *json = [[SBJSON alloc] init];
	BOOL stop = NO;
	
	// this logic allows us to send a debug event, wait for a response,
	// and based on the response, either send more data before continuing
	// or finish and break
	while(stop==NO)
	{
		[self performSelectorOnMainThread:@selector(writeData:) withObject:data waitUntilDone:NO];
		[readCondition lock];
		[readCondition wait];
		pendingRead = NO;
		NSError * error = nil;
		NSLog(@"PENDING JSON %@",pendingReadBuffer);
		NSDictionary * result = [json fragmentWithString:pendingReadBuffer error:&error];
		if (error == nil)
		{
			stop = [self handleDebugResponse:result next:&data];
		}
		else 
		{
			stop = YES;
		}
		[readCondition unlock];
	}
	
	[json release];
}

-(NSMutableDictionary*)generateVariables:(TiObjectRef)objRef context:(KrollContext*)context
{
	NSMutableDictionary *props = [NSMutableDictionary dictionary];
	TiPropertyNameArrayRef propArray = TiObjectCopyPropertyNames([context context],objRef);
	size_t count = TiPropertyNameArrayGetCount(propArray);
	for (size_t c=0;c<count;c++)
	{
		TiStringRef prop = TiPropertyNameArrayGetNameAtIndex(propArray,c);
		size_t len = TiStringGetMaximumUTF8CStringSize(prop);
		char *buf = new char[len];
		TiStringGetUTF8CString(prop,buf,len);
		TiValueRef value = TiObjectGetProperty([context context],objRef,prop,NULL);
		NSMutableDictionary *row = [NSMutableDictionary dictionary];
		[props setObject:row forKey:[NSString stringWithFormat:@"%s",buf]];
		//[row setObject:[KrollObject toID:context value:value] forKey:@"value"];
		switch(TiValueGetType([context context],value))
		{
			case kTITypeUndefined:
				[row setObject:@"undefined" forKey:@"type"];
				break;
			case kTITypeNull:
				[row setObject:@"null" forKey:@"type"];
				break;
			case kTITypeBoolean:
				[row setObject:@"boolean" forKey:@"type"];
				break;
			case kTITypeNumber:
				[row setObject:@"number" forKey:@"type"];
				break;
			case kTITypeString:
				[row setObject:@"string" forKey:@"type"];
				break;
			case kTITypeObject:
				[row setObject:@"object" forKey:@"type"];
				break;
		}
		delete [] buf;
	}
	return props;
}

-(void)transmitEvent:(KrollContext*)context
			   event:(NSString*)event
{
	int lineNumber = currentCallFrame->line();
	long sourceId = currentCallFrame->sourceID();
	NSMutableDictionary *dict = [NSMutableDictionary dictionary];
	[dict setObject:event forKey:@"event"];
	[dict setObject:NUMINT(lineNumber)	forKey:@"lineNumber"];
	[dict setObject:NUMLONG(sourceId)	forKey:@"sourceId"];
	[dict setObject:[context contextId] forKey:@"contextId"];
	
	TiObjectRef globalRef = TiContextGetGlobalObject([context context]);
	[dict setObject:[self generateVariables:globalRef context:context] forKey:@"globals"];


	RefPtr<Ti::TiDebuggerCallFrame> current = currentCallFrame;
	while(current && current->isValid())
	{
		NSLog(@"callframe = %@, %ld %@",current->functionName(),current->sourceID(),[self sourceIdToSource:current->sourceID()]);
		current = current->caller();
	}
	
	
	//[dict setObject:currentCallFrame->functionName() forKey:@"functionName"];
	NSString *json = [SBJSON stringify:dict];
	[self performDebug:json];
}

-(void)pauseIfNeeded:(KrollContext*)context
{
	if (paused)
	{
		return;
	}
	
    bool pauseNow = pauseOnNextStatement;
    pauseNow |= (pauseOnCallFrame == currentCallFrame);
    pauseNow |= (currentCallFrame->line() > 0 && [self hasBreakpoint:currentCallFrame->sourceID() lineNumber:currentCallFrame->line()]);
    if (!pauseNow)
	{
        return;
	}
	
    pauseOnCallFrame = 0;
    pauseOnNextStatement = false;
    paused = true;
	
	setMainThreadCallbacksPaused(true);

	//  dispatchFunctionToListeners(&JavaScriptDebugListener::didPause, page);
	
	long sourceid = currentCallFrame->sourceID();
	int line = currentCallFrame->line();
	[self transmitEvent:context event:@"paused"];
	
    ///TimerBase::fireTimersInNestedEventLoop();
	
	/*
    EventLoop loop;
    m_doneProcessingDebuggerEvents = false;
    while (!m_doneProcessingDebuggerEvents && !loop.ended())
        loop.cycle();
	*/
	
	setMainThreadCallbacksPaused(false);
    paused = false;
	
    //dispatchFunctionToListeners(&JavaScriptDebugListener::didContinue, page);
}

-(void)sourceParsed:(NSString*)source 
		   sourceId:(long)sourceId
			context:(KrollContext*)context
{
	ENSURE_CONNECTED
	
	//FOR NOW THIS IS A HACK
	NSRange range = [source rangeOfString:@".app/"];
	if (range.location!=NSNotFound)
	{
		source = [source substringFromIndex:range.location+5];
	}
	
	[sourceMappings setObject:source forKey:NUMINT(sourceId)];
	[sourceMappings setObject:NUMLONG(sourceId) forKey:source];
/*	
	NSMutableDictionary *dict = [NSMutableDictionary dictionary];
	[dict setObject:PARSE_EVENT forKey:@"event"];
	[dict setObject:source	forKey:@"source"];
	[dict setObject:NUMLONG(sourceId)	forKey:@"sourceId"];
	[dict setObject:[context contextId] forKey:@"contextId"];
*/ 
//	NSString *json = [SBJSON stringify:dict];
//	NSData *data = [json dataUsingEncoding:NSUTF8StringEncoding];
//	NSMutableString *result = [NSMutableString string];
//	NSArray *args = [NSArray arrayWithObjects:data,result,nil];
//	[self performSelectorOnMainThread:@selector(writeData:) withObject:args waitUntilDone:YES];
//	NSLog(@"RESULT = %@",result);
}

-(void)exception:(const DebuggerCallFrame&)callFrame
		sourceId:(long)sourceId
	  lineNumber:(int)lineNumber
		 context:(KrollContext*)context
{
	ENSURE_CONNECTED
	
    if (paused && !currentCallFrame)
    {
		return;
	}

    if (pauseOnExceptions)
	{
        pauseOnNextStatement = true;
	}
	
    currentCallFrame->update(callFrame, sourceId, lineNumber);
    [self pauseIfNeeded:context];
}

-(void)atStatement:(const DebuggerCallFrame&)callFrame
		  sourceId:(long)sourceId
		lineNumber:(int)lineNumber
		   context:(KrollContext*)context
{
	ENSURE_CONNECTED
    if (paused || !currentCallFrame)
	{
        return;
	}
    currentCallFrame->update(callFrame, sourceId, lineNumber);
    [self pauseIfNeeded:context];
}

-(void)callEvent:(const DebuggerCallFrame&)callFrame
		sourceId:(long)sourceId
	  lineNumber:(int)lineNumber
		 context:(KrollContext*)context
{
	ENSURE_CONNECTED
    if (paused)
	{
        return;
	}
    currentCallFrame = Ti::TiDebuggerCallFrame::create(callFrame, currentCallFrame, sourceId, lineNumber);
	[self pauseIfNeeded:context];
}

-(void)returnEvent:(const DebuggerCallFrame&)callFrame
		  sourceId:(long)sourceId
		lineNumber:(int)lineNumber
		   context:(KrollContext*)context
{
	ENSURE_CONNECTED
    if (paused || !currentCallFrame)
	{
        return;
	}
    currentCallFrame->update(callFrame, sourceId, lineNumber);
    [self pauseIfNeeded:context];
	
    // Treat stepping over a return statement like stepping out.
    if (currentCallFrame == pauseOnCallFrame)
	{
        pauseOnCallFrame = currentCallFrame->caller();
	}
    currentCallFrame = currentCallFrame->caller();
}

-(void)willExecuteProgram:(const DebuggerCallFrame&)callFrame
				 sourceId:(long)sourceId
			   lineNumber:(int)lineNumber
				  context:(KrollContext*)context
{
	ENSURE_CONNECTED
    currentCallFrame = Ti::TiDebuggerCallFrame::create(callFrame, currentCallFrame, sourceId, lineNumber);
}

-(void)didExecuteProgram:(const DebuggerCallFrame&)callFrame
				sourceId:(long)sourceId
			  lineNumber:(int)lineNumber
				 context:(KrollContext*)context
{
	ENSURE_CONNECTED
	
    if (!currentCallFrame)
	{
        return;
	}
	
    currentCallFrame->update(callFrame, sourceId, lineNumber);
    [self pauseIfNeeded:context];
	
    // Treat stepping over the end of a program like stepping out.
    if (currentCallFrame == pauseOnCallFrame)
	{
        pauseOnCallFrame = currentCallFrame->caller();
	}
	currentCallFrame = currentCallFrame->caller();
}

-(void)didReachBreakpoint:(const DebuggerCallFrame&)callFrame
				 sourceId:(long)sourceId
			   lineNumber:(int)lineNumber
				  context:(KrollContext*)context
{
	ENSURE_CONNECTED
	
	if (!currentCallFrame)
	{
        return;
	}
	
    pauseOnNextStatement = true;
    currentCallFrame->update(callFrame, sourceId, lineNumber);
    [self pauseIfNeeded:context];
}

@end

#endif