/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"
#import "KrollContext.h"
#import "KrollObject.h"
#import "KrollTimer.h"
#import "KrollCallback.h"
#import "TiUtils.h"
#import "TiLocale.h"

#include <pthread.h>
#import "TiDebugger.h"

#import "TiUIAlertDialogProxy.h"

#ifdef KROLL_COVERAGE
# import "KrollCoverage.h"
#endif

static unsigned short KrollContextIdCounter = 0;
static unsigned short KrollContextCount = 0;

static pthread_mutex_t KrollEntryLock;

@implementation KrollUnprotectOperation

-(id)initWithContext: (TiContextRef)newContext withJsobject: (TiObjectRef) newFirst
{
	return [self initWithContext:newContext withJsobject:newFirst andJsobject:NULL];
}

-(id)initWithContext: (TiContextRef)newContext withJsobject: (TiObjectRef) newFirst andJsobject: (TiObjectRef) newSecond
{
	self = [super init];
	if (self != nil)
	{
		jsContext = newContext;
		firstObject = newFirst;
		secondObject = newSecond;
	}
	return self;
}

-(void)main
{
	TiValueUnprotect(jsContext, firstObject);
	if(secondObject != NULL)
	{
		TiValueUnprotect(jsContext, secondObject);
	}
}

@end

@implementation KrollInvocation

-(id)initWithTarget:(id)target_ method:(SEL)method_ withObject:(id)obj_ condition:(NSCondition*)condition_
{
	if (self = [super init])
	{
		target = [target_ retain];
		method = method_;
		obj = [obj_ retain];
		condition = [condition_ retain];
	}
	return self;
}

-(id)initWithTarget:(id)target_ method:(SEL)method_ withObject:(id)obj_ callback:(id)callback_ selector:(SEL)selector_
{
	if (self = [super init])
	{
		target = [target_ retain];
		method = method_;
		obj = [obj_ retain];
		notify = [callback_ retain];
		notifySelector = selector_;
	}
	return self;
}

-(void)dealloc
{
	[target release];
	[obj release];
	[condition release];
	[notify release];
	[super dealloc];
}

-(void)invoke:(KrollContext*)context
{
    pthread_mutex_lock(&KrollEntryLock);
    
    @try {
        if (target!=nil)
        {
            [target performSelector:method withObject:obj withObject:context];
        }
        if (condition!=nil)
        {
            [condition lock];
            [condition signal];
            [condition unlock];
        }
        if (notify!=nil)
        {
            [notify performSelector:notifySelector];
        }
    }
    @catch (NSException* e) {
        @throw e;
    }
    @finally {
        pthread_mutex_unlock(&KrollEntryLock);
    }
}

@end

TiValueRef ThrowException (TiContextRef ctx, NSString *message, TiValueRef *exception)
{
	TiStringRef jsString = TiStringCreateWithCFString((CFStringRef)message);
	*exception = TiValueMakeString(ctx,jsString);
	TiStringRelease(jsString);
	return TiValueMakeUndefined(ctx);
}

static TiValueRef MakeTimer(TiContextRef context, TiObjectRef jsFunction, TiValueRef fnRef, TiObjectRef jsThis, TiValueRef durationRef, BOOL onetime)
{
    static dispatch_once_t timerInitializer;
    static NSLock *timerIDLock = nil;
    dispatch_once(&timerInitializer, ^{
        timerIDLock = [[NSLock alloc] init];
    });

	static double kjsNextTimer = 0;
	
    [timerIDLock lock];
	double timerID = ++kjsNextTimer;
	[timerIDLock unlock];
	
	KrollContext *ctx = GetKrollContext(context);
	TiGlobalContextRef globalContext = TiContextGetGlobalContext(context);
	TiValueRef exception = NULL;
	double duration = TiValueToNumber(context, durationRef, &exception);
	if (exception!=NULL)
	{
		DebugLog(@"[ERROR] Conversion of timer duration to number failed.");
        return TiValueMakeUndefined(context);
	}
	KrollTimer *timer = [[KrollTimer alloc] initWithContext:globalContext function:fnRef jsThis:jsThis duration:duration onetime:onetime kroll:ctx timerId:timerID];
	[ctx registerTimer:timer timerId:timerID];
	[timer start];
	[timer release];
	return TiValueMakeNumber(context, timerID);
}

static TiValueRef ClearTimerCallback (TiContextRef jsContext, TiObjectRef jsFunction, TiObjectRef jsThis, size_t argCount,
									  const TiValueRef args[], TiValueRef* exception)
{
#ifdef KROLL_COVERAGE
	[KrollCoverageObject incrementTopLevelFunctionCall:TOP_LEVEL name:@"clearTimer"];
#endif

	if (argCount!=1)
	{
		return ThrowException(jsContext, @"invalid number of arguments", exception);
	}

	KrollContext *ctx = GetKrollContext(jsContext);
	[ctx unregisterTimer:TiValueToNumber(jsContext,args[0],NULL)];

	return TiValueMakeUndefined(jsContext);
}	
static TiValueRef SetIntervalCallback (TiContextRef jsContext, TiObjectRef jsFunction, TiObjectRef jsThis, size_t argCount,
									   const TiValueRef args[], TiValueRef* exception)
{
#ifdef KROLL_COVERAGE
	[KrollCoverageObject incrementTopLevelFunctionCall:TOP_LEVEL name:@"setInterval"];
#endif

	//NOTE: function can be either Function or String object type
	if (argCount!=2)
	{
		return ThrowException(jsContext, @"invalid number of arguments", exception);
	}
	
	TiValueRef fnRef = args[0];
	TiValueRef durationRef = args[1];
	
	return MakeTimer(jsContext, jsFunction, fnRef, jsThis, durationRef, NO);
}

