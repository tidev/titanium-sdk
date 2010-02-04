/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUISwitch.h"
#import "TiUtils.h"
#import "TiUIWidgetProxy.h"

@implementation TiUISwitch

//-(void)relayout:(CGRect)bounds
//{
////TODO: Move this further up, because auto can be very very useful.
//	[super relayout:bounds];
//
//	BOOL inBar = [(TiUIWidgetProxy *)[self proxy] isUsingBarButtonItem];
//	
//	CGRect ourFrame = [TiUtils viewPositionRect:self];
//	CGSize wantedSize = [switchView sizeThatFits:CGSizeZero];
//	
//	ourFrame.origin.x += (ourFrame.size.width - wantedSize.width)/2;
//	ourFrame.size.width = wantedSize.width;
//
//	ourFrame.origin.y += (ourFrame.size.height - wantedSize.height)/2;
//	ourFrame.size.height = wantedSize.height;
//
//	if (inBar)
//	{
//		ourFrame.origin = CGPointZero;
//	}
//	
//	[TiUtils setView:self positionRect:ourFrame];
//}


-(void)dealloc
{
	[switchView removeTarget:self action:@selector(switchChanged:) forControlEvents:UIControlEventValueChanged];
	RELEASE_TO_NIL(switchView);
	[super dealloc];
}

-(UISwitch*)switchView
{
	if (switchView==nil)
	{
		switchView = [[UISwitch alloc] init];
		[switchView addTarget:self action:@selector(switchChanged:) forControlEvents:UIControlEventValueChanged];
		[self addSubview:switchView];
	}
	return switchView;
}

#pragma mark View controller stuff

-(void)setEnabled_:(id)value
{
	[[self switchView] setEnabled:[TiUtils boolValue:value]];
}

-(void)setValue_:(id)value
{
	BOOL newValue = [TiUtils boolValue:value];
	UISwitch * ourSwitch = [self switchView];
	[ourSwitch setOn:newValue animated:YES];
	[self switchChanged:ourSwitch];
}

- (IBAction)switchChanged:(id)sender
{
	[[self proxy] switchChanged:sender];
}

-(CGFloat)verifyWidth:(CGFloat)suggestedWidth
{
	return [switchView sizeThatFits:CGSizeZero].width;
}

-(CGFloat)verifyHeight:(CGFloat)suggestedHeight
{
	return [switchView sizeThatFits:CGSizeZero].height;
}

-(UIViewAutoresizing)verifyAutoresizing:(UIViewAutoresizing)suggestedResizing
{
	return suggestedResizing & ~(UIViewAutoresizingFlexibleHeight|UIViewAutoresizingFlexibleWidth);
}


@end
