/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_UISWITCH

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

- (instancetype)init
{
    self = [super init];
    if (self) {
        [self setDefaultHeight:TiDimensionAutoSize];
        [self setDefaultWidth:TiDimensionAutoSize];
        switchView = [self switchView];
    }
    return self;
}

-(UISwitch*)switchView
{
	if (switchView==nil)
	{
		switchView = [[UISwitch alloc] init];
        [self setInnerView:switchView];
        [self addSubview:switchView];
		[switchView addTarget:self action:@selector(switchChanged:) forControlEvents:UIControlEventValueChanged];
	}
	return switchView;
}

-(void)setWidth_:(id)width
{
    // empty, not allowed
}
-(void)setHeight_:(id)args
{
    // empty, not allowed
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

-(void)setTintColor_:(id)color
{
    [[self proxy] replaceValue:color forKey:@"tintColor" notification:NO];
    TiColor *ticolor = [TiUtils colorValue:color];
    if (ticolor != nil) {
        [[self switchView] setTintColor:[ticolor color]];
    }
}

-(void)setOnTintColor_:(id)color
{
    [[self proxy] replaceValue:color forKey:@"onTintColor" notification:NO];
    TiColor *ticolor = [TiUtils colorValue:color];
    if (ticolor != nil) {
        [[self switchView] setOnTintColor:[ticolor color]];
    }
}

-(void)setThumbTintColor_:(id)color
{
    [[self proxy] replaceValue:color forKey:@"thumbTintColor" notification:NO];
    TiColor *ticolor = [TiUtils colorValue:color];
    if (ticolor != nil) {
        [[self switchView] setThumbTintColor:[ticolor color]];
    }
}


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

- (void)switchChanged:(id)sender
{
	NSNumber * newValue = [NSNumber numberWithBool:[(UISwitch *)sender isOn]];
	id current = [self.proxy valueForUndefinedKey:@"value"];
    [self.proxy replaceValue:newValue forKey:@"value" notification:NO];
	
	//No need to setValue, because it's already been set.
	if ([self.proxy _hasListeners:@"change"] && (current != newValue) && ![current isEqual:newValue])
	{
		[self.proxy fireEvent:@"change" withObject:[NSDictionary dictionaryWithObject:newValue forKey:@"value"]];
	}
}

@end

#endif