static TiValueRef SetTimeoutCallback (TiContextRef jsContext, TiObjectRef jsFunction, TiObjectRef jsThis, size_t argCount,
									  const TiValueRef args[], TiValueRef* exception)
{
#ifdef KROLL_COVERAGE
	[KrollCoverageObject incrementTopLevelFunctionCall:TOP_LEVEL name:@"setTimeout"];
#endif

	if (argCount!=2)
	{
		return ThrowException(jsContext, @"invalid number of arguments", exception);
	}
	
	TiValueRef fnRef = args[0];
	TiValueRef durationRef = args[1];
	
	return MakeTimer(jsContext, jsFunction, fnRef, jsThis, durationRef, YES);
}

static TiValueRef CommonJSRequireCallback (TiContextRef jsContext, TiObjectRef jsFunction, TiObjectRef jsThis, size_t argCount,
									  const TiValueRef args[], TiValueRef* exception)
{
#ifdef KROLL_COVERAGE
	[KrollCoverageObject incrementTopLevelFunctionCall:TOP_LEVEL name:@"require"];
#endif

	if (argCount!=1)
	{
		return ThrowException(jsContext, @"invalid number of arguments", exception);
	}
	
	KrollContext *ctx = GetKrollContext(jsContext);
	id path = [KrollObject toID:ctx value:args[0]];
	@try 
	{
		id result = [ctx.delegate require:ctx path:path];
		return [KrollObject toValue:ctx value:result];
	}
	@catch (NSException * e) 
	{
		return ThrowException(jsContext, [e reason], exception);
	}
}	

static TiValueRef LCallback (TiContextRef jsContext, TiObjectRef jsFunction, TiObjectRef jsThis, size_t argCount,
										   const TiValueRef args[], TiValueRef* exception)
{
#ifdef KROLL_COVERAGE
	[KrollCoverageObject incrementTopLevelFunctionCall:TOP_LEVEL name:@"L"];
#endif

	if (argCount<1)
	{
		return ThrowException(jsContext, @"invalid number of arguments", exception);
	}
	
	KrollContext *ctx = GetKrollContext(jsContext);
	NSString* key = [KrollObject toID:ctx value:args[0]];
	NSString* comment = argCount > 1 ? [KrollObject toID:ctx value:args[1]] : nil;
	@try 
	{
		id result = [TiLocale getString:key comment:comment];
		return [KrollObject toValue:ctx value:result];
	}
	@catch (NSException * e) 
	{
		return ThrowException(jsContext, [e reason], exception);
	}
}	

static TiValueRef AlertCallback (TiContextRef jsContext, TiObjectRef jsFunction, TiObjectRef jsThis, size_t argCount,
                                 const TiValueRef args[], TiValueRef* exception)
{
#ifdef KROLL_COVERAGE
    [KrollCoverageObject incrementTopLevelFunctionCall:TOP_LEVEL name:@"alert"];
#endif
    
    if (argCount < 1) {
        return ThrowException(jsContext, @"invalid number of arguments", exception);
    }
    
    KrollContext* ctx = GetKrollContext(jsContext);
    NSString* message = [KrollObject toID:ctx value:args[0]];
    
    TiUIAlertDialogProxy* alert = [[[TiUIAlertDialogProxy alloc] _initWithPageContext:(id<TiEvaluator>)[ctx delegate] args:nil] autorelease];
    [alert setValue:@"Alert" forKey:@"title"];
    [alert setValue:message forKey:@"message"];
    [alert show:nil];
    
    return TiValueMakeUndefined(jsContext);
}

static TiValueRef StringFormatCallback (TiContextRef jsContext, TiObjectRef jsFunction, TiObjectRef jsThis, size_t argCount,
							 const TiValueRef args[], TiValueRef* exception)
{
#ifdef KROLL_COVERAGE
	[KrollCoverageObject incrementTopLevelFunctionCall:@"String" name:@"format"];
#endif

	if (argCount<2)
	{
		return ThrowException(jsContext, @"invalid number of arguments", exception);
	}
	
	KrollContext *ctx = GetKrollContext(jsContext);
	NSString* format = [KrollObject toID:ctx value:args[0]];
	
	// convert string references to objects
	format = [format stringByReplacingOccurrencesOfString:@"%s" withString:@"%@"];
	format = [format stringByReplacingOccurrencesOfString:@"%1$s" withString:@"%1$@"];
	format = [format stringByReplacingOccurrencesOfString:@"%2$s" withString:@"%2$@"];
	format = [format stringByReplacingOccurrencesOfString:@"%3$s" withString:@"%3$@"];
	format = [format stringByReplacingOccurrencesOfString:@"%4$s" withString:@"%4$@"];
	format = [format stringByReplacingOccurrencesOfString:@"%5$s" withString:@"%5$@"];
	format = [format stringByReplacingOccurrencesOfString:@"%6$s" withString:@"%6$@"];
	format = [format stringByReplacingOccurrencesOfString:@"%7$s" withString:@"%7$@"];
	format = [format stringByReplacingOccurrencesOfString:@"%8$s" withString:@"%8$@"];
	format = [format stringByReplacingOccurrencesOfString:@"%9$s" withString:@"%9$@"];
	// we're dealing with double, so convert so that it formats right 
	format = [format stringByReplacingOccurrencesOfString:@"%d" withString:@"%1.0f"];
	format = [format stringByReplacingOccurrencesOfString:@"%1$d" withString:@"%1$1.0f"];
	format = [format stringByReplacingOccurrencesOfString:@"%2$d" withString:@"%2$1.0f"];
	format = [format stringByReplacingOccurrencesOfString:@"%3$d" withString:@"%3$1.0f"];
	format = [format stringByReplacingOccurrencesOfString:@"%4$d" withString:@"%4$1.0f"];
	format = [format stringByReplacingOccurrencesOfString:@"%5$d" withString:@"%5$1.0f"];
	format = [format stringByReplacingOccurrencesOfString:@"%6$d" withString:@"%6$1.0f"];
	format = [format stringByReplacingOccurrencesOfString:@"%7$d" withString:@"%7$1.0f"];
	format = [format stringByReplacingOccurrencesOfString:@"%8$d" withString:@"%8$1.0f"];
	format = [format stringByReplacingOccurrencesOfString:@"%9$d" withString:@"%9$1.0f"];
	
	@try 
	{
		int size = 0;
		// we have to walk each type to detect the right size and alignment
		for (size_t x = 1; x < argCount; x++)
		{
			TiValueRef valueRef = args[x];
			if (TiValueIsString(jsContext,valueRef)||TiValueIsObject(jsContext, valueRef))
			{
				size+=sizeof(id);
			}
			else if (TiValueIsNumber(jsContext, valueRef))
			{
				size+=sizeof(double);
			}
			else if (TiValueIsBoolean(jsContext, valueRef))
			{
				size+=sizeof(bool);
			}
		}
		char* argList = (char *)malloc(size);
		char* bm = argList; // copy pointer since we move the other forward
		for (size_t x = 1; x < argCount; x++)
		{
			TiValueRef valueRef = args[x];
			if (TiValueIsString(jsContext,valueRef)||TiValueIsObject(jsContext, valueRef))
			{
				(*(id*)argList) = [KrollObject toID:ctx value:valueRef];
				argList += sizeof(id);
			}
			else if (TiValueIsNumber(jsContext, valueRef))
			{
				(*(double*)argList) = TiValueToNumber(jsContext, valueRef, NULL);
				argList += sizeof(double);
			}
			else if (TiValueIsBoolean(jsContext, valueRef))
			{
				(*(bool*)argList) = TiValueToBoolean(jsContext,valueRef);
				argList += sizeof(bool);
			}
		}
		NSString* result = [[NSString alloc] initWithFormat:format arguments:bm];
		TiValueRef value = [KrollObject toValue:ctx value:result];
		free(bm);
		[result release];
		return value;
	}
	@catch (NSException * e) 
	{
		return ThrowException(jsContext, [e reason], exception);
	}
}	

