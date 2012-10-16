/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include <execinfo.h>
#include <libkern/OSAtomic.h>
#import "TiExceptionHandler.h"
#import "TiBase.h"
#import "TiApp.h"

static void TiUncaughtExceptionHandler(NSException *exception);

static NSUncaughtExceptionHandler *prevUncaughtExceptionHandler = NULL;

NSString * const UncaughtExceptionHandlerSignalExceptionName = @"UncaughtExceptionHandlerSignalExceptionName";
NSString * const UncaughtExceptionHandlerSignalKey = @"UncaughtExceptionHandlerSignalKey";
NSString * const UncaughtExceptionHandlerAddressesKey = @"UncaughtExceptionHandlerAddressesKey";

volatile int32_t UncaughtExceptionCount = 0;
const int32_t UncaughtExceptionMaximum = 10;

const NSInteger UncaughtExceptionHandlerSkipAddressCount = 4;
const NSInteger UncaughtExceptionHandlerReportAddressCount = 5;

void SignalHandler(int signal)
{
	int32_t exceptionCount = OSAtomicIncrement32(&UncaughtExceptionCount);
	if (exceptionCount > UncaughtExceptionMaximum)
	{
		return;
	}
    
	NSMutableDictionary *userInfo =
    [NSMutableDictionary
     dictionaryWithObject:[NSNumber numberWithInt:signal]
     forKey:UncaughtExceptionHandlerSignalKey];
    
	NSArray *callStack = [TiExceptionHandler backtrace];
	[userInfo
     setObject:callStack
     forKey:UncaughtExceptionHandlerAddressesKey];
    
    NSException *exception = [NSException
     exceptionWithName:UncaughtExceptionHandlerSignalExceptionName
     reason:
     [NSString stringWithFormat:
      NSLocalizedString(@"Signal %d was raised", nil),
      signal]
     userInfo:
     [NSDictionary
      dictionaryWithObject:[NSNumber numberWithInt:signal]
      forKey:UncaughtExceptionHandlerSignalKey]];
    
    TiUncaughtExceptionHandler(exception);
}

@implementation TiExceptionHandler

@synthesize delegate = _delegate;

+ (NSArray *)backtrace
{
    void* callstack[128];
    int frames = backtrace(callstack, 128);
    char **strs = backtrace_symbols(callstack, frames);
    
    int i;
    NSMutableArray *backtrace = [NSMutableArray arrayWithCapacity:frames];
    for (
         i = UncaughtExceptionHandlerSkipAddressCount;
         i < UncaughtExceptionHandlerSkipAddressCount +
         UncaughtExceptionHandlerReportAddressCount;
         i++)
    {
	 	[backtrace addObject:[NSString stringWithUTF8String:strs[i]]];
    }
    free(strs);
    
    return backtrace;
}


+ (TiExceptionHandler *)defaultExceptionHandler
{
	static TiExceptionHandler *defaultExceptionHandler;
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		defaultExceptionHandler = [[self alloc] init];
		prevUncaughtExceptionHandler = NSGetUncaughtExceptionHandler();
		NSSetUncaughtExceptionHandler(&TiUncaughtExceptionHandler);
        signal(SIGABRT, SignalHandler);
        signal(SIGILL, SignalHandler);
        signal(SIGSEGV, SignalHandler);
        signal(SIGFPE, SignalHandler);
        signal(SIGBUS, SignalHandler);
        signal(SIGPIPE, SignalHandler);
	});
	return defaultExceptionHandler;
}

- (void)reportException:(NSException *)exception withStackTrace:(NSArray *)stackTrace
{
	NSString *message = [NSString stringWithFormat:
				@"[ERROR] The application has crashed with an uncaught exception '%@'.\nReason:\n%@\nStack trace:\n\n%@\n",
				exception.name, exception.reason, [stackTrace componentsJoinedByString:@"\n"]];
	NSLog(@"%@",message);
	id <TiExceptionHandlerDelegate> currentDelegate = _delegate;
	if (currentDelegate == nil) {
		currentDelegate = self;
	}
	[currentDelegate handleUncaughtException:exception withStackTrace:stackTrace];
}

- (void)reportScriptError:(TiScriptError *)scriptError
{
	DebugLog(@"[ERROR] Script Error = %@.", scriptError);
	
	id <TiExceptionHandlerDelegate> currentDelegate = _delegate;
	if (currentDelegate == nil) {
		currentDelegate = self;
	}
	[currentDelegate handleScriptError:scriptError];
}

