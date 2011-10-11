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
#import <pthread.h>

@class KrollBridge;
@class KrollObject;

//Common exceptions to throw when the function call was improper
extern NSString * const TiExceptionInvalidType;
extern NSString * const TiExceptionNotEnoughArguments;
extern NSString * const TiExceptionRangeError;

extern NSString * const TiExceptionOSError;

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


@protocol TiProxyDelegate<NSObject>

@required

-(void)propertyChanged:(NSString*)key oldValue:(id)oldValue newValue:(id)newValue proxy:(TiProxy*)proxy;

@optional

-(void)readProxyValuesWithKeys:(id<NSFastEnumeration>)keys;

-(void)listenerAdded:(NSString*)type count:(int)count;
-(void)listenerRemoved:(NSString*)type count:(int)count;

-(void)detachProxy;

@end

SEL SetterForKrollProperty(NSString * key);
SEL SetterWithObjectForKrollProperty(NSString * key);

void DoProxyDelegateChangedValuesWithProxy(UIView<TiProxyDelegate> * target, NSString * key, id oldValue, id newValue, TiProxy * proxy);
void DoProxyDelegateReadValuesWithKeysFromProxy(UIView<TiProxyDelegate> * target, id<NSFastEnumeration> keys, TiProxy * proxy);
//Why are these here? Because they can be commonly used between TiUIView and TiUITableViewCell.


@interface TiProxy : NSObject<KrollTargetable> {
@private
	NSMutableDictionary *listeners;
	BOOL destroyed;
	id<TiProxyDelegate> modelDelegate;
	NSURL *baseURL;
	NSString *krollDescription;
	pthread_rwlock_t listenerLock;
	BOOL reproxying;
@protected
	BOOL	ignoreValueChanged;	//This is done only at initialization where we know the dynprops were properly set by _initWithProperties.
	NSMutableDictionary *dynprops; 
	pthread_rwlock_t dynpropsLock; // NOTE: You must respect the dynprops lock when accessing dynprops elsewhere!

	int bridgeCount;
	KrollObject * pageKrollObject;
	id<TiEvaluator> pageContext;
	id<TiEvaluator> executionContext;
}

-(void)boundBridge:(id<TiEvaluator>)newBridge withKrollObject:(KrollObject *)newKrollObject;
-(void)unboundBridge:(id<TiEvaluator>)oldBridge;


@property(readonly,nonatomic)			id<TiEvaluator> pageContext;
@property(readonly,nonatomic)			id<TiEvaluator> executionContext;

@property(nonatomic,retain,readwrite)	id<TiProxyDelegate> modelDelegate;

+(BOOL)shouldRegisterOnInit;

#pragma mark Private 

-(id)_initWithPageContext:(id<TiEvaluator>)context;
-(id)_initWithPageContext:(id<TiEvaluator>)context args:(NSArray*)args;
-(void)_initWithProperties:(NSDictionary*)properties;
-(BOOL)_hasListeners:(NSString*)type;
-(void)_fireEventToListener:(NSString*)type withObject:(id)obj listener:(KrollCallback*)listener thisObject:(TiProxy*)thisObject_;
-(id)_proxy:(TiProxyBridgeType)type;
-(void)contextWasShutdown:(id<TiEvaluator>)context;
-(TiHost*)_host;
-(NSURL*)_baseURL;
-(void)_setBaseURL:(NSURL*)url;
-(void)_destroy;
-(void)_configure;
-(void)_dispatchWithObjectOnUIThread:(NSArray*)args;
-(void)didReceiveMemoryWarning:(NSNotification*)notification;
-(TiProxy*)currentWindow;
-(void)contextShutdown:(id)sender;
-(id)toString:(id)args;
-(BOOL)destroyed;
-(void)setReproxying:(BOOL)yn;
-(BOOL)inReproxy;

#pragma mark Utility
-(KrollObject *)krollObjectForContext:(KrollContext *)context;

-(BOOL)retainsJsObjectForKey:(NSString *)key;

//TODO: Find everywhere were we retain a proxy in a non-assignment way, and do remember/forget properly.
-(void)rememberProxy:(TiProxy *)rememberedProxy;
-(void)forgetProxy:(TiProxy *)forgottenProxy;
//These are when, say, a window is opened, so you want to do tiValueProtect to make SURE it doesn't go away.
-(void)rememberSelf;
-(void)forgetSelf;

//SetCallback is done internally by setValue:forUndefinedKey:
-(void)fireCallback:(NSString*)type withArg:(NSDictionary *)argDict withSource:(id)source;

#pragma mark Public 
-(id<NSFastEnumeration>)allKeys;
-(NSArray *)keySequence;

+(void)throwException:(NSString *) reason subreason:(NSString*)subreason location:(NSString *)location;
-(void)throwException:(NSString *) reason subreason:(NSString*)subreason location:(NSString *)location;
-(void)addEventListener:(NSArray*)args;
-(void)removeEventListener:(NSArray*)args;

-(void)fireEvent:(id)args;
-(void)fireEvent:(NSString*)type withObject:(id)obj;
-(void)fireEvent:(NSString*)type withObject:(id)obj withSource:(id)source;
-(void)fireEvent:(NSString*)type withObject:(id)obj withSource:(id)source propagate:(BOOL)yn;
-(void)fireEvent:(NSString*)type withObject:(id)obj propagate:(BOOL)yn;

-(NSDictionary*)allProperties;
-(void)replaceValue:(id)value forKey:(NSString*)key notification:(BOOL)notify;
-(void)deleteKey:(NSString*)key;

-(id)sanitizeURL:(id)value;

-(void)setExecutionContext:(id<TiEvaluator>)context;

@end