static TiValueRef StringFormatDateCallback (TiContextRef jsContext, TiObjectRef jsFunction, TiObjectRef jsThis, size_t argCount,
										const TiValueRef args[], TiValueRef* exception)
{
#ifdef KROLL_COVERAGE
	[KrollCoverageObject incrementTopLevelFunctionCall:@"String" name:@"formatDate"];
#endif

	if (argCount<1)
	{
		return ThrowException(jsContext, @"invalid number of arguments", exception);
	}
	
	KrollContext *ctx = GetKrollContext(jsContext);
	NSDate* date = [KrollObject toID:ctx value:args[0]];
	NSDateFormatterStyle style = NSDateFormatterShortStyle;
	
	if (argCount>1)
	{
		NSString *s = [KrollObject toID:ctx value:args[1]];
		if ([s isEqualToString:@"short"])
		{
			// default
		}
		else if ([s isEqualToString:@"medium"])
		{
			style = NSDateFormatterMediumStyle;
		}
		else if ([s isEqualToString:@"long"])
		{
			style = NSDateFormatterLongStyle;
		}
	}
	
	@try 
	{
		NSString* result = [NSDateFormatter localizedStringFromDate:date dateStyle:style timeStyle:NSDateFormatterNoStyle];
		TiValueRef value = [KrollObject toValue:ctx value:result];
		return value;
	}
	@catch (NSException * e) 
	{
		return ThrowException(jsContext, [e reason], exception);
	}
}	

static TiValueRef StringFormatTimeCallback (TiContextRef jsContext, TiObjectRef jsFunction, TiObjectRef jsThis, size_t argCount,
											const TiValueRef args[], TiValueRef* exception)
{
#ifdef KROLL_COVERAGE
	[KrollCoverageObject incrementTopLevelFunctionCall:@"String" name:@"formatTime"];
#endif

	if (argCount<1)
	{
		return ThrowException(jsContext, @"invalid number of arguments", exception);
	}
	
	KrollContext *ctx = GetKrollContext(jsContext);
	NSDate* date = [KrollObject toID:ctx value:args[0]];
	NSDateFormatterStyle style = NSDateFormatterShortStyle;
	
	if (argCount>1)
	{
		NSString *s = [KrollObject toID:ctx value:args[1]];
		if ([s isEqualToString:@"short"])
		{
			// default
		}
		else if ([s isEqualToString:@"medium"])
		{
			style = NSDateFormatterMediumStyle;
		}
		else if ([s isEqualToString:@"long"])
		{
			style = NSDateFormatterLongStyle;
		}
	}
	
	@try 
	{
		NSString* result = [NSDateFormatter localizedStringFromDate:date dateStyle:NSDateFormatterNoStyle timeStyle:style];
		TiValueRef value = [KrollObject toValue:ctx value:result];
		return value;
	}
	@catch (NSException * e) 
	{
		return ThrowException(jsContext, [e reason], exception);
	}
}	

static TiValueRef StringFormatCurrencyCallback (TiContextRef jsContext, TiObjectRef jsFunction, TiObjectRef jsThis, size_t argCount,
											const TiValueRef args[], TiValueRef* exception)
{
#ifdef KROLL_COVERAGE
	[KrollCoverageObject incrementTopLevelFunctionCall:@"String" name:@"formatCurrency"];
#endif

	if (argCount<1)
	{
		return ThrowException(jsContext, @"invalid number of arguments", exception);
	}
	
	KrollContext *ctx = GetKrollContext(jsContext);
	NSNumber* number = [KrollObject toID:ctx value:args[0]];
	
	@try 
	{
		NSString* result = [NSNumberFormatter localizedStringFromNumber:number numberStyle:NSNumberFormatterCurrencyStyle];
		TiValueRef value = [KrollObject toValue:ctx value:result];
		return value;
	}
	@catch (NSException * e) 
	{
		return ThrowException(jsContext, [e reason], exception);
	}
}	

