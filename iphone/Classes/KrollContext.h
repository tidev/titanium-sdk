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
-(BOOL)shouldDebugContext;
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

//Garbage collection variables.
	BOOL gcrequest;
	unsigned int loopCount;

	BOOL destroyed;
	BOOL suspended;
	TiGlobalContextRef context;
	NSMutableDictionary *timers;
	NSRecursiveLock *timerLock;
	void *debugger;
	id cachedThreadId;
}

@property(nonatomic,readwrite,assign) id<KrollDelegate> delegate;

-(NSString*)contextId;
-(void)start;
-(void)stop;
-(BOOL)running;
-(void)gc;
-(TiGlobalContextRef)context;
-(void*)debugger;
-(BOOL)isKJSThread;

#ifdef DEBUG
// used during debugging only
-(int)queueCount;
#endif

-(void)invokeOnThread:(id)callback_ method:(SEL)method_ withObject:(id)obj condition:(NSCondition*)condition_;
-(void)invokeOnThread:(id)callback_ method:(SEL)method_ withObject:(id)obj callback:(id)callback selector:(SEL)selector_;
-(void)invokeBlockOnThread:(void(^)())block;

-(void)evalJS:(NSString*)code;
-(id)evalJSAndWait:(NSString*)code;

-(void)enqueue:(id)obj;

-(void)registerTimer:(id)timer timerId:(double)timerId;
-(void)unregisterTimer:(double)timerId;

-(int)forceGarbageCollectNow;
-(NSString*)threadName;

@end

//====================================================================================================================

@interface KrollUnprotectOperation : NSOperation
{
	TiContextRef jsContext;
	TiObjectRef firstObject;
	TiObjectRef secondObject;
}

-(id)initWithContext: (TiContextRef)newContext withJsobject: (TiObjectRef) newFirst;
-(id)initWithContext: (TiContextRef)newContext withJsobject: (TiObjectRef) newFirst andJsobject: (TiObjectRef) newSecond;

@end


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
-(TiValueRef) jsInvokeInContext: (KrollContext*)context exception: (TiValueRef *)exceptionPointer;
-(void)invoke:(KrollContext*)context;
-(id)invokeWithResult:(KrollContext*)context;
@end

@class KrollObject;
@interface KrollEvent : NSObject {
@private
	KrollCallback * callback;

	NSString * type;
	KrollObject * callbackObject;

	NSDictionary *eventObject;
	id thisObject;
}
-(id)initWithType:(NSString *)newType ForKrollObject:(KrollObject*)newCallbackObject eventObject:(NSDictionary*)newEventObject thisObject:(id)newThisObject;
-(id)initWithCallback:(KrollCallback*)newCallback eventObject:(NSDictionary*)newEventObject thisObject:(id)newThisObject;
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

//TODO: After 1.7, move to individual file and convert KrollInvocation and Callbacks to ExpandedInvocationOperation.
@interface ExpandedInvocationOperation : NSOperation {
@private
	id invocationTarget;
	SEL invocationSelector;
	id invocationArg1;
	id invocationArg2;
	id invocationArg3;
	id invocationArg4;
}
- (id)initWithTarget:(id)target selector:(SEL)sel object:(id)arg1 object:(id)arg2;
- (id)initWithTarget:(id)target selector:(SEL)sel object:(id)arg1 object:(id)arg2 object:(id)arg3;
- (id)initWithTarget:(id)target selector:(SEL)sel object:(id)arg1 object:(id)arg2 object:(id)arg3 object:(id)arg4;

@property(nonatomic,readwrite,retain)	id invocationTarget;
@property(nonatomic,readwrite,assign)	SEL invocationSelector;
@property(nonatomic,readwrite,retain)	id invocationArg1;
@property(nonatomic,readwrite,retain)	id invocationArg2;
@property(nonatomic,readwrite,retain)	id invocationArg3;
@property(nonatomic,readwrite,retain)	id invocationArg4;

@end



