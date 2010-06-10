/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import "defines.h"

#define MEMORY_DEBUG 0

#ifdef DEBUG
	// Kroll memory debugging
	#define KROLLBRIDGE_MEMORY_DEBUG MEMORY_DEBUG
	#define KOBJECT_MEMORY_DEBUG MEMORY_DEBUG
	#define CONTEXT_MEMORY_DEBUG MEMORY_DEBUG
	
	// Proxy memory debugging
	#define PROXY_MEMORY_TRACK MEMORY_DEBUG
	#define TABWINDOW_MEMORY_DEBUG MEMORY_DEBUG
	#define CONTEXT_DEBUG MEMORY_DEBUG

	// Kroll debugging
	#define KOBJECT_DEBUG MEMORY_DEBUG
	#define KMETHOD_DEBUG MEMORY_DEBUG
#endif

#define TI_INLINE static __inline__

// create a mutable array that doesn't retain internal references to objects
NSMutableArray* TiCreateNonRetainingArray();

// create a mutable dictionary that doesn't retain internal references to objects
NSMutableDictionary* TiCreateNonRetainingDictionary();

CGPoint midpointBetweenPoints(CGPoint a, CGPoint b);

#define degreesToRadians(x) (M_PI * x / 180.0)
#define radiansToDegrees(x) (x * (180.0 / M_PI))

#define RELEASE_TO_NIL(x) { if (x!=nil) { [x release]; x = nil; } }
#define RELEASE_TO_NIL_AUTORELEASE(x) { if (x!=nil) { [x autorelease]; x = nil; } }

#define CODELOCATION	[NSString stringWithFormat:@" in %s (%@:%d)",__FUNCTION__,[[NSString stringWithFormat:@"%s",__FILE__] lastPathComponent],__LINE__]

#define NULL_IF_NIL(x)	({ id xx = (x); (xx==nil)?[NSNull null]:xx; })

#define WAIT_UNTIL_DONE_ON_UI_THREAD	NO

#define ENSURE_UI_THREAD_1_ARG(x)	\
if (![NSThread isMainThread]) { \
[self performSelectorOnMainThread:_cmd withObject:x waitUntilDone:WAIT_UNTIL_DONE_ON_UI_THREAD modes:[NSArray arrayWithObject:NSRunLoopCommonModes]]; \
return; \
} \

// TODO: This is wrong for functions which do not take any argument.
#define ENSURE_UI_THREAD_0_ARGS		ENSURE_UI_THREAD_1_ARG(nil)

//TODO: Is there any time where @selector(x:) is not _sel (IE, the called method for 1 arg?
//Similarly, if we already have x:withObject: as a selector in _sel, could we 
//We may want phase out asking the method explicitly when the compiler can do it for us
//For now, leaving it unchanged and using _X_ARG(S) to denote no method name used.

#define ENSURE_UI_THREAD(x,y) \
if (![NSThread isMainThread]) { \
[self performSelectorOnMainThread:@selector(x:) withObject:y waitUntilDone:WAIT_UNTIL_DONE_ON_UI_THREAD]; \
return; \
} \

