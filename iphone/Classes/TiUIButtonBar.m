/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUIButtonBar.h"
#import "TiViewProxy.h"
#import "TiUtils.h"
#import "Webcolor.h"

@implementation TiUIButtonBar

- (id) init
{
	self = [super init];
	if (self != nil)
	{
		selectedIndex = -1;
        [self setDefaultHeight:TiDimensionAutoSize];
        [self setDefaultWidth:TiDimensionAutoSize];
	}
	return self;
}

-(void)dealloc
{
	RELEASE_TO_NIL(segmentedControl);
	[super dealloc];
}

-(BOOL)hasTouchableListener
{
	// since this guy only works with touch events, we always want them
	// just always return YES no matter what listeners we have registered
	return YES;
}


-(UISegmentedControl *)segmentedControl
{
	if (segmentedControl==nil)
	{
		segmentedControl=[[UISegmentedControl alloc] init];
        [segmentedControl addTarget:self action:@selector(onSegmentChange:) forControlEvents:UIControlEventValueChanged];
        [self setInnerView:segmentedControl];
	}
	return segmentedControl;
}

- (id)accessibilityElement
{
	return [self segmentedControl];
}

- (void)setTabbedBar: (BOOL)newIsTabbed;
{
    [[self segmentedControl] setMomentary:!newIsTabbed];
}

-(void)setBackgroundColor_:(id)value
{
	TiColor *color = [TiUtils colorValue:value];
	[[self segmentedControl] setTintColor:[color _color]];
}

-(void)setIndex_:(id)value
{
	selectedIndex = [TiUtils intValue:value def:-1];
	[[self segmentedControl] setSelectedSegmentIndex:selectedIndex];
}

-(void)setStyle_:(id)value
{
    DebugLog(@"[WARN] The style property has been deprecated in 3.4.2 and no longer has any effect");
}

-(void)setLabels_:(id)value
{
	[[self segmentedControl] removeAllSegments];
	if (IS_NULL_OR_NIL(value)) {
		return;
	}
	ENSURE_ARRAY(value);

	int thisSegmentIndex = 0;
	for (id thisSegmentEntry in value)
	{
		NSString * thisSegmentTitle = [TiUtils stringValue:thisSegmentEntry];
		UIImage * thisSegmentImage = nil;
		CGFloat thisSegmentWidth = 0;
		BOOL thisSegmentEnabled = YES;
		NSString *thisSegmentAccessibilityLabel = nil;
		
		if ([thisSegmentEntry isKindOfClass:[NSDictionary class]])
		{
			thisSegmentTitle = [TiUtils stringValue:@"title" properties:thisSegmentEntry];
			thisSegmentImage = [TiUtils image:[thisSegmentEntry objectForKey:@"image"] proxy:[self proxy]];
			thisSegmentWidth = [TiUtils floatValue:@"width" properties:thisSegmentEntry];
			thisSegmentEnabled = [TiUtils boolValue:@"enabled" properties:thisSegmentEntry def:YES];
			thisSegmentAccessibilityLabel = [TiUtils stringValue:@"accessibilityLabel" properties:thisSegmentEntry];
		}

		if (thisSegmentImage != nil)
		{
			if (thisSegmentAccessibilityLabel != nil) {
				thisSegmentImage.accessibilityLabel = thisSegmentAccessibilityLabel;
			}
			thisSegmentImage = [thisSegmentImage imageWithRenderingMode:UIImageRenderingModeAlwaysOriginal];
			[segmentedControl insertSegmentWithImage:thisSegmentImage atIndex:thisSegmentIndex animated:NO];
		}
		else
		{
			if (thisSegmentTitle == nil)
			{
				thisSegmentTitle = @"";
			}
			if (thisSegmentAccessibilityLabel != nil) {
				thisSegmentTitle.accessibilityLabel = thisSegmentAccessibilityLabel;
			}
			[segmentedControl insertSegmentWithTitle:thisSegmentTitle atIndex:thisSegmentIndex animated:NO];
		}

		[segmentedControl setEnabled:thisSegmentEnabled forSegmentAtIndex:thisSegmentIndex];
		thisSegmentIndex ++;
	}

	if (![segmentedControl isMomentary])
	{
		[segmentedControl setSelectedSegmentIndex:selectedIndex];
	}
}

-(IBAction)onSegmentChange:(id)sender
{
	NSInteger newIndex = [(UISegmentedControl *)sender selectedSegmentIndex];
	
	[self.proxy replaceValue:NUMINTEGER(newIndex) forKey:@"index" notification:NO];
	
	if (newIndex == selectedIndex)
	{
		return;
	}

	selectedIndex = newIndex;

	if ([self.proxy _hasListeners:@"click"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObject:NUMINTEGER(selectedIndex) forKey:@"index"];
		[self.proxy fireEvent:@"click" withObject:event];
	}
	
	if ([(UISegmentedControl *)sender isMomentary])
	{
		selectedIndex = -1;
		[self.proxy replaceValue:NUMINT(-1) forKey:@"index" notification:NO];
	}
}

@end
