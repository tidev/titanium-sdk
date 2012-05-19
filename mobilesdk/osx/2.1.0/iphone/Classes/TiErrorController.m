/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <QuartzCore/QuartzCore.h>
#import "TiErrorController.h"
#import "TiApp.h"
#import "TiBase.h"
#import "TiUtils.h"


@implementation TiErrorController

-(id)initWithError:(NSString*)error_
{
	if (self = [super init])
	{
		error = [error_ retain];
	}
	return self;
}

-(void)dealloc
{
	RELEASE_TO_NIL(error);
	[super dealloc];
}

-(UILabel*)dynamicLabel:(NSString*)text width:(CGFloat)width height:(CGFloat)height fontSize:(CGFloat)fontSize bottom:(CGFloat)bottom
{
	CGSize textSize = { width, 2000.0f };
	CGSize size = [text sizeWithFont:[UIFont systemFontOfSize:fontSize] constrainedToSize:textSize lineBreakMode:UILineBreakModeWordWrap];
	
	UILabel *label = [[UILabel alloc] initWithFrame:CGRectMake(10, height-bottom-size.height, width-20, size.height+50)];
	[label setText:text];
	[label setFont:[UIFont boldSystemFontOfSize:fontSize]];
	[label setBackgroundColor:[UIColor clearColor]];
	[label setTextAlignment:UITextAlignmentCenter];
	[label setLineBreakMode:UILineBreakModeWordWrap];
	[label setNumberOfLines:0];
	return [label autorelease];
}

-(void)dismiss:(id)sender
{
	[[TiApp app] hideModalController:self animated:YES];
}

- (void)loadView 
{
	self.modalTransitionStyle = UIModalTransitionStyleCoverVertical;
	
	UIView *view = [[UIView alloc] initWithFrame:[UIScreen mainScreen].applicationFrame];
	[view setBackgroundColor:[UIColor redColor]];
	
	UILabel *title = [[UILabel alloc] initWithFrame:CGRectMake(0, 20, view.bounds.size.width, 35)];
	[title setText:@"Application Error"];
	[title setFont:[UIFont boldSystemFontOfSize:32]];
	[title setBackgroundColor:[UIColor clearColor]];
	[title setTextAlignment:UITextAlignmentCenter];
	[title setTextColor:[UIColor greenColor]];
	[title setShadowColor:[UIColor darkGrayColor]];
	[title setShadowOffset:CGSizeMake(2.3, 1)];
	[view addSubview:title];
	[title release];
	
	NSString *text = @"Error messages will only be displayed during development. When your app is packaged for final distribution, no error screen will appear. Test your code!";
	UILabel *footer = [self dynamicLabel:text width:view.bounds.size.width height:view.bounds.size.height fontSize:14.0f bottom:55];
	[footer setTextColor:[UIColor blackColor]];
	[view addSubview:footer];
	
	UILabel *message = [self dynamicLabel:error width:view.bounds.size.width height:view.bounds.size.height fontSize:20.0f bottom:285];
	[message setTextColor:[UIColor whiteColor]];
	[message setShadowColor:[UIColor blackColor]];
	[view addSubview:message];
	
	UIButton *button = [UIButton buttonWithType:UIButtonTypeRoundedRect];
	[button setTitle:@"Dismiss" forState:UIControlStateNormal];
	CGFloat left = ( view.bounds.size.width / 2 ) - 70;
	[TiUtils setView:button positionRect:CGRectMake(left, view.bounds.size.height-170, 140, 40)];
	[button setTitleColor:[UIColor darkGrayColor] forState:UIControlStateNormal];
	[view addSubview:button];
	
	[button addTarget:self action:@selector(dismiss:) forControlEvents:UIControlEventTouchUpInside];
	
	self.view = view;
	
	[view release];
}

@end