- (void)showScriptError:(TiScriptError *)error
{
	[[TiApp app] showModalError:[error description]];
}

#pragma mark - TiExceptionHandlerDelegate

- (void)alertView:(UIAlertView *)anAlertView clickedButtonAtIndex:(NSInteger)anIndex
{
	if (anIndex == 0)
	{
        dismissed = YES;
	}
}

- (void)handleUncaughtException:(NSException *)exception withStackTrace:(NSArray *)stackTrace
{
    TiThreadPerformOnMainThread(^{
        
        UIAlertView *alert =
        [[[UIAlertView alloc]
          initWithTitle:NSLocalizedString(@"Unexpected Error", nil)
          message:NSLocalizedString(@"The application has encountered a fatal error and must exit.",nil)
          delegate:self
          cancelButtonTitle:NSLocalizedString(@"Quit", nil)
          otherButtonTitles:nil, nil]
         autorelease];

        [alert show];
        
    },YES);

    CFRunLoopRef runLoop = CFRunLoopGetMain();
    CFArrayRef allModes = CFRunLoopCopyAllModes(runLoop);
    
    while (!dismissed)
    {
        for (NSString *mode in (NSArray *)allModes)
        {
            CFRunLoopRunInMode((CFStringRef)mode, 0.001, false);
        }
    }
    
    CFRelease(allModes);
    
    kill(getpid(),0);
}

- (void)handleScriptError:(TiScriptError *)error
{
	[self showScriptError:error];
}

@end

@implementation TiScriptError

@synthesize message = _message;
@synthesize sourceURL = _sourceURL;
@synthesize lineNo = _lineNo;

- (id)initWithMessage:(NSString *)message sourceURL:(NSString *)sourceURL lineNo:(NSInteger)lineNo
{
    self = [super init];
    if (self) {
		_message = [message copy];
		_sourceURL = [sourceURL copy];
		_lineNo = lineNo;
    }
    return self;
}

- (id)initWithDictionary:(NSDictionary *)dictionary
{
	NSString *message = [[dictionary objectForKey:@"message"] description];
	NSString *sourceURL = [[dictionary objectForKey:@"sourceURL"] description];
	NSInteger lineNo = [[dictionary objectForKey:@"line"] integerValue];
    return [self initWithMessage:message sourceURL:sourceURL lineNo:lineNo];
}

- (void)dealloc
{
	RELEASE_TO_NIL(_message);
	RELEASE_TO_NIL(_sourceURL);
    [super dealloc];
}

- (NSString *)description
{
	if (self.sourceURL != nil) {
		return [NSString stringWithFormat:@"%@ at %@ (line %d)", self.message,[self.sourceURL lastPathComponent], self.lineNo];
	} else {
		return [NSString stringWithFormat:@"%@", self.message];
	}
}

@end

//
// thanks to: http://www.restoroot.com/Blog/2008/10/18/crash-reporter-for-iphone-applications/
//
static void TiUncaughtExceptionHandler(NSException *exception)
{
	static BOOL insideException = NO;
	
	// prevent recursive exceptions
	if (insideException==YES) {
		exit(1);
		return;
	}
	insideException = YES;
	
    NSArray *callStackArray = [exception callStackReturnAddresses];
    int frameCount = [callStackArray count];
    void *backtraceFrames[frameCount];
	
    for (int i = 0; i < frameCount; ++i) {
        backtraceFrames[i] = (void *)[[callStackArray objectAtIndex:i] unsignedIntegerValue];
    }
	char **frameStrings = backtrace_symbols(&backtraceFrames[0], frameCount);
	
	NSMutableArray *stack = [[NSMutableArray alloc] initWithCapacity:frameCount];
	if (frameStrings != NULL) {
		for (int i = 0; (i < frameCount) && (frameStrings[i] != NULL); ++i) {
			[stack addObject:[NSString stringWithCString:frameStrings[i] encoding:NSASCIIStringEncoding]];
		}
		free(frameStrings);
	}
	
	[[TiExceptionHandler defaultExceptionHandler] reportException:exception withStackTrace:[stack copy]];
	[stack release];
	
	insideException=NO;
	if (prevUncaughtExceptionHandler != NULL) {
		prevUncaughtExceptionHandler(exception);
	}
}
