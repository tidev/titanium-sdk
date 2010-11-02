/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>


#define WAIT_UNTIL_DONE_ON_UI_THREAD	NO

#define ENSURE_UI_THREAD_1_ARG(x)	\
if (![NSThread isMainThread]) { \
[self performSelectorOnMainThread:_cmd withObject:x waitUntilDone:WAIT_UNTIL_DONE_ON_UI_THREAD modes:[NSArray arrayWithObject:NSRunLoopCommonModes]]; \
return; \
} \

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
