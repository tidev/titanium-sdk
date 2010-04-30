/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_FACEBOOK

#import "TiFacebookLoginButton.h"
#import "TiUtils.h"

@implementation TiFacebookLoginButton

-(void)dealloc
{
	if (button!=nil)
	{
		[button.session.delegates removeObject:self];
		RELEASE_TO_NIL(button);
	}
	[super dealloc];
}

-(void)recenterButton
{
	[TiUtils setView:button positionRect:[TiUtils centerRect:[button frame] inRect:[self bounds]]];
}

-(FBLoginButton*)button
{
	if (button==nil)
	{
		id style = [TiUtils stringValue:[self.proxy valueForKey:@"style"]];
		int buttonStyle = [style isEqualToString:@"wide"] ? FBLoginButtonStyleWide : FBLoginButtonStyleNormal;
		CGRect frame = buttonStyle == FBLoginButtonStyleNormal ? CGRectMake(0, 0, 92, 32) : CGRectMake(0, 0, 172, 32);
		// we force a constrained size instead of letting the user or the layout engine decide
		[self.proxy replaceValue:NUMINT(frame.size.width) forKey:@"width" notification:NO];
		[self.proxy replaceValue:NUMINT(frame.size.height) forKey:@"height" notification:NO];
		button = [[FBLoginButton alloc] initWithFrame:frame];
		button.style = buttonStyle;
		button.session = [self.proxy valueForKey:@"session"];
		[self addSubview:button];
		[button.session.delegates addObject:self];
	}
	return button;
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	if (button!=nil)
	{
		[TiUtils setView:button positionRect:bounds];
		[button sizeToFit];
		[self recenterButton];

	}
}

-(void)setSession_:(id)session
{
	[self button];
}

#pragma mark Delegates

/**
 * Called when a user has successfully logged in and begun a session.
 */
- (void)session:(FBSession*)session didLogin:(FBUID)uid
{
	if ([self.proxy _hasListeners:@"login"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:[NSNull null],@"error",[NSNumber numberWithBool:false],@"success",[NSNumber numberWithBool:true],@"cancel",@"login",@"event",nil];
		[self.proxy fireEvent:@"login" withObject:event];
	}
	[self recenterButton];
}

/**
 * Called when a user closes the login dialog without logging in.
 */
- (void)sessionDidNotLogin:(FBSession*)session
{
	if ([self.proxy _hasListeners:@"cancel"])
	{
		[self.proxy fireEvent:@"cancel" withObject:nil];
	}
}

/**
 * Called when a session has logged out.
 */
- (void)sessionDidLogout:(FBSession*)session
{
	if ([self.proxy _hasListeners:@"logout"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:[NSNull null],@"error",[NSNumber numberWithBool:true],@"success",[NSNumber numberWithBool:false],@"cancel",@"logout",@"event",nil];
		[self.proxy fireEvent:@"logout" withObject:event];
	}
	[self recenterButton];
}


@end

#endif