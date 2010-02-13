/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"
#import "TiEvaluator.h"
#import "KrollCallback.h"
#import "KrollObject.h"

@class KrollBridge;


//Common exceptions to throw when the function call was improper
extern NSString * const TiExceptionInvalidType;
extern NSString * const TiExceptionNotEnoughArguments;
extern NSString * const TiExceptionRangeError;

//This is when a normally allowed command is not allowed (Say, adding a row to a table when it already is added elsewhere)
extern NSString * const TiExceptionInternalInconsistency;

//Should be rare, but also useful if arguments are used improperly.
extern NSString * const TiExceptionInternalInconsistency;

//Rare exceptions to indicate a bug in the titanium code (Eg, function that a subclass should have implemented)
extern NSString * const TiExceptionUnimplementedFunction;

@class TiHost;
@class TiProxy;

typedef enum {
	NativeBridge,
	WebBridge
} TiProxyBridgeType;


@protocol TiProxyDelegate

@required

-(void)propertyChanged:(NSString*)key oldValue:(id)oldValue newValue:(id)newValue proxy:(TiProxy*)proxy;
-(BOOL)isRepositionProperty:(NSString*)key;

@optional

-(void)readProxyValuesWithKeys:(id<NSFastEnumeration>)keys;

-(void)repositionChange:(NSString*)key value:(id)inputVal;

-(void)listenerAdded:(NSString*)type count:(int)count;
-(void)listenerRemoved:(NSString*)type count:(int)count;

@end

SEL SetterForKrollProperty(NSString * key);
void DoProxyDelegateChangedValuesWithProxy(UIView<TiProxyDelegate> * target, NSString * key, id oldValue, id newValue, TiProxy * proxy);
void DoProxyDelegateReadValuesWithKeysFromProxy(UIView<TiProxyDelegate> * target, id<NSFastEnumeration> keys, TiProxy * proxy);
//Why are these here? Because they can be commonly used between TiUIView and TiUITableViewCell.


@interface TiProxy : NSObject<KrollDynamicMethodProxy,KrollTargetable> {
@private
	NSMutableDictionary *listeners;
	BOOL destroyed;
	id<TiProxyDelegate> modelDelegate;
	NSURL *baseURL;
	NSString *krollDescription;
	NSMutableDictionary *contextListeners;
	NSRecursiveLock *destroyLock;
@protected
	NSMutableDictionary *dynprops;
	id<TiEvaluator> pageContext;
	id<TiEvaluator> executionContext;
	NSString *proxyId;
}

@property(readonly,nonatomic)			id<TiEvaluator> pageContext;
@property(readonly,nonatomic)			id<TiEvaluator> executionContext;
@property(readonly,nonatomic)			NSString *proxyId;

@property(nonatomic,assign,readwrite)	id<TiProxyDelegate> modelDelegate;


#pragma mark Private 

-(id)_initWithPageContext:(id<TiEvaluator>)context;
-(id)_initWithPageContext:(id<TiEvaluator>)context args:(NSArray*)args;
-(void)_initWithProperties:(NSDictionary*)properties;
-(BOOL)_hasListeners:(NSString*)type;
-(void)_fireEventToListener:(NSString*)type withObject:(id)obj listener:(KrollCallback*)listener thisObject:(TiProxy*)thisObject_;
-(id)_proxy:(TiProxyBridgeType)type;
-(void)_willChangeValue:(id)property value:(id)value;
-(void)_diChangeValue:(id)property value:(id)value;
-(void)_contextDestroyed;
-(void)contextWasShutdown:(KrollBridge*)bridge;
-(TiHost*)_host;
-(NSURL*)_baseURL;
-(void)_setBaseURL:(NSURL*)url;
-(BOOL)_propertyInitRequiresUIThread;
-(void)_destroy;
-(void)_configure;
-(void)_dispatchWithObjectOnUIThread:(NSArray*)args;
-(void)didReceiveMemoryWarning:(NSNotification*)notification;
-(TiProxy*)currentWindow;
-(void)contextShutdown:(id)sender;

#pragma mark Public
-(id<NSFastEnumeration>)validKeys;
-(id)resultForUndefinedMethod:(NSString*)name args:(NSArray*)args;
-(void)setValuesForKeysWithDictionary:(NSDictionary *)keyedValues usingKeys:(id<NSFastEnumeration>)keys;
+(void)throwException:(NSString *) reason subreason:(NSString*)subreason location:(NSString *)location;
-(void)throwException:(NSString *) reason subreason:(NSString*)subreason location:(NSString *)location;
-(void)addEventListener:(NSArray*)args;
-(void)removeEventListener:(NSArray*)args;
-(void)fireEvent:(NSString*)type withObject:(id)obj;
-(void)fireEvent:(NSString*)type withObject:(id)obj withSource:(id)source;
-(NSDictionary*)allProperties;
-(void)replaceValue:(id)value forKey:(NSString*)key notification:(BOOL)notify;
-(void)setExecutionContext:(id<TiEvaluator>)context;

@end