static TiValueRef StringFormatDecimalCallback (TiContextRef jsContext, TiObjectRef jsFunction, TiObjectRef jsThis, size_t argCount,
												const TiValueRef args[], TiValueRef* exception)
{
#ifdef KROLL_COVERAGE
	[KrollCoverageObject incrementTopLevelFunctionCall:@"String" name:@"formatDecimal"];
#endif

	if (argCount<1)
	{
		return ThrowException(jsContext, @"invalid number of arguments", exception);
	}
	
	KrollContext *ctx = GetKrollContext(jsContext);
	NSNumber* number = [KrollObject toID:ctx value:args[0]];
	
	@try 
	{
		NSString* result;
		NSLocale* locale = nil;
		NSString* formatString = nil;
		if (argCount > 1) 
		{
			NSString* arg = [KrollObject toID:ctx value:args[1]];
			if ([arg rangeOfCharacterFromSet:[NSCharacterSet characterSetWithCharactersInString:@"0#.,"]].location != NSNotFound) {
				formatString = arg;
			}
			else {
				locale = [[[NSLocale alloc] initWithLocaleIdentifier:arg] autorelease];
			}
		}
		// If locale is nil, either: Single argument, or the second arg is format string and not locale ID.
		if (locale == nil) {
			locale = [NSLocale currentLocale];
		}
		
		NSNumberFormatter* formatter = [[[NSNumberFormatter alloc] init] autorelease];
		
		[formatter setLocale:locale];
		[formatter setNumberStyle:NSNumberFormatterDecimalStyle];

		// Format handling to match the extremely vague android specs
		if (argCount == 3)
		{
			formatString = [KrollObject toID:ctx value:args[2]];
		}
		
		if (formatString != nil) {
			NSArray* formats = [formatString componentsSeparatedByString:@";"];
			[formatter setPositiveFormat:[formats objectAtIndex:0]];
			if ([formats count] > 1) {
				[formatter setNegativeFormat:[formats objectAtIndex:1]];
			}
			else {
				[formatter setNegativeFormat:[formats objectAtIndex:0]];
			}
		}
		
		result = [formatter stringFromNumber:number];			

		TiValueRef value = [KrollObject toValue:ctx value:result];
		return value;
	}
	@catch (NSException * e) 
	{
		return ThrowException(jsContext, [e reason], exception);
	}
}	


@implementation KrollEval

-(id)initWithCode:(NSString*)code_
{
	if (self = [super init])
	{
		code = [code_ copy];
	}
	return self;
}
-(void)dealloc
{
	[code release];
	[super dealloc];
}

-(TiValueRef) jsInvokeInContext: (KrollContext*)context exception: (TiValueRef *)exceptionPointer
{
    pthread_mutex_lock(&KrollEntryLock);
	TiStringRef js = TiStringCreateWithCFString((CFStringRef) code);
	TiObjectRef global = TiContextGetGlobalObject([context context]);
	
	TiValueRef result = TiEvalScript([context context], js, global, NULL, 1, exceptionPointer);
		
	TiStringRelease(js);
    pthread_mutex_unlock(&KrollEntryLock);
	
	return result;
}

-(void)invoke:(KrollContext*)context
{
    pthread_mutex_lock(&KrollEntryLock);
	TiValueRef exception = NULL;
	[self jsInvokeInContext:context exception:&exception];

	if (exception!=NULL)
	{
		id excm = [KrollObject toID:context value:exception];
		DebugLog(@"[ERROR] Script Error = %@",[TiUtils exceptionMessage:excm]);
		fflush(stderr);
	}
    pthread_mutex_unlock(&KrollEntryLock);
}

-(id)invokeWithResult:(KrollContext*)context
{
    pthread_mutex_lock(&KrollEntryLock);
	TiValueRef exception = NULL;
	TiValueRef result = [self jsInvokeInContext:context exception:&exception];
	
	if (exception!=NULL)
	{
		id excm = [KrollObject toID:context value:exception];
		DebugLog(@"[ERROR] Script Error = %@",[TiUtils exceptionMessage:excm]);
		fflush(stderr);
        
        pthread_mutex_unlock(&KrollEntryLock);
		@throw excm;
	}
    pthread_mutex_unlock(&KrollEntryLock);
    
	return [KrollObject toID:context value:result];
}

@end

@implementation KrollEvent

-(id)initWithType:(NSString *)newType ForKrollObject:(KrollObject*)newCallbackObject eventObject:(NSDictionary*)newEventObject thisObject:(id)newThisObject;
{
	if (self = [super init])
	{
		type = [newType copy];
		callbackObject = [newCallbackObject retain];
		eventObject = [newEventObject retain];
		thisObject = [newThisObject retain];
	}
	return self;
}

-(id)initWithCallback:(KrollCallback*)newCallback eventObject:(NSDictionary*)newEventObject thisObject:(id)newThisObject
{
	if (self = [super init])
	{
		callback = [newCallback retain];
		eventObject = [newEventObject retain];
		thisObject = [newThisObject retain];
	}
	return self;
}


-(void)dealloc
{
    [callback release];
	[type release];
	[thisObject release];
	[callbackObject release];
	[eventObject release];
	[super dealloc];
}
-(void)invoke:(KrollContext*)context
{
    pthread_mutex_lock(&KrollEntryLock);
	if(callbackObject != nil)
	{
		[callbackObject triggerEvent:type withObject:eventObject thisObject:thisObject];
	}

	if(callback != nil)
	{
		[callback call:[NSArray arrayWithObject:eventObject] thisObject:thisObject];
	}
    pthread_mutex_unlock(&KrollEntryLock);
}
@end


@implementation KrollContext

@synthesize delegate;

+(void)initialize
{
	if(self == [KrollContext class])
	{
        pthread_mutexattr_t entryLockAttrs; 
        pthread_mutexattr_init(&entryLockAttrs);
        pthread_mutexattr_settype(&entryLockAttrs, PTHREAD_MUTEX_RECURSIVE);
		pthread_mutex_init(&KrollEntryLock, &entryLockAttrs);
	}
}

-(NSString*)threadName
{
	return [NSString stringWithFormat:@"KrollContext<%@>",contextId];
}

