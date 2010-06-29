/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <Foundation/Foundation.h>
#import "TiCore.h"
#import "TiBase.h"
#import "TiContextRefPrivate.h"

@class KrollContext;
@class KrollCallback;

@protocol KrollDelegate <NSObject>

@required
-(id)require:(KrollContext*)kroll path:(NSString*)path;

@optional

-(void)willStartNewContext:(KrollContext*)kroll;
-(void)didStartNewContext:(KrollContext*)kroll;
-(void)willStopNewContext:(KrollContext*)kroll;
-(void)didStopNewContext:(KrollContext*)kroll;
	
@end

@interface KrollContext : NSObject 
{
@private
	id<KrollDelegate> delegate;
	NSString *contextId;
	NSRecursiveLock *lock;
	NSCondition *condition;
	NSMutableArray *queue;
	BOOL stopped;
	BOOL gcrequest;
	BOOL destroyed;
	BOOL suspended;
	TiGlobalContextRef context;
	NSMutableDictionary *timers;
	NSRecursiveLock *timerLock;
#ifdef DEBUGGER_ENABLED	
	void *debugger;
#endif
}

@property(nonatomic,readwrite,assign) id<KrollDelegate> delegate;

-(NSString*)contextId;
-(void)start;
-(void)stop;
-(BOOL)running;
-(void)gc;
-(TiGlobalContextRef)context;
#ifdef DEBUGGER_ENABLED
-(void*)debugger;
#endif

#ifdef DEBUG
// used during debugging only
-(int)queueCount;
#endif

-(void)invokeOnThread:(id)callback_ method:(SEL)method_ withObject:(id)obj condition:(NSCondition*)condition_;
-(void)invokeOnThread:(id)callback_ method:(SEL)method_ withObject:(id)obj callback:(id)callback selector:(SEL)selector_;
-(void)evalJS:(NSString*)code;
-(id)evalJSAndWait:(NSString*)code;
-(void)invokeEvent:(KrollCallback*)callback_ args:(NSArray*)args_ thisObject:(id)thisObject_;
-(void)registerTimer:(id)timer timerId:(double)timerId;
-(void)unregisterTimer:(double)timerId;

@end

//====================================================================================================================

@interface KrollInvocation : NSObject {
@private
	id target;
	SEL method;
	id obj;
	NSCondition *condition;
	id notify;
	SEL notifySelector;
}
-(id)initWithTarget:(id)target_ method:(SEL)method_ withObject:(id)obj_ condition:(NSCondition*)condition_;
-(id)initWithTarget:(id)target_ method:(SEL)method_ withObject:(id)obj_ callback:(id)callback_ selector:(SEL)selector_;
-(void)invoke:(KrollContext*)context;
@end

@interface KrollEval : NSObject {
@private
	NSString *code;
}
-(id)initWithCode:(NSString*)code;
-(void)invoke:(KrollContext*)context;
-(id)invokeWithResult:(KrollContext*)context;
@end

@interface KrollEvent : NSObject {
@private
	KrollCallback *callback;
	NSArray *args;
	id thisObject;
}
-(id)initWithCallback:(KrollCallback*)callback_ args:(NSArray*)args_ thisObject:(id)thisObject_;
-(void)invoke:(KrollContext*)context;
@end


@protocol KrollTargetable
@required
-(void)setExecutionContext:(id<KrollDelegate>)delegate;
@end

TI_INLINE KrollContext* GetKrollContext(TiContextRef context)
{
	static const char *krollNS = "Kroll";
	TiGlobalContextRef globalContext = TiContextGetGlobalContext(context);
	TiObjectRef global = TiContextGetGlobalObject(globalContext); 
	TiStringRef string = TiStringCreateWithUTF8CString(krollNS);
	TiValueRef value = TiObjectGetProperty(globalContext, global, string, NULL);
	KrollContext *ctx = (KrollContext*)TiObjectGetPrivate(TiValueToObject(globalContext, value, NULL));
	TiStringRelease(string);
	return ctx;
}



