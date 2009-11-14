/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */


#import "NotificationModule.h"
#import "TitaniumHost.h"
#import <QuartzCore/CALayer.h>
#import "TitaniumJSCode.h"
#import "TitaniumInvocationGenerator.h"
#import "TitaniumViewController.h"

@implementation NotificationProxy

- (id) init
{
	self = [super init];
	if (self != nil) {
		
	}
	return self;
}

- (void) dealloc
{
	[self removeFromSuperview];
	[notificationView release];
	[closeButton release];
	[notificationButton release];
	[super dealloc];
}

- (UIWebView *) notificationView;
{
	if(notificationView == nil){
		notificationView = [[UIWebView alloc] initWithFrame:CGRectMake(0, 0, 320, 0)];
		[notificationView setDelegate:self];
		[notificationView setBackgroundColor:[UIColor clearColor]];
		[(id)notificationView setDetectsPhoneNumbers:NO];
		[notificationView setUserInteractionEnabled:NO];
		[[notificationView layer] setZPosition:NOTIFICATION_VIEW_Z];
		[notificationView setAlpha:0.0];
		[notificationView setOpaque:NO];
	}
	return notificationView;
}

- (UIButton *) closeButton;
{
	if(closeButton == nil){
		CGRect imageFrame;
		imageFrame.origin=CGPointZero;
		UIImage * closeImage = [UIImage imageNamed:@"closebox.png"];
		imageFrame.size = [closeImage size];
		closeButton = [[UIButton buttonWithType:UIButtonTypeCustom] retain];
		[closeButton setFrame:imageFrame];
		[closeButton setShowsTouchWhenHighlighted:YES];
		[closeButton setImage:closeImage forState:UIControlStateNormal];
		[closeButton setAlpha:0.0];
		[[closeButton layer] setZPosition:NOTIFICATION_CLOSE_Z];
		[closeButton addTarget:self action:@selector(closeButtonPressed:) forControlEvents:UIControlEventTouchUpInside];
	}
	return closeButton;
}

- (UIButton *) notificationButton;
{
	if(notificationButton==nil){
		notificationButton = [[UIButton buttonWithType:UIButtonTypeCustom] retain];
		[notificationButton setAlpha:0.0];
		[[notificationButton layer] setZPosition:NOTIFICATION_BTN_Z];
		[notificationButton addTarget:self action:@selector(notificationPressed:) forControlEvents:UIControlEventTouchUpInside];
	}
	return notificationButton;
}

- (TitaniumViewController *) titaniumWindow;
{
	return 	[[TitaniumHost sharedHost] titaniumViewControllerForToken:[self parentPageToken]];
}


- (void) removeFromSuperview;
{
	[notificationView removeFromSuperview];
	[closeButton removeFromSuperview];
	[notificationButton removeFromSuperview];	
}

- (CGFloat) placeInView: (UIView *) superView inRect: (CGRect) bounds;
{
	if(notificationView==nil)return 0;
		
	CGRect notificationFrame = CGRectMake(bounds.origin.x, 0, bounds.size.width, 10);
	[notificationView setFrame:notificationFrame];
	if([notificationView isLoading] || ([notificationView request]==nil))return 0;
	
	NSString * documentHeightString = [notificationView stringByEvaluatingJavaScriptFromString:@"document.height"];
	float documentHeight = [documentHeightString floatValue];
	
	notificationFrame.size.height = documentHeight;
	notificationFrame.origin.y = 10 + (bounds.origin.y + bounds.size.height - documentHeight);
	
	[notificationView setFrame:notificationFrame];
	[[self notificationButton] setFrame:notificationFrame];

	CGRect closeFrame=[[self closeButton] frame];
	closeFrame.origin.y = notificationFrame.origin.y - 5;
	[closeButton setFrame:closeFrame];
	
	if([notificationView superview]!=superView){
		[superView addSubview:notificationView];
		[superView addSubview:notificationButton];
		[superView addSubview:closeButton];
		[notificationView setAlpha:1.0];
		[closeButton setAlpha:1.0];
		[notificationButton setAlpha:1.0];
	}
	
	return documentHeight;
}

- (void) loadHtmlString: (NSString *) htmlString;
{
	TitaniumWebViewController * callingView = (TitaniumWebViewController *)
			[[TitaniumHost sharedHost] titaniumContentViewControllerForToken:[self parentPageToken]];
	
	[[self notificationView] loadHTMLString:htmlString baseURL:[callingView currentContentURL]];
}

- (void)webViewDidFinishLoad:(UIWebView *)webView;
{
	[[self titaniumWindow] needsUpdate:TitaniumViewControllerRefreshIsAnimated];
}