-(id)init
{
	if (self = [super init])
	{
#if CONTEXT_MEMORY_DEBUG==1
		NSLog(@"[DEBUG] INIT: %@",self);
#endif
		contextId = [[NSString stringWithFormat:@"kroll$%d",++KrollContextIdCounter] copy];
		condition = [[NSCondition alloc] init];
		queue = [[NSMutableArray alloc] init];
		timerLock = [[NSRecursiveLock alloc] init];
		[timerLock setName:[NSString stringWithFormat:@"%@ Timer Lock",[self threadName]]];
		lock = [[NSRecursiveLock alloc] init];
		[lock setName:[NSString stringWithFormat:@"%@ Lock",[self threadName]]];
		stopped = YES;
		KrollContextCount++;
        debugger = NULL;
		
		WARN_IF_BACKGROUND_THREAD_OBJ;	//NSNotificationCenter is not threadsafe!
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(suspend:) name:kTiSuspendNotification object:nil];
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(resume:) name:kTiResumeNotification object:nil];
	}
	return self;
}

-(void)destroy
{
#if CONTEXT_MEMORY_DEBUG==1
	NSLog(@"[DEBUG] DESTROY: %@",self);
#endif
	[self stop];
	RELEASE_TO_NIL(condition);
	if (queue!=nil)
	{
		[queue removeAllObjects];
	}		
	RELEASE_TO_NIL(queue);
	RELEASE_TO_NIL(contextId);
	if (timerLock!=nil)
	{
		[timerLock lock];
		if (timers!=nil)
		{
			[timers removeAllObjects];
		}
		[timerLock unlock];
	}
	RELEASE_TO_NIL(timers);
	RELEASE_TO_NIL(lock);
	RELEASE_TO_NIL(timerLock);
}

#if CONTEXT_MEMORY_DEBUG==1
-(id)retain
{
	NSLog(@"[DEBUG] RETAIN: %@ (%d)",self,[self retainCount]+1);
	return [super retain];
}
-(oneway void)release 
{
	NSLog(@"[DEBUG] RELEASE: %@ (%d)",self,[self retainCount]-1);
	[super release]; 
}
#endif

-(void)unregisterForNotifications
{
	WARN_IF_BACKGROUND_THREAD_OBJ;	//NSNotificationCenter is not threadsafe!
	[[NSNotificationCenter defaultCenter] removeObserver:self];
}

-(void)dealloc
{
#if CONTEXT_MEMORY_DEBUG==1
	NSLog(@"[DEBUG] DEALLOC: %@",self);
#endif
	assert(!destroyed);
	destroyed = YES;
	[self destroy];
	KrollContextCount--;
	[super dealloc];
}

-(NSString*)contextId
{
	return [[contextId retain] autorelease];
}

-(void)registerTimer:(id)timer timerId:(double)timerId
{
	[timerLock lock];
	if (timers==nil)
	{
		timers = [[NSMutableDictionary alloc] init];
	}
	NSString *key = [[NSNumber numberWithDouble:timerId] stringValue];
	[timers setObject:timer forKey:key];
	[timerLock unlock];
}

-(void)unregisterTimer:(double)timerId
{
	[timerLock lock];
	if (timers!=nil)
	{
		NSString *timer = [[NSNumber numberWithDouble:timerId] stringValue];
		KrollTimer *t = [timers objectForKey:timer];
		if (t!=nil)
		{
			[[t retain] autorelease];
			[timers removeObjectForKey:timer];
			[t cancel];
		}
		if ([timers count]==0)
		{
			// don't waste memory if we don't have any timers
			RELEASE_TO_NIL(timers);
		}
	}
	[timerLock unlock];
}

-(void)start
{
	if (stopped!=YES)
	{
		@throw [NSException exceptionWithName:@"org.appcelerator.kroll" 
									   reason:@"already started"
									 userInfo:nil];
	}
	stopped = NO;
	[NSThread detachNewThreadSelector:@selector(main) toTarget:self withObject:nil];
}

-(void)stop
{
	if (stopped == NO)
	{
		[condition lock];
		stopped = YES;
		if (debugger!=NULL)
		{
			TiObjectRef globalRef = TiContextGetGlobalObject(context);
			TiDebuggerDestroy(self,globalRef,debugger);
			debugger = NULL;
		}
		[condition signal];
		[condition unlock];
	}
}

- (void)suspend:(id)note
{
	[condition lock];
	VerboseLog(@"Will suspend %@ %@",self,CODELOCATION);
	suspended = YES;
	VerboseLog(@"Did suspend %@ %@",self,CODELOCATION);
	[condition unlock];
}

- (void)resume:(id)note
{
	[condition lock];
	VerboseLog(@"Will resume-signalling %@ %@",self,CODELOCATION);
	suspended = NO;
	VerboseLog(@"Did resume; signalling %@ %@",self,CODELOCATION);
	[condition signal];
	[condition unlock];
}

-(BOOL)running
{
	return stopped==NO;
}

-(TiGlobalContextRef)context
{
	return context;
}

#ifdef DEBUG
-(int)queueCount
{
	return [queue count];
}
#endif


-(BOOL)isKJSThread
{
#if 1
	return (cachedThreadId == [NSThread currentThread] ? YES : NO);
#else
	NSString *name = [[NSThread currentThread] name];
	return [name isEqualToString:[self threadName]];
#endif
}

-(void)invoke:(id)object
{
	pthread_mutex_lock(&KrollEntryLock);
	if([object isKindOfClass:[NSOperation class]])
	{
		[(NSOperation *)object start];
		pthread_mutex_unlock(&KrollEntryLock);
		return;
	}

	[object invoke:self];
	pthread_mutex_unlock(&KrollEntryLock);
}

-(void)enqueue:(id)obj
{
	[condition lock];

	BOOL mythread = [self isKJSThread];
	
	if (!mythread) 
	{
		[lock lock];
	}
	
	[queue addObject:obj];
	
	if (!mythread)
	{
		[lock unlock];
		[condition signal];
	}
	
	[condition unlock];
}

