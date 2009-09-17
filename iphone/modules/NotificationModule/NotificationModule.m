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
	[notificationView removeFromSuperview];
	[notificationView release];
	[closeButton removeFromSuperview];
	[closeButton release];
	[notificationButton removeFromSuperview];
	[notificationButton release];
	[super dealloc];
}

- (UIWebView *) notificationView;
{
	if(notificationView == nil){
		notificationView = [[UIWebView alloc] init];
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
		[closeButton setShowsTouchWhenHighlighted:YES];
		[closeButton setImage:closeImage forState:UIControlStateNormal];
		[closeButton setAlpha:0.0];
		[closeButton addTarget:self action:@selector(closeButtonPressed:) forControlEvents:UIControlEventTouchUpInside];
	}
	return closeButton;
}

- (UIButton *) notificationButton;
{
	if(notificationButton==nil){
		notificationButton = [[UIButton buttonWithType:UIButtonTypeCustom] retain];
		[notificationButton setAlpha:0.0];
		[notificationButton addTarget:self action:@selector(notificationPressed:) forControlEvents:UIControlEventTouchUpInside];
	}
	return notificationButton;
}

- (CGRect) addToView: (UIView *) superView inRect: (CGRect) bounds;
{
	if((notificationView==nil) || [notificationView isLoading] || ([notificationView request]==nil))return bounds;
	
	NSString * documentHeightString = [notificationView stringByEvaluatingJavaScriptFromString:@"document.height"];
	float documentHeight = [documentHeightString floatValue];
	
	CGRect notificationFrame;
	notificationFrame.size.height = documentHeight;
	notificationFrame.size.width = bounds.size.width;
	notificationFrame.origin.x = bounds.origin.x;
	notificationFrame.origin.y = bounds.origin.y + bounds.size.height - documentHeight;
	
	[notificationView setFrame:notificationFrame];
	[[self notificationButton] setFrame:notificationFrame];

	CGRect closeFrame=[closeButton frame];
	closeFrame.origin.y = notificationFrame.origin.y - 5;
	
	if([notificationView superview]!=superView){
		[superView addSubview:notificationView];
		[superView addSubview:closeButton];
		[superView addSubview:notificationButton];
		[notificationView setAlpha:1.0];
		[closeButton setAlpha:1.0];
		[notificationButton setAlpha:1.0];
	}
	
	bounds.size.height -= documentHeight;
	
	return bounds;
}

- (void) loadHtmlString: (NSString *) htmlString;
{
	TitaniumWebViewController * callingView = (TitaniumWebViewController *)
			[[TitaniumHost sharedHost] titaniumContentViewControllerForToken:[self parentPageToken]];
	
	[[self notificationView] loadHTMLString:htmlString baseURL:[callingView currentContentURL]];
}

- (void)webViewDidFinishLoad:(UIWebView *)webView;
{
	TitaniumViewController * owningWindow = (TitaniumViewController *)
		[[TitaniumHost sharedHost] titaniumViewControllerForToken:[self parentPageToken]];
	[owningWindow needsUpdate:TitaniumViewControllerRefreshIsAnimated];
}

- (IBAction) closeButtonPressed: (id) sender;
{
	
}

- (IBAction) notificationPressed: (id) sender;
{
	
}




@end


@implementation NotificationModule

#define NOTIFICATION_SHOW			0


- (void) notification: (NSString *) token takeAction: (NSNumber *) actionObject options: (id) args;
{
	
}

- (NSString *) createNotification: (NSDictionary *) proxyObject;
{
	if([proxyObject isKindOfClass:[NSDictionary class]])return nil;

	NSString * token=[NSString stringWithFormat:@"NOTE%d",nextProxyToken++];

	
	
	NotificationProxy * ourProxy = [[[NotificationProxy alloc] init] autorelease];
	if(proxiesDict == nil){
		proxiesDict = [[NSMutableDictionary alloc] initWithObjectsAndKeys:ourProxy,token,nil];
	} else {
		[proxiesDict setObject:ourProxy forKey:token];
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

	
	TitaniumJSCode * notificationObjectCode = [TitaniumJSCode codeWithString:@"function(){}"];
	[notificationObjectCode setEpilogueCode:@"Ti.Notification.Notification.prototype={"
			"ensureToken:function(){if(!this._TOKEN){var tkn=Ti.Notification._MKNOT(this);this._TOKEN=tkn;Ti.Notification._NOTES[tkn]=this;}},"
			"show:function(args){this.ensureToken();Ti.Notification._ACTNOT(this._TOKEN," STRINGVAL(NOTIFICATION_SHOW) ",args);},"
			""
			"};"];
		
	NSDictionary * moduleDict = [NSDictionary dictionaryWithObjectsAndKeys:
			createInvoc,@"_MKNOT",
			noteActionInvoc,@"_ACTNOT",
			[TitaniumJSCode codeWithString:@"{}"],@"_NOTES",
			notificationObjectCode,@"Notification",
			[TitaniumJSCode codeWithString:@"function(args){return new Ti.Notification.Notification(args);}"],@"createNotification",
//								beepInvoc, @"beep",
//								vibeInvoc, @"vibrate",
//								newSoundInvoc, @"createSound",
//								[TitaniumJSCode codeWithString:iPhoneSoundGeneratorFunction],@"_SNDGEN",
//								[TitaniumJSCode codeWithString:createVideoString],@"createVideoPlayer",
//								mediaDictionary,@"_MEDIA",
//								importImageInvoc,@"_NEWPIC",
//								saveImageInvoc,@"saveToPhotoGallery",
//								
//								newMovieInvoc,@"_NEWMOV",
//								playMovieInvoc,@"_PLAYMOV",
//								stopMovieInvoc,@"_STOPMOV",
//								releaseInvoc,@"_REL",
//								
//								[TitaniumJSCode codeWithString:showCameraString],@"showCamera",
//								[TitaniumJSCode codeWithString:showPickerString],@"openPhotoGallery",
//								
//								
//								[NSNumber numberWithInt:MediaModuleErrorUnknown],@"UNKNOWN_ERROR",
//								[NSNumber numberWithInt:MediaModuleErrorImagePickerBusy],@"DEVICE_BUSY",
//								[NSNumber numberWithInt:MediaModuleErrorNoCamera],@"NO_CAMERA",
//								
//								[NSNumber numberWithInt:MPMovieControlModeDefault],@"VIDEO_CONTROL_DEFAULT",
//								[NSNumber numberWithInt:MPMovieControlModeVolumeOnly],@"VIDEO_CONTROL_VOLUME_ONLY",
//								[NSNumber numberWithInt:MPMovieControlModeHidden],@"VIDEO_CONTROL_HIDDEN",
//								[NSNumber numberWithInt:MPMovieScalingModeNone],@"VIDEO_SCALING_NONE",
//								[NSNumber numberWithInt:MPMovieScalingModeAspectFit],@"VIDEO_SCALING_ASPECT_FIT",
//								[NSNumber numberWithInt:MPMovieScalingModeAspectFill],@"VIDEO_SCALING_ASPECT_FILL",
//								[NSNumber numberWithInt:MPMovieScalingModeFill],@"VIDEO_SCALING_MODE_FILL",
								
								nil];
	[[[TitaniumHost sharedHost] titaniumObject] setObject:moduleDict forKey:@"Notification"];
	
	return YES;
}

- (BOOL) endModule;
{
	return YES;
}

@end
