/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUISwitch.h"
#import "TiUtils.h"
#import "TiViewProxy.h"

@implementation TiUISwitch

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

- (id)accessibilityElement
{
	return [self switchView];
}

-(BOOL)hasTouchableListener
{
	// since this guy only works with touch events, we always want them
	// just always return YES no matter what listeners we have registered
	return YES;
}

#pragma mark View controller stuff

-(void)setEnabled_:(id)value
{
	[[self switchView] setEnabled:[TiUtils boolValue:value]];
}

-(void)setValue_:(id)value
{
	// need to check if we're in a reproxy when this is set
	// so we don't artifically trigger a change event or 
	// animate the change -- this happens on the tableview
	// reproxy as we scroll
	BOOL reproxying = [self.proxy inReproxy];
	BOOL newValue = [TiUtils boolValue:value];
	BOOL animated = !reproxying;
	UISwitch * ourSwitch = [self switchView];
    if ([ourSwitch isOn] == newValue) {
        return;
    }
	[ourSwitch setOn:newValue animated:animated];
	
	// Don't rely on switchChanged: - isOn can report erroneous values immediately after the value is changed!  
	// This only seems to happen in 4.2+ - could be an Apple bug.
	if ((reproxying == NO) && configurationSet && [self.proxy _hasListeners:@"change"])
	{
		[self.proxy fireEvent:@"change" withObject:[NSDictionary dictionaryWithObject:value forKey:@"value"]];
	}
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	[super frameSizeChanged:frame bounds:bounds];
	[self setCenter:[self center]];
}

-(void)setCenter:(CGPoint)center
{
	CGSize ourSize = [self bounds].size;
	CGPoint ourAnchor = [[self layer] anchorPoint];
	CGFloat originx = center.x - (ourSize.width * ourAnchor.x);
	CGFloat originy = center.y - (ourSize.height * ourAnchor.y);
	
	center.x -= originx - floorf(originx);
	center.y -= originy	- floorf(originy);
	
	[super setCenter:center];
}

- (IBAction)switchChanged:(id)sender
{
	NSNumber * newValue = [NSNumber numberWithBool:[(UISwitch *)sender isOn]];
	[self.proxy replaceValue:newValue forKey:@"value" notification:NO];
	
	//No need to setValue, because it's already been set.
	if ([self.proxy _hasListeners:@"change"])
	{
		[self.proxy fireEvent:@"change" withObject:[NSDictionary dictionaryWithObject:newValue forKey:@"value"]];
	}
}

-(CGFloat)verifyWidth:(CGFloat)suggestedWidth
{
	return [switchView sizeThatFits:CGSizeZero].width;
}

-(CGFloat)verifyHeight:(CGFloat)suggestedHeight
{
	return [switchView sizeThatFits:CGSizeZero].height;
}

USE_PROXY_FOR_VERIFY_AUTORESIZING

@end