-(void)evalJS:(NSString*)code
{
	KrollEval *eval = [[[KrollEval alloc] initWithCode:code] autorelease];
	if ([self isKJSThread])
	{	
		[eval invoke:self];
		return;
	}
	[self enqueue:eval];
}

-(id)evalJSAndWait:(NSString*)code
{
	if (![self isKJSThread])
	{
		DeveloperLog(@"[ERROR] attempted to evaluate JS and not on correct Thread! Aborting!");
		@throw @"Invalid Thread Access";
	}
	KrollEval *eval = [[[KrollEval alloc] initWithCode:code] autorelease];
	return [eval invokeWithResult:self];
}

-(void)invokeOnThread:(id)callback_ method:(SEL)method_ withObject:(id)obj condition:(NSCondition*)condition_
{
	KrollInvocation *invocation = [[[KrollInvocation alloc] initWithTarget:callback_ method:method_ withObject:obj condition:condition_] autorelease];
	if ([self isKJSThread])
	{
		[invocation invoke:self];
		return;
	}
	[self enqueue:invocation];
}

-(void)invokeOnThread:(id)callback_ method:(SEL)method_ withObject:(id)obj callback:(id)callback selector:(SEL)selector_
{
	KrollInvocation *invocation = [[[KrollInvocation alloc] initWithTarget:callback_ method:method_ withObject:obj callback:callback selector:selector_] autorelease];
	if ([self isKJSThread])
	{
		[invocation invoke:self];
		return;
	}
	[self enqueue:invocation];
}

-(void)invokeBlockOnThread:(void (^)())block
{
    if ([self isKJSThread]) {
        pthread_mutex_lock(&KrollEntryLock);
        block();
        pthread_mutex_unlock(&KrollEntryLock);
        return;
    }
    NSBlockOperation* blockOp = [NSBlockOperation blockOperationWithBlock:block];
    [self enqueue:blockOp];
}

- (void)bindCallback:(NSString*)name callback:(TiObjectCallAsFunctionCallback)fn
{
	// create the invoker bridge
	TiStringRef invokerFnName = TiStringCreateWithCFString((CFStringRef) name);
	TiValueRef invoker = TiObjectMakeFunctionWithCallback(context, invokerFnName, fn);
	if (invoker)
	{
		TiObjectRef global = TiContextGetGlobalObject(context); 
		TiObjectSetProperty(context, global,   
							invokerFnName, invoker,   
							kTiPropertyAttributeReadOnly | kTiPropertyAttributeDontDelete,   
							NULL); 
	}
	TiStringRelease(invokerFnName);	
}

-(void)gc
{
	// don't worry about locking, not that important
	gcrequest = YES;
	
	// signal the waiting thread to wake up - since this
	// is called on a possible low memory condition, we 
	// need to immediately force the thread to wake up
	// and collect garbage asap
	[condition lock];
	[condition signal];
	[condition unlock];
}

-(int)forceGarbageCollectNow
{
	NSAutoreleasePool * garbagePool = [[NSAutoreleasePool alloc] init];
#if CONTEXT_DEBUG == 1	
	NSLog(@"[DEBUG] CONTEXT<%@>: forced garbage collection requested",self);
#endif
	pthread_mutex_lock(&KrollEntryLock);
	TiGarbageCollect(context);
	pthread_mutex_unlock(&KrollEntryLock);
	gcrequest = NO;
	loopCount = 0;
	[garbagePool drain];
	return 0;
}

