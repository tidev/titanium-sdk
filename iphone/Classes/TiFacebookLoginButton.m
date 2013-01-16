/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_FACEBOOK
#import "TiFacebookLoginButton.h"
#import "TiFacebookLoginButtonProxy.h"

@implementation TiFacebookLoginButton

-(void)recenterButton
{
	[TiUtils setView:button positionRect:[TiUtils centerRect:[button frame] inRect:[self bounds]]];
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	if (button!=nil)
	{
		[TiUtils setView:button positionRect:bounds];
		[button sizeToFit];
		[self recenterButton];
	}
    [super frameSizeChanged:frame bounds:bounds];
}

-(FacebookModule*)module
{
	TiFacebookLoginButtonProxy *p = (TiFacebookLoginButtonProxy*)self.proxy;
	return p._module;
}

-(void)dealloc
{
	[[self module] removeListener:self];
	RELEASE_TO_NIL(button);
	[super dealloc];
}
	 
-(void)clicked:(id)sender
{
	if (button.isLoggedIn)
	{
		[[self module] logout:nil];
	}
	else
	{
		[[self module] authorize:nil];
	}
}

-(CGRect)frameForButtonStyle:(int)buttonStyle
{
	return buttonStyle == FB_LOGIN_BUTTON_WIDE ? CGRectMake(0, 0, 159, 29) : CGRectMake(0, 0, 79, 29);
}

-(int)getStyleAndChangeSize:(id)style
{
	int buttonStyle = [TiUtils intValue:style];
	
	CGRect frame = [self frameForButtonStyle:buttonStyle];
	
	// we force a constrained size instead of letting the user or the layout engine decide -
	// have to set these through their proper setters or else the layout is never updated!
	// Note that we use 'internal' methods because we have to override the normal width/height setters.
	[(TiFacebookLoginButtonProxy*)[self proxy] internalSetWidth:NUMINT(frame.size.width)];
	[(TiFacebookLoginButtonProxy*)[self proxy] internalSetHeight:NUMINT(frame.size.height)];
	
	return buttonStyle;
}

// NOTE: This is actually called BEFORE any configuration is set!  We don't necessarily have any properties
// before this is called... but who knows, maybe we do.
-(void)configurationSet
{
	[super configurationSet];
	
	id style = [TiUtils stringValue:[self.proxy valueForKey:@"style"]];
	int buttonStyle = [self getStyleAndChangeSize:style];

	// Create the default button, and set the default size
	[[self module] addListener:self];
	
	button = [[FBLoginButton alloc] initWithFrame:[self frameForButtonStyle:buttonStyle]];
	button.isLoggedIn = [[self module] isLoggedIn];
	button.style = buttonStyle;
	[button updateImage];
	[button sizeToFit];
	
	[button addTarget:self action:@selector(clicked:) forControlEvents:UIControlEventTouchUpInside];
	
	[self addSubview:button];
	[self recenterButton];
}

-(void)setStyle_:(id)style
{
	[self.proxy replaceValue:style forKey:@"style" notification:NO];
	if (button != nil) {
		button.style = [self getStyleAndChangeSize:style];
		[button updateImage];
		[button sizeToFit];
		[self recenterButton];
	}
}

#pragma mark State Listener

-(void)login
{
	button.isLoggedIn = YES;
	[button updateImage];
	[button sizeToFit];
	[self recenterButton];
}

-(void)logout
{
	button.isLoggedIn = NO;
	[button updateImage];
	[button sizeToFit];
	[self recenterButton];
}

- (id)accessibilityElement
{
	return button;
}


@end
#endif