#define ENSURE_UI_THREAD_WITH_OBJS(x,...)	\
if (![NSThread isMainThread]) { \
id o = [NSArray arrayWithObjects:@"" #x, ##__VA_ARGS__, nil];\
[self performSelectorOnMainThread:@selector(_dispatchWithObjectOnUIThread:) withObject:o waitUntilDone:WAIT_UNTIL_DONE_ON_UI_THREAD]; \
return; \
} \

#define ENSURE_UI_THREAD_WITH_OBJ(x,y,z) \
ENSURE_UI_THREAD_WITH_OBJS(x,NULL_IF_NIL(y),NULL_IF_NIL(z))

//if (![NSThread isMainThread]) { \
//id o = [NSArray arrayWithObjects:[NSString stringWithFormat:@"%s",#x],y==nil?[NSNull null]:y,z==nil?[NSNull null]:z,nil];\
//[self performSelectorOnMainThread:@selector(_dispatchWithObjectOnUIThread:) withObject:o waitUntilDone:NO]; \
//return; \
//} \


#define BEGIN_UI_THREAD_PROTECTED_VALUE(method,type) \
-(id)_sync_##method:(NSMutableArray*)array_\
{\
\
type* result = nil;\
\

#define END_UI_THREAD_PROTECTED_VALUE(method) \
if (array_!=nil)[array_ addObject:result];\
return result;\
}\
-(id)method\
{\
if (![NSThread isMainThread])\
{\
NSMutableArray *array = [NSMutableArray array];\
[self performSelectorOnMainThread:@selector(_sync_##method:) withObject:array waitUntilDone:YES];\
return [array objectAtIndex:0];\
}\
return [self _sync_##method:nil];\
\
}\


//NOTE: these checks can be pulled out of production build type

//Question: Given that some of these silently massage the data during development but not production,
//Should the data massage either be kept in production or removed in development? --Blain.

#define ENSURE_STRING_OR_NIL(x) \
if ([x respondsToSelector:@selector(stringValue)]) \
{ \
x = [(id)x stringValue]; \
} \
else \
{ \
ENSURE_TYPE_OR_NIL(x,NSString); \
} \

#define ENSURE_SINGLE_ARG(x,t) \
if ([x isKindOfClass:[NSArray class]] && [x count]>0) \
{ \
x = (t*)[x objectAtIndex:0]; \
} \
if (![x isKindOfClass:[t class]]) \
{\
[self throwException:TiExceptionInvalidType subreason:[NSString stringWithFormat:@"expected: %@, was: %@",[x class],[t class]] location:CODELOCATION]; \
}\

#define ENSURE_SINGLE_ARG_OR_NIL(x,t) \
if (x==nil || x == [NSNull null]) { x = nil; } \
else {\
if ([x isKindOfClass:[NSArray class]] && [x count]>0) \
{ \
x = (t*)[x objectAtIndex:0]; \
} \
if (![x isKindOfClass:[t class]]) \
{\
[self throwException:TiExceptionInvalidType subreason:[NSString stringWithFormat:@"expected: %@, was: %@",[x class],[t class]] location:CODELOCATION]; \
}\
}\


#define ENSURE_CLASS(x,t) \
if (![x isKindOfClass:t]) \
{ \
[self throwException:TiExceptionInvalidType subreason:[NSString stringWithFormat:@"expected: %@, was: %@",t,[x class]] location:CODELOCATION]; \
}\

#define ENSURE_TYPE(x,t) ENSURE_CLASS(x,[t class])

//Because both NSString and NSNumber respond to intValue, etc, this is a wider net
#define ENSURE_METHOD(x,t) \
if (![x respondsToSelector:@selector(t)]) \
{ \
[self throwException:TiExceptionInvalidType subreason:[NSString stringWithFormat:@"%@ doesn't respond to method: %@",[x class],@#t] location:CODELOCATION]; \
}\

#define IS_NULL_OR_NIL(x)	((x==nil) || ((id)x==[NSNull null]))

#define ENSURE_CLASS_OR_NIL(x,t) \
if (IS_NULL_OR_NIL(x))	\
{	\
	x = nil;	\
}	\
else if (![x isKindOfClass:t])	\
{ \
	[self throwException:TiExceptionInvalidType subreason:[NSString stringWithFormat:@"expected: %@ or nil, was: %@",t,[x class]] location:CODELOCATION]; \
}\

#define ENSURE_TYPE_OR_NIL(x,t) ENSURE_CLASS_OR_NIL(x,[t class])

#define ENSURE_ARG_COUNT(x,c) \
if ([x count]<c)\
{\
[self throwException:TiExceptionNotEnoughArguments subreason:[NSString stringWithFormat:@"expected %d arguments, received: %d",c,[x count]] location:CODELOCATION]; \
}\

#define VALUE_AT_INDEX_OR_NIL(x,i)	\
({ NSArray * y = (x); ([y count]>i)?[y objectAtIndex:i]:nil; })


#define ENSURE_CONSISTENCY(x) \
if (!(x)) \
{ \
[self throwException:TiExceptionInternalInconsistency subreason:nil location:CODELOCATION]; \
}\

#define ENSURE_VALUE_CONSISTENCY(x,v) \
{	\
__typeof__(x) __x = (x);	\
__typeof__(v) __v = (v);	\
if(__x != __v)	\
{	\
[self throwException:TiExceptionInternalInconsistency subreason:[NSString stringWithFormat:@"(" #x ") was not (" #v ")"] location:CODELOCATION];	\
}	\
}

#define ENSURE_VALUE_RANGE(x,minX,maxX) \
{	\
__typeof__(x) __x = (x);	\
__typeof__(minX) __minX = (minX);	\
__typeof__(maxX) __maxX = (maxX);	\
if ((__x<__minX) || (__x>__maxX)) \
{ \
[self throwException:TiExceptionRangeError subreason:[NSString stringWithFormat:@"%d was not > %d and < %d",__x,__maxX,__minX] location:CODELOCATION]; \
}\
}


#define ENSURE_DICT(x) ENSURE_TYPE(x,NSDictionary)
#define ENSURE_ARRAY(x) ENSURE_TYPE(x,NSArray)
#define ENSURE_STRING(x) ENSURE_TYPE(x,NSString)



#define DEFINE_EXCEPTIONS \
- (void) throwException:(NSString *) reason subreason:(NSString*)subreason location:(NSString *)location\
{\
	NSString * exceptionName = [@"org.appcelerator." stringByAppendingString:NSStringFromClass([self class])];\
	NSString * message = [NSString stringWithFormat:@"%@. %@ %@",reason,(subreason!=nil?subreason:@""),(location!=nil?location:@"")];\
	NSLog(@"[WARN] %@",message);\
	@throw [NSException exceptionWithName:exceptionName reason:message userInfo:nil];\
}\
\
+ (void) throwException:(NSString *) reason subreason:(NSString*)subreason location:(NSString *)location\
{\
	NSString * exceptionName = [@"org.appcelerator." stringByAppendingString:NSStringFromClass([self class])];\
	NSString * message = [NSString stringWithFormat:@"%@. %@ %@",reason,(subreason!=nil?subreason:@""),(location!=nil?location:@"")];\
	NSLog(@"[WARN] %@",message);\
	@throw [NSException exceptionWithName:exceptionName reason:message userInfo:nil];\
}\


#define THROW_INVALID_ARG(m) \
[self throwException:TiExceptionInvalidType subreason:m location:CODELOCATION]; \

#define MAKE_SYSTEM_PROP_IPAD(name,map) \
-(NSNumber*)name \
{\
   if ([TiUtils isIPad])\
   {\
      return [NSNumber numberWithInt:map];\
    }\
}\


#define MAKE_SYSTEM_PROP(name,map) \
-(NSNumber*)name \
{\
return [NSNumber numberWithInt:map];\
}\

#define MAKE_SYSTEM_PROP_DBL(name,map) \
-(NSNumber*)name \
{\
return [NSNumber numberWithDouble:map];\
}\

#define MAKE_SYSTEM_STR(name,map) \
-(NSString*)name \
{\
return (NSString*)map;\
}\

#define MAKE_SYSTEM_UINT(name,map) \
-(NSNumber*)name \
{\
return [NSNumber numberWithUnsignedInt:map];\
}\

#define MAKE_SYSTEM_NUMBER(name,map) \
-(NSNumber*)name \
{\
return map;\
}\

#define NUMBOOL(x) \
[NSNumber numberWithBool:x]\

#define NUMLONG(x) \
[NSNumber numberWithLong:x]\

#define NUMLONGLONG(x) \
[NSNumber numberWithLongLong:x]\

#define NUMINT(x) \
[NSNumber numberWithInt:x]\

#define NUMDOUBLE(x) \
[NSNumber numberWithDouble:x]\

#define NUMFLOAT(x) \
[NSNumber numberWithFloat:x]\



 //MUST BE NEGATIVE, as it inhabits the same space as UIBarButtonSystemItem
enum {
	UITitaniumNativeItemNone = -1, 
	UITitaniumNativeItemSpinner = -2,
	UITitaniumNativeItemProgressBar = -3,
	
	UITitaniumNativeItemSlider = -4,
	UITitaniumNativeItemSwitch = -5,
	UITitaniumNativeItemMultiButton = -6,
	UITitaniumNativeItemSegmented = -7,
	
	UITitaniumNativeItemTextView = -8,
	UITitaniumNativeItemTextField = -9,
	UITitaniumNativeItemSearchBar = -10,
	
	UITitaniumNativeItemPicker = -11,
	UITitaniumNativeItemDatePicker = -12,
	
	UITitaniumNativeItemInfoLight = -13,
	UITitaniumNativeItemInfoDark = -14,
	
	UITitaniumNativeItemDisclosure = -15,
	
	UITitaniumNativeItemContactAdd = -16
};


// common sizes for iPhone (will these change for iPad?)

#define TI_STATUSBAR_HEIGHT				20

#define TI_NAVBAR_HEIGHT				44
#define TI_NAVBAR_HEIGHT_WITH_PROMPT	64	//?
#define TI_NAVBAR_BUTTON_WIDTH			20
#define TI_NAVBAR_BUTTON_HEIGHT			20

#define TI_TABBAR_HEIGHT				49

#define TI_TEXTFIELD_HEIGHT				31

#define TI_KEYBOARD_PORTRAIT_HEIGHT		216
#define TI_KEYBOARD_LANDSCAPE_HEIGHT	140


#ifdef DEBUG
#define FRAME_DEBUG(f) \
NSLog(@"FRAME -- size=%fx%f, origin=%f,%f",f.size.width,f.size.height,f.origin.x,f.origin.y);
#else
#define FRAME_DEBUG(f) 
#endif


#define DEFINE_DEF_PROP(name,defval)\
-(id)name \
{\
id value = [super valueForUndefinedKey:@#name];\
if (value == nil || value == [NSNull null]) \
{\
return defval;\
}\
return value;\
}\

#define DEFINE_DEF_BOOL_PROP(name,defval) DEFINE_DEF_PROP(name,NUMBOOL(defval))
#define DEFINE_DEF_NULL_PROP(name) DEFINE_DEF_PROP(name,[NSNull null])
#define DEFINE_DEF_INT_PROP(name,val) DEFINE_DEF_PROP(name,NUMINT(val))

// TI_VERSION will be set via an external source if not set
// display a warning and set it to 0.0.0
 
#ifndef TI_VERSION
#define TI_VERSION 0.0.0
#endif
 
#define _QUOTEME(x) #x
#define STRING(x) _QUOTEME(x)
 
#define TI_VERSION_STR STRING(TI_VERSION)
 
// in simulator we redefine to format for Titanium Developer console
 
#define NSLog(...) {\
	const char *__s = [[NSString stringWithFormat:__VA_ARGS__] UTF8String];\
	if (__s[0]=='[')\
	{\
	    fprintf(stderr,"%s\n", __s);\
		fflush(stderr);\
	}\
	else\
	{\
	    fprintf(stderr,"[DEBUG] %s\n", __s);\
		fflush(stderr);\
	}\
}

#ifdef VERBOSE

#define VerboseLog(...)	{NSLog(__VA_ARGS__);}

#else

#define VerboseLog(...)	{}

#endif

#define VAL_OR_NSNULL(foo)	(((foo) != nil)?((id)foo):[NSNull null])

NSData * dataWithHexString (NSString * hexString);
NSString * hexString (NSData * thedata);

typedef enum {
	TiNetworkConnectionStateNone = 0,
	TiNetworkConnectionStateWifi = 1,
	TiNetworkConnectionStateMobile = 2,
	TiNetworkConnectionStateLan = 3,
	TiNetworkConnectionStateUnknown = 4,	
} TiNetworkConnectionState;


extern NSString * const kKrollShutdownNotification;
extern NSString * const kTiWillShutdownNotification;
extern NSString * const kTiShutdownNotification;
extern NSString * const kTiSuspendNotification;
extern NSString * const kTiResumeNotification;
extern NSString * const kTiAnalyticsNotification;
extern NSString * const kTiRemoteDeviceUUIDNotification;
extern NSString * const kTiGestureShakeNotification;


#ifndef __IPHONE_3_2
#define __IPHONE_3_2 30200
#endif