-(void)main
{

    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	[[NSThread currentThread] setName:[self threadName]];
	cachedThreadId = [NSThread currentThread];
	pthread_mutex_lock(&KrollEntryLock);
//	context = TiGlobalContextCreateInGroup([TiApp contextGroup],NULL);
	context = TiGlobalContextCreate(NULL);
	TiObjectRef globalRef = TiContextGetGlobalObject(context);
	
    incrementKrollCounter();

    // TODO: We might want to be smarter than this, and do some KVO on the delegate's
    // 'debugMode' property or something... and start/stop the debugger as necessary.
    if ([[self delegate] shouldDebugContext]) {
        debugger = TiDebuggerCreate(self,globalRef);
    }
	
	// we register an empty kroll string that allows us to pluck out this instance
	KrollObject *kroll = [[KrollObject alloc] initWithTarget:nil context:self];
	TiValueRef krollRef = [KrollObject toValue:self value:kroll];
	TiStringRef prop = TiStringCreateWithUTF8CString("Kroll");
	TiObjectSetProperty(context, globalRef, prop, krollRef, 
                        kTiPropertyAttributeDontDelete | kTiPropertyAttributeDontEnum | kTiPropertyAttributeReadOnly, 
                        NULL);
	TiObjectRef krollObj = TiValueToObject(context, krollRef, NULL);
	bool set = TiObjectSetPrivate(krollObj, self);
	assert(set);
	[kroll release];
	TiStringRelease(prop);
	
	[self bindCallback:@"setTimeout" callback:&SetTimeoutCallback];
	[self bindCallback:@"setInterval" callback:&SetIntervalCallback];
	[self bindCallback:@"clearTimeout" callback:&ClearTimerCallback];
	[self bindCallback:@"clearInterval" callback:&ClearTimerCallback];
	[self bindCallback:@"require" callback:&CommonJSRequireCallback];
	[self bindCallback:@"L" callback:&LCallback];
    [self bindCallback:@"alert" callback:&AlertCallback];

	prop = TiStringCreateWithUTF8CString("String");
	
	// create a special method -- String.format -- that will act as a string formatter
	TiStringRef formatName = TiStringCreateWithUTF8CString("format");
	TiValueRef invoker = TiObjectMakeFunctionWithCallback(context, formatName, &StringFormatCallback);
	TiValueRef stringValueRef=TiObjectGetProperty(context, globalRef, prop, NULL);
	TiObjectRef stringRef = TiValueToObject(context, stringValueRef, NULL);
	TiObjectSetProperty(context, stringRef,   
						formatName, invoker,   
						kTiPropertyAttributeReadOnly | kTiPropertyAttributeDontDelete,   
						NULL); 
	TiStringRelease(formatName);	

	
	// create a special method -- String.formatDate -- that will act as a date formatter
	formatName = TiStringCreateWithUTF8CString("formatDate");
	invoker = TiObjectMakeFunctionWithCallback(context, formatName, &StringFormatDateCallback);
	stringValueRef=TiObjectGetProperty(context, globalRef, prop, NULL);
	stringRef = TiValueToObject(context, stringValueRef, NULL);
	TiObjectSetProperty(context, stringRef,   
						formatName, invoker,   
						kTiPropertyAttributeReadOnly | kTiPropertyAttributeDontDelete,   
						NULL); 
	TiStringRelease(formatName);	

	// create a special method -- String.formatTime -- that will act as a time formatter
	formatName = TiStringCreateWithUTF8CString("formatTime");
	invoker = TiObjectMakeFunctionWithCallback(context, formatName, &StringFormatTimeCallback);
	stringValueRef=TiObjectGetProperty(context, globalRef, prop, NULL);
	stringRef = TiValueToObject(context, stringValueRef, NULL);
	TiObjectSetProperty(context, stringRef,   
						formatName, invoker,   
						kTiPropertyAttributeReadOnly | kTiPropertyAttributeDontDelete,   
						NULL); 
	TiStringRelease(formatName);	
	
	// create a special method -- String.formatDecimal -- that will act as a decimal formatter
	formatName = TiStringCreateWithUTF8CString("formatDecimal");
	invoker = TiObjectMakeFunctionWithCallback(context, formatName, &StringFormatDecimalCallback);
	stringValueRef=TiObjectGetProperty(context, globalRef, prop, NULL);
	stringRef = TiValueToObject(context, stringValueRef, NULL);
	TiObjectSetProperty(context, stringRef,   
						formatName, invoker,   
						kTiPropertyAttributeReadOnly | kTiPropertyAttributeDontDelete,   
						NULL); 
	TiStringRelease(formatName);	

	// create a special method -- String.formatCurrency -- that will act as a currency formatter
	formatName = TiStringCreateWithUTF8CString("formatCurrency");
	invoker = TiObjectMakeFunctionWithCallback(context, formatName, &StringFormatCurrencyCallback);
	stringValueRef=TiObjectGetProperty(context, globalRef, prop, NULL);
	stringRef = TiValueToObject(context, stringValueRef, NULL);
	TiObjectSetProperty(context, stringRef,   
						formatName, invoker,   
						kTiPropertyAttributeReadOnly | kTiPropertyAttributeDontDelete,   
						NULL); 
	TiStringRelease(formatName);	
	
	
	TiStringRelease(prop);
	
	if (delegate!=nil && [delegate respondsToSelector:@selector(willStartNewContext:)])
	{
		[delegate performSelector:@selector(willStartNewContext:) withObject:self];
	}
	
	loopCount = 0;
	#define GC_LOOP_COUNT 5
	
	if (delegate!=nil && [delegate respondsToSelector:@selector(didStartNewContext:)])
	{
		[delegate performSelector:@selector(didStartNewContext:) withObject:self];
	}
	pthread_mutex_unlock(&KrollEntryLock);
	
	BOOL exit_after_flush = NO;
	
	while(1)
	{
		NSAutoreleasePool *innerpool = [[NSAutoreleasePool alloc] init];
		loopCount++;
		
		// if we're suspended, we simply wait for resume
        [condition lock];
		if (suspended)
		{
			//TODO: Suspended currently only is set on app pause/resume. We should have it happen whenever a JS thread
			//should be paused. Paused being no timers waiting, no events being triggered, no code to execute.
			if (suspended && ([queue count] == 0))
			{
				VerboseLog(@"Waiting: %@",self);
                decrementKrollCounter();
                [condition wait];
                incrementKrollCounter();
				VerboseLog(@"Resumed! %@",self)
			} 
		}
        [condition unlock];
		
		// we're stopped, we need to check to see if we have stuff that needs to
		// be executed before we can exit.  if we have stuff in the queue, we 
		// process just those events and then we immediately exit and clean up
		// otherwise, we can just exit immediately from here

        [condition lock];
		if (stopped)
		{
            [condition unlock];
			exit_after_flush = YES;
			int queue_count = 0;
			
			[lock lock];
			queue_count = [queue count];
			[lock unlock];

#if CONTEXT_DEBUG == 1	
			NSLog(@"[DEBUG] CONTEXT<%@>: shutdown, queue_count = %d",self,queue_count);
#endif
			
			// we're stopped, nothing in the queue, time to bail
			if (queue_count==0)
			{
				RELEASE_TO_NIL(innerpool);
				break;
			}
		}
        // If this is the case, then we were not halted, and must unlock the condition.
        if (!exit_after_flush) {
            [condition unlock];
        }

		BOOL stuff_in_queue = YES;
		int internalLoopCount = 0;
		// as long as we have stuff in the queue to process, we 
		// run our thread event pump and process events
		while (stuff_in_queue)
		{
			if (internalLoopCount > GC_LOOP_COUNT) {
				[self gc]; //This only sets up the gcrequest variable.
				internalLoopCount = 0;
                loopCount = 0;
			}
			internalLoopCount ++;
			// we have a pending GC request to try and reclaim memory
			if (gcrequest)
			{
				[self forceGarbageCollectNow];
			}
			
			// don't hold the queue lock
			// while we're processing an event so we 
			// can't deadlock on recursive callbacks
             // removeObjectAtIndex sends an 'autorelease' message, so we need to drain the pool in the queue loop, NOT the invoke
            NSAutoreleasePool* pool_ = [[NSAutoreleasePool alloc] init];
			id entry = nil;
			[lock lock];
#if CONTEXT_DEBUG == 1	
			int queueSize = [queue count];
#endif
			if ([queue count] == 0)
			{
				stuff_in_queue = NO;
			}
			else 
			{
				entry = [[queue objectAtIndex:0] retain];
				[queue removeObjectAtIndex:0]; 
			}
			[lock unlock];
			if (entry!=nil)
			{
				@try 
				{
#if CONTEXT_DEBUG == 1	
					NSLog(@"[DEBUG] CONTEXT<%@>: before action event invoke: %@, queue size: %d",self,entry,queueSize-1);
#endif
					[self invoke:entry];
#if CONTEXT_DEBUG == 1	
					NSLog(@"[DEBUG] CONTEXT<%@>: after action event invoke: %@",self,entry);
#endif
				}
				@catch (NSException * e) 
				{
					// this should never happen as we raise a JS exception inside the 
					// method above but this is a guard anyway
					DebugLog(@"[ERROR] Application raised an exception: %@",e);
				}
				@finally 
				{
					[entry release];
					entry = nil;
				}				
			}
            [pool_ release];
		}

		// TODO: experiment, attempt to collect more often than usual given our environment
		if (loopCount == GC_LOOP_COUNT)
		{
			[self forceGarbageCollectNow];
		}
		
		// check to see if we're already stopped and in the flush queue state, in which case,
		// we can now immediately exit
		if (exit_after_flush)
		{
			RELEASE_TO_NIL(innerpool);
			break;
		}
		
		
#if CONTEXT_DEBUG == 1	
		NSLog(@"[DEBUG] CONTEXT<%@>: waiting for new event (count=%d)",self,KrollContextCount);
#endif
		
		[condition lock];
		[lock lock];
		int queue_count = [queue count];
		[lock unlock];
		if ((queue_count == 0) && !suspended)
		{
			// wait only 10 seconds and then loop, this will allow us to garbage
			// collect every so often
            decrementKrollCounter();
			[condition waitUntilDate:[NSDate dateWithTimeIntervalSinceNow:10]];
            incrementKrollCounter();
		}
		[condition unlock]; 
		
#if CONTEXT_DEBUG == 1	
		NSLog(@"[DEBUG] CONTEXT<%@>: woke up for new event (count=%d)",self,KrollContextCount);
#endif
		
		RELEASE_TO_NIL(innerpool);
	}

#if CONTEXT_DEBUG == 1	
	NSLog(@"[DEBUG] CONTEXT<%@>: is shutting down",self);
#endif
	
	// call before we start the shutdown while context and timers are alive
	if (delegate!=nil && [delegate respondsToSelector:@selector(willStopNewContext:)])
	{
		[delegate performSelector:@selector(willStopNewContext:) withObject:self];
	}
	
	[timerLock lock];
	// stop any running timers
	if (timers!=nil && [timers count]>0)
	{
		for (id timerId in [NSDictionary dictionaryWithDictionary:timers])
		{
			KrollTimer *t = [timers objectForKey:timerId];
			[t cancel];
		}
		[timers removeAllObjects];
	}
	[timerLock unlock]; 
	
	[KrollCallback shutdownContext:self];
	
	// now we can notify listeners we're done
	if (delegate!=nil && [delegate respondsToSelector:@selector(didStopNewContext:)])
	{
		[(NSObject*)delegate performSelector:@selector(didStopNewContext:) withObject:self];
	}

#if CONTEXT_MEMORY_DEBUG==1
	NSLog(@"[DEBUG] SHUTDOWN: %@",self);
	NSLog(@"[DEBUG] KROLL RETAIN COUNT: %d",[kroll retainCount]);
#endif
	[self destroy];

	TiObjectSetPrivate(krollObj, NULL);	//Because we're unhooking the krollObj, we need to manually autorelease kroll later.
	prop = TiStringCreateWithUTF8CString("Kroll");
	TiObjectDeleteProperty(context, globalRef, prop, NULL);	//TODO: This still needed?
	TiStringRelease(prop);

	TiThreadPerformOnMainThread(^{[self unregisterForNotifications];}, NO);
	[self forceGarbageCollectNow];
	// cause the global context to be released and all objects internally to be finalized
	TiGlobalContextRelease(context);
	
    decrementKrollCounter();
    
	[kroll autorelease];
	[pool release];
}

