/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIWEBVIEW

#import "TiUIWebViewProxy.h"
#import "TiUIWebView.h"
#import "TiUtils.h"
#import "TiBlob.h"
#import "TiHost.h"

@implementation TiUIWebViewProxy

static NSArray* webKeySequence;

#ifdef DEBUG_MEMORY
-(void)dealloc
{
	[super dealloc];
}

-(id)retain
{
	return [super retain];
}

-(void)release
{
	[super release];
}
#endif

-(NSArray *)keySequence
{
    if (webKeySequence == nil)
    {
        //URL has to be processed first since the spinner depends on URL being remote
        webKeySequence = [[NSArray arrayWithObjects:@"url",nil] retain];
    }
    return webKeySequence;
}

-(BOOL)shouldDetachViewForSpace
{
	return NO;
}

-(void)_initWithProperties:(NSDictionary *)properties
{
    [self replaceValue:[NSArray arrayWithObject:NUMINT(UIDataDetectorTypePhoneNumber)] forKey:@"autoDetect" notification:NO];
    [self initializeProperty:@"willHandleTouches" defaultValue:NUMBOOL(YES)];
    [super _initWithProperties:properties];
}


- (NSString*)evalJS:(id)code
{
	ENSURE_SINGLE_ARG(code,NSString);
    /*
     Using GCD either through dispatch_async/dispatch_sync or TiThreadPerformOnMainThread
     does not work reliably for evalJS on 5.0 and above. See sample in TIMOB-7616 for fail case.
     */
    if (![NSThread isMainThread]) {
        inKJSThread = YES;
        [self performSelectorOnMainThread:@selector(evalJS:) withObject:code waitUntilDone:YES];
        inKJSThread = NO;
    }
    else {
        evalResult = [[(TiUIWebView*)[self view] stringByEvaluatingJavaScriptFromString:code] retain];
    }
    return (inKJSThread ? evalResult : [evalResult autorelease]);
}

USE_VIEW_FOR_CONTENT_HEIGHT
USE_VIEW_FOR_CONTENT_WIDTH

- (NSString*)html
{
	NSString *html = [self evalJSAndWait:@"document.documentElement.outerHTML"];
	// strip out the ti injection - nobody wants that - and if 
	// you're saving off the HTML, we don't want to save that off since 
	// it's dynamically injected and can't be preserved
	NSRange range = [html rangeOfString:@"<script id=\"__ti_injection"];
	if (range.location!=NSNotFound)
	{
		NSRange nextRange = [html rangeOfString:@"</script" options:0 range:NSMakeRange(range.location, [html length]-range.location) locale:nil];
		if (nextRange.location!=NSNotFound)
		{
			NSString *before = [html substringToIndex:range.location];
			NSString *after = [html substringFromIndex:nextRange.location+9];
			return [NSString stringWithFormat:@"%@%@",before,after];
		}
	}
	return html;
}

-(void)goBack:(id)args
{
	TiThreadPerformOnMainThread(^{[(TiUIWebView*)[self view] goBack];}, NO);
}

-(void)goForward:(id)args
{
	TiThreadPerformOnMainThread(^{[(TiUIWebView*)[self view] goForward];}, NO);
}

-(void)stopLoading:(id)args
{
	TiThreadPerformOnMainThread(^{[(TiUIWebView*)[self view] stopLoading];}, NO);
}

-(void)reload:(id)args
{
	TiThreadPerformOnMainThread(^{[(TiUIWebView*)[self view] reload];}, NO);
}

-(void)setHtml:(NSString*)content withObject:(id)property
{
    [self replaceValue:content forKey:@"html" notification:NO];
    TiThreadPerformOnMainThread(^{
        [(TiUIWebView *)[self view] setHtml_:content withObject:property];
    }, YES);
}

-(id)canGoBack:(id)args
{
	if ([self viewAttached])
	{
		__block BOOL result;
		TiThreadPerformOnMainThread(^{result = [(TiUIWebView*)[self view] canGoBack];}, YES);
		return NUMBOOL(result);
	}
	return NUMBOOL(NO);
}

-(id)canGoForward:(id)args
{
	if ([self viewAttached])
	{
		__block BOOL result;
		TiThreadPerformOnMainThread(^{result = [(TiUIWebView*)[self view] canGoForward];}, YES);
		return NUMBOOL(result);
	}
	return NUMBOOL(NO);
}

-(void)setBasicAuthentication:(NSArray*)args
{
	[self makeViewPerformSelector:@selector(setBasicAuthentication:) withObject:args createIfNeeded:YES waitUntilDone:NO];
}

-(void)repaint:(id)unused
{
	[self contentsWillChange];
}

-(void)windowDidClose
{
    if (pageToken!=nil)
    {
        [[self host] unregisterContext:(id<TiEvaluator>)self forToken:pageToken];
        RELEASE_TO_NIL(pageToken);
    }
    NSNotification *notification = [NSNotification notificationWithName:kTiContextShutdownNotification object:self];
    WARN_IF_BACKGROUND_THREAD_OBJ;
    [[NSNotificationCenter defaultCenter] postNotification:notification];
    [super windowDidClose];
}

-(void)_destroy
{
	if (pageToken!=nil)
	{
		[[self host] unregisterContext:(id<TiEvaluator>)self forToken:pageToken];
		RELEASE_TO_NIL(pageToken);
	}
    [super _destroy];
}

-(void)setPageToken:(NSString*)pageToken_
{
	if (pageToken != nil)
	{
		[[self host] unregisterContext:(id<TiEvaluator>)self forToken:pageToken];
		RELEASE_TO_NIL(pageToken);
	}
	pageToken = [pageToken_ retain];
	[[self host] registerContext:self forToken:pageToken];
}

#pragma mark Evaluator

- (BOOL)evaluationError
{
	// TODO; is this correct
	return NO;
}

- (TiHost*)host
{
	return [self _host];
}

- (void)evalFile:(NSString*)file
{
	TiThreadPerformOnMainThread(^{[(TiUIWebView*)[self view] evalFile:file];}, NO);
}

- (id)evalJSAndWait:(NSString*)code
{
	__block id result;
	TiThreadPerformOnMainThread(^{result=[[(TiUIWebView*)[self view] stringByEvaluatingJavaScriptFromString:code] retain];}, YES);
	return [result autorelease];
}

- (void)fireEvent:(id)listener withObject:(id)obj remove:(BOOL)yn thisObject:(id)thisObject_
{
	TiThreadPerformOnMainThread(^{
		[(TiUIWebView*)[self view] fireEvent:listener withObject:obj remove:yn thisObject:thisObject_];
	}, NO);
}

- (id)preloadForKey:(id)key name:(id)name
{
	return nil;
}

- (KrollContext*)krollContext
{
	return nil;
}

- (id)registerProxy:(id)proxy
{
	return nil;
}

- (void)unregisterProxy:(id)proxy
{
}

//TODO: Is this correct?
- (BOOL)usesProxy:(id)proxy;
{
	return NO;
}

//TODO: Is this correct?
- (id)krollObjectForProxy:(id)proxy
{
	return nil;
}

-(void)evalJSWithoutResult:(NSString*)code
{
	[self evalJS:code];
}

- (NSString*)basename
{
	return nil;
}

- (NSURL *)currentURL
{
	return nil;
}

-(void)setCurrentURL:(NSURL *)unused
{

}

DEFINE_DEF_PROP(scrollsToTop,[NSNumber numberWithBool:YES]);

@end

#endif