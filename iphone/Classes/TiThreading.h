/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>

#define ENSURE_UI_THREAD_1_ARG(x)	\
if (![NSThread isMainThread]) { \
	SEL callback = _cmd;\
	TiThreadPerformOnMainThread(^{[self performSelector:callback withObject:x];}, NO);\
	return; \
} \


#define ENSURE_UI_THREAD_0_ARGS		ENSURE_UI_THREAD_1_ARG(nil)

//TODO: Is there any time where @selector(x:) is not _sel (IE, the called method for 1 arg?
//Similarly, if we already have x:withObject: as a selector in _sel, could we 
//We may want phase out asking the method explicitly when the compiler can do it for us
//For now, leaving it unchanged and using _X_ARG(S) to denote no method name used.

#define ENSURE_UI_THREAD(x,y) \
if (![NSThread isMainThread]) { \
	TiThreadPerformOnMainThread(^{[self x:y];},NO); \
return; \
} \

//TODO: Now that we have TiThreadPerform, we should optimize this out.
#define ENSURE_UI_THREAD_WITH_OBJ(x,y,z) \
if (![NSThread isMainThread]) { \
id o = [NSArray arrayWithObjects:@"" #x, NULL_IF_NIL(y),NULL_IF_NIL(z), nil];\
TiThreadPerformOnMainThread(^{[self _dispatchWithObjectOnUIThread:o];},NO); \
return; \
} \

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
__block id result=nil;\
TiThreadPerformOnMainThread(^{result=[[self _sync_##method:nil] retain];},YES); \
return [result autorelease];\
}\
return [self _sync_##method:nil];\
\
}\


#ifdef VERBOSE

#define WARN_IF_BACKGROUND_THREAD	\
if(![NSThread isMainThread])	\
{	\
	NSLog(@"[WARN] %@ not running on the main thread.",CODELOCATION);	\
}	\

#define WARN_IF_BACKGROUND_THREAD_OBJ	\
if(![NSThread isMainThread])	\
{	\
	NSLog(@"[WARN] %@%@ was not running on the main thread.",NSStringFromClass([self class]),CODELOCATION);	\
}	\

#else

#define WARN_IF_BACKGROUND_THREAD	{}
#define WARN_IF_BACKGROUND_THREAD_OBJ	{}

#endif //VERBOSE