-(void*)debugger
{
	return debugger;
}

@end

@implementation ExpandedInvocationOperation
@synthesize invocationTarget, invocationSelector;
@synthesize invocationArg1, invocationArg2, invocationArg3, invocationArg4;

- (id)initWithTarget:(id)target selector:(SEL)sel object:(id)arg1 object:(id)arg2;
{
	self = [super init];
	if (self != nil)
	{
		[self setInvocationTarget:target];
		[self setInvocationSelector:sel];
		[self setInvocationArg1:arg1];
		[self setInvocationArg2:arg2];
	}
	return self;
}

- (id)initWithTarget:(id)target selector:(SEL)sel object:(id)arg1 object:(id)arg2 object:(id)arg3;
{
	self = [self initWithTarget:target selector:sel object:arg1 object:arg2];
	if (self != nil)
	{
		[self setInvocationArg3:arg3];
	}
	return self;
}

- (id)initWithTarget:(id)target selector:(SEL)sel object:(id)arg1 object:(id)arg2 object:(id)arg3 object:(id)arg4;
{
	self = [self initWithTarget:target selector:sel object:arg1 object:arg2 object:arg3];
	if (self != nil)
	{
		[self setInvocationArg4:arg4];
	}
	return self;
}

-(void)main
{
	IMP ourFunction = [invocationTarget methodForSelector:invocationSelector];
	id result = ourFunction(invocationTarget,invocationSelector,
		invocationArg1,invocationArg2,invocationArg3,invocationArg4);

}

- (void) dealloc
{
	[invocationTarget release];
	[invocationArg1 release];
	[invocationArg2 release];
	[invocationArg3 release];
	[invocationArg4 release];
	[super dealloc];
}



@end
