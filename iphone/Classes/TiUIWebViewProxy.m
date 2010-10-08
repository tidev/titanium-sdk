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

-(BOOL)shouldDetachViewForSpace
{
	return NO;
}

-(void)_initWithProperties:(NSDictionary *)properties
{
	[self replaceValue:[NSArray arrayWithObject:NUMINT(UIDataDetectorTypePhoneNumber)] forKey:@"autoDetect" notification:NO];
	[super _initWithProperties:properties];
}


- (NSString*)evalJS:(id)code
{
	ENSURE_SINGLE_ARG(code,NSString);
	TiBlob *result = [[[TiBlob alloc] _initWithPageContext:[self executionContext]] autorelease];
	[[self view] performSelectorOnMainThread:@selector(evalJS:) withObject:[NSArray arrayWithObjects:code,result,nil] waitUntilDone:YES];
	return [result text];
}

USE_VIEW_FOR_AUTO_HEIGHT
USE_VIEW_FOR_AUTO_WIDTH

- (NSString*)html
{
	NSString *html = [self evalJS:@"document.documentElement.outerHTML"];
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
//Todo: We should probably replace this with using USE_VIEW_FOR_UI_METHOD, but it ain't broke currently.
	[[self view] performSelectorOnMainThread:@selector(goBack:) withObject:args waitUntilDone:NO];
}

-(void)goForward:(id)args
{
//Todo: We should probably replace this with using USE_VIEW_FOR_UI_METHOD, but it ain't broke currently.
	[[self view] performSelectorOnMainThread:@selector(goForward:) withObject:args waitUntilDone:NO];
}

-(void)stopLoading:(id)args
{
//Todo: We should probably replace this with using USE_VIEW_FOR_UI_METHOD, but it ain't broke currently.
	[[self view] performSelectorOnMainThread:@selector(stopLoading:) withObject:args waitUntilDone:NO];
}

-(void)reload:(id)args
{
//Todo: We should probably replace this with using USE_VIEW_FOR_UI_METHOD, but it ain't broke currently.
	[[self view] performSelectorOnMainThread:@selector(reload:) withObject:args waitUntilDone:NO];
}

-(id)canGoBack:(id)args
{
	if ([self viewAttached])
	{
		NSMutableArray *result = [NSMutableArray array];
		[[self view] performSelectorOnMainThread:@selector(canGoBack:) withObject:result waitUntilDone:YES];
		return [result objectAtIndex:0];
	}
	return NUMBOOL(NO);
}

-(id)canGoForward:(id)args
{
	if ([self viewAttached])
	{
		NSMutableArray *result = [NSMutableArray array];
		[[self view] performSelectorOnMainThread:@selector(canGoForward:) withObject:result waitUntilDone:YES];
		return [result objectAtIndex:0];
	}
	return NUMBOOL(NO);
}

-(void)setBasicAuthentication:(NSArray*)args
{
	[[self view] performSelectorOnMainThread:@selector(setBasicAuthentication:) withObject:args waitUntilDone:NO];
}

-(void)repaint:(id)unused
{
	[self contentsWillChange];
}

-(void)windowDidClose
{
	[self _destroy];
	NSNotification *notification = [NSNotification notificationWithName:kTiContextShutdownNotification object:self];
	WARN_IF_BACKGROUND_THREAD_OBJ;	//NSNotificationCenter is not threadsafe!
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
	RELEASE_TO_NIL(pageToken);
	pageToken = [pageToken_ retain];
	[[self host] registerContext:self forToken:pageToken];
}

#pragma mark Evaluator

- (TiHost*)host
{
	return [self _host];
}

- (void)evalFile:(NSString*)file
{
	[[self view] performSelectorOnMainThread:@selector(evalFile:) withObject:file waitUntilDone:NO];
}

- (id)evalJSAndWait:(NSString*)code
{
	return [(TiUIWebView*)[self view] evalJSAndWait:code];
}

- (void)fireEvent:(id)listener withObject:(id)obj remove:(BOOL)yn thisObject:(id)thisObject_
{
	[(TiUIWebView*)[self view] fireEvent:listener withObject:obj remove:yn thisObject:thisObject_];
}

- (id)preloadForKey:(id)key
{
}

- (KrollContext*)krollContext
{
}

- (void)registerProxy:(id)proxy
{
}

- (void)unregisterProxy:(id)proxy
{
}

-(void)evalJSWithoutResult:(NSString*)code
{
	[self evalJS:code];
}

- (NSString*)basename
{
	return nil;
}


@end

#endif