- (void)triggerEvent: (NSString *)eventKind values: (NSString *)values;
{
	if(values==nil)values=@"";
	NSString * commandString = [NSString stringWithFormat:@"Ti.Notification._NOTES.%@.doEvent('%@',{type:'%@',%@})",token,eventKind,eventKind,values];
	[self sendJavascript:commandString];
}

- (void)show;
{
	[[self titaniumWindow] addNotification:self];
}

-(void)hide;
{	
	[self triggerEvent:@"close" values:@"userInput:false"];
	[[self titaniumWindow] removeNotification:self];
	[self performSelectorOnMainThread:@selector(removeFromSuperview) withObject:nil waitUntilDone:NO];
}

- (IBAction) closeButtonPressed: (id) sender;
{
	[self triggerEvent:@"close" values:@"userInput:true"];
	[[self titaniumWindow] removeNotification:self];
	[self removeFromSuperview];
}

- (IBAction) notificationPressed: (id) sender;
{
	[self triggerEvent:@"click" values:nil];
}




@end


@implementation NotificationModule

#define NOTIFICATION_SHOW				0
#define NOTIFICATION_HIDE				1
#define NOTIFICATION_SETHTTP			2
#define NOTIFICATION_CLOSEVISIBILITY	3

- (void) notification: (NSString *) token takeAction: (NSNumber *) actionObject options: (id) args;
{
	if(![token isKindOfClass:[NSString class]] || ![actionObject respondsToSelector:@selector(intValue)])return;
	NotificationProxy * ourProxy = [proxiesDict objectForKey:token];
	if(ourProxy == nil)return;
	switch ([actionObject intValue]) {
		case NOTIFICATION_SHOW:{
			[ourProxy show];
			return;
		}
		case NOTIFICATION_HIDE:{
			[ourProxy hide];
			return;
		}
	}
}

- (NSString *) createNotification: (NSDictionary *) proxyObject;
{
	if(![proxyObject isKindOfClass:[NSDictionary class]])return nil;

	NSString * token=[NSString stringWithFormat:@"NOTE%d",nextProxyToken++];
	NotificationProxy * ourProxy = [[[NotificationProxy alloc] init] autorelease];
	[ourProxy setToken:token];

	if(proxiesDict == nil){
		proxiesDict = [[NSMutableDictionary alloc] initWithObjectsAndKeys:ourProxy,token,nil];
	} else {
		[proxiesDict setObject:ourProxy forKey:token];
	}

	NSString * htmlString = [proxyObject objectForKey:@"html"];
	if([htmlString isKindOfClass:[NSString class]]){
		[ourProxy performSelectorOnMainThread:@selector(loadHtmlString:) withObject:htmlString waitUntilDone:NO];
	}
	
	return token;
}



#pragma mark Start Module
#define STRINGIFY(foo)	# foo
#define STRINGVAL(foo)	STRINGIFY(foo)


- (BOOL) startModule;
{
	TitaniumInvocationGenerator * invocGen = [TitaniumInvocationGenerator generatorWithTarget:self];
	
	[(NotificationModule *)invocGen createNotification:nil];
	NSInvocation * createInvoc = [invocGen invocation];

	[(NotificationModule *)invocGen notification:nil takeAction:nil options:nil];
	NSInvocation * noteActionInvoc = [invocGen invocation];

	
	TitaniumJSCode * notificationObjectCode = [TitaniumJSCode codeWithString:@"function(vals){"
			"for(prop in vals){this[prop]=vals[prop];}this._EVT={click:[],close:[]};}"];
	[notificationObjectCode setEpilogueCode:@"Ti.Notification.Notification.prototype={"
			"ensureToken:function(){if(!this._TOKEN){var tkn=Ti.Notification._MKNOT(this);this._TOKEN=tkn;Ti.Notification._NOTES[tkn]=this;}},"
			"show:function(args){this.ensureToken();Ti.Notification._ACTNOT(this._TOKEN," STRINGVAL(NOTIFICATION_SHOW) ",args);},"
			"hide:function(args){if(this._TOKEN){Ti.Notification._ACTNOT(this._TOKEN," STRINGVAL(NOTIFICATION_HIDE) ",args);}},"
			"addEventListener:Titanium._ADDEVT,removeEventListener:Ti._REMEVT,doEvent:Ti._ONEVT,"
			"};"];
		
	NSDictionary * moduleDict = [NSDictionary dictionaryWithObjectsAndKeys:
			createInvoc,@"_MKNOT",
			noteActionInvoc,@"_ACTNOT",
			[TitaniumJSCode codeWithString:@"{}"],@"_NOTES",
			notificationObjectCode,@"Notification",
			[TitaniumJSCode codeWithString:@"function(args){return new Ti.Notification.Notification(args);}"],@"createNotification",
								nil];
	[[[TitaniumHost sharedHost] titaniumObject] setObject:moduleDict forKey:@"Notification"];
	
	return YES;
}

- (BOOL) endModule;
{
	return YES;
}

@end
