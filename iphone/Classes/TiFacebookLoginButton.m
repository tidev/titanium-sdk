/**
 * Appcelerator Commercial License. Copyright (c) 2010 by Appcelerator, Inc.
 *
 * Appcelerator Titanium is Copyright (c) 2009-2010 by Appcelerator, Inc.
 * and licensed under the Apache Public License (version 2)
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

-(void)configurationSet
{
	[super configurationSet];
	
	id style = [TiUtils stringValue:[self.proxy valueForKey:@"style"]];
	int buttonStyle = [style isEqualToString:@"wide"] ? FB_LOGIN_BUTTON_WIDE : FB_LOGIN_BUTTON_NORMAL;
	CGRect frame = buttonStyle == FB_LOGIN_BUTTON_WIDE ? CGRectMake(0, 0, 79, 29) : CGRectMake(0, 0, 159, 29);
	// we force a constrained size instead of letting the user or the layout engine decide
	[self.proxy replaceValue:NUMINT(frame.size.width) forKey:@"width" notification:NO];
	[self.proxy replaceValue:NUMINT(frame.size.height) forKey:@"height" notification:NO];
	
	[[self module] addListener:self];
	
	button = [[FBLoginButton2 alloc] initWithFrame:frame];
	button.isLoggedIn = [[self module] isLoggedIn];
	[button updateImage];
	
	[button addTarget:self action:@selector(clicked:) forControlEvents:UIControlEventTouchUpInside];
	
	[self addSubview:button];
	[self recenterButton];
}

#pragma mark State Listener

-(void)login
{
	button.isLoggedIn = YES;
	[button updateImage];
	[self recenterButton];
}

-(void)logout
{
	button.isLoggedIn = NO;
	[button updateImage];
	[self recenterButton];
}


@end
#endif