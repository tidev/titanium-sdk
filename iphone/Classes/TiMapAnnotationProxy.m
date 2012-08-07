/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_MAP

#import "TiMapAnnotationProxy.h"
#import "TiUtils.h"
#import "TiViewProxy.h"
#import "ImageLoader.h"
#import "TiButtonUtil.h"
#import "TiMapViewProxy.h"
#import "TiMapView.h"

@implementation TiMapAnnotationProxy

@synthesize delegate;
@synthesize needsRefreshingWithSelection;
@synthesize placed;

#define LEFT_BUTTON  1
#define RIGHT_BUTTON 2

#pragma mark Internal

-(void)_configure
{
	static int mapTags = 0;
	tag = mapTags++;
	needsRefreshingWithSelection = YES;
}

-(NSMutableDictionary*)langConversionTable
{
    return [NSMutableDictionary dictionaryWithObjectsAndKeys:@"title",@"titleid",@"subtitle",@"subtitleid",nil];
}


-(UIView*)makeButton:(id)button tag:(int)buttonTag
{
	UIView *button_view = nil;
	if ([button isKindOfClass:[NSNumber class]])
	{
		// this is button type constant
		int type = [TiUtils intValue:button];
		button_view = [TiButtonUtil buttonWithType:type];
	}
	else 
	{
		UIImage *image = [[ImageLoader sharedLoader] loadImmediateImage:[TiUtils toURL:button proxy:self]];
		if (image!=nil)
		{
			CGSize size = [image size];
			UIButton *bview = [UIButton buttonWithType:UIButtonTypeCustom];
			[TiUtils setView:bview positionRect:CGRectMake(0,0,size.width,size.height)];
			bview.backgroundColor = [UIColor clearColor];
			[bview setImage:image forState:UIControlStateNormal];
			button_view = bview;
		}
	}
	if (button_view!=nil)
	{
		button_view.tag = buttonTag;
	}
	return button_view;
}

-(void)refreshAfterDelay
{
	[self performSelector:@selector(refreshIfNeeded) withObject:nil afterDelay:0.1];
}

-(void)setNeedsRefreshingWithSelection: (BOOL)shouldReselect
{
	if (delegate == nil)
	{
		return; //Nobody to refresh!
	}
	@synchronized(self)
	{
		BOOL invokeMethod = !needsRefreshing;
		needsRefreshing = YES;
		needsRefreshingWithSelection |= shouldReselect;

		if (invokeMethod)
		{
			TiThreadPerformOnMainThread(^{[self refreshAfterDelay];}, NO);
		}
	}
}

-(void)refreshIfNeeded
{
	@synchronized(self)
	{
		if (!needsRefreshing)
		{
			return; //Already done.
		}
		if (delegate!=nil && [delegate viewAttached])
		{
			[(TiMapView*)[delegate view] refreshAnnotation:self readd:needsRefreshingWithSelection];
		}
		needsRefreshing = NO;
		needsRefreshingWithSelection = NO;
	}
}

#pragma mark Public APIs

-(CLLocationCoordinate2D)coordinate
{
	CLLocationCoordinate2D result;
	result.latitude = [TiUtils doubleValue:[self valueForUndefinedKey:@"latitude"]];
	result.longitude = [TiUtils doubleValue:[self valueForUndefinedKey:@"longitude"]];
	return result;
}

-(void)setCoordinate:(CLLocationCoordinate2D)coordinate
{
	[self setValue:[NSNumber numberWithDouble:coordinate.latitude] forUndefinedKey:@"latitude"];
	[self setValue:[NSNumber numberWithDouble:coordinate.longitude] forUndefinedKey:@"longitude"];
}

// Title and subtitle for use by selection UI.
- (NSString *)title
{
	return [self valueForUndefinedKey:@"title"];
}

-(void)setTitle:(id)title
{
	title = [TiUtils replaceString:[TiUtils stringValue:title]
			characters:[NSCharacterSet newlineCharacterSet] withString:@" "];
	//The label will strip out these newlines anyways (Technically, replace them with spaces)

	id current = [self valueForUndefinedKey:@"title"];
	[self replaceValue:title forKey:@"title" notification:NO];
	if (![title isEqualToString:current])
	{
		[self setNeedsRefreshingWithSelection:NO];
	}
}

- (NSString *)subtitle
{
	return [self valueForUndefinedKey:@"subtitle"];
}

-(void)setSubtitle:(id)subtitle
{
	subtitle = [TiUtils replaceString:[TiUtils stringValue:subtitle]
			characters:[NSCharacterSet newlineCharacterSet] withString:@" "];
	//The label will strip out these newlines anyways (Technically, replace them with spaces)

	id current = [self valueForUndefinedKey:@"subtitle"];
	[self replaceValue:subtitle forKey:@"subtitle" notification:NO];
	if (![subtitle isEqualToString:current])
	{
		[self setNeedsRefreshingWithSelection:NO];
	}
}

- (MKPinAnnotationColor)pinColor
{
	return [TiUtils intValue:[self valueForUndefinedKey:@"pincolor"]];
}

-(void)setPincolor:(id)color
{
	id current = [self valueForUndefinedKey:@"pincolor"];
	[self replaceValue:color forKey:@"pincolor" notification:NO];
	if (current!=color)
	{
		[self setNeedsRefreshingWithSelection:YES];
	}
}

- (BOOL)animatesDrop
{
	return [TiUtils boolValue:[self valueForUndefinedKey:@"animate"]];
}

- (UIView*)leftViewAccessory
{
	TiViewProxy* viewProxy = [self valueForUndefinedKey:@"leftView"];
	if (viewProxy!=nil && [viewProxy isKindOfClass:[TiViewProxy class]])
	{
		return [viewProxy view];
	}
	else
	{
		id button = [self valueForUndefinedKey:@"leftButton"];
		if (button!=nil)
		{
			return [self makeButton:button tag:LEFT_BUTTON];
		}
	}
	return nil;
}

- (UIView*)rightViewAccessory
{
	TiViewProxy* viewProxy = [self valueForUndefinedKey:@"rightView"];
	if (viewProxy!=nil && [viewProxy isKindOfClass:[TiViewProxy class]])
	{
		return [viewProxy view];
	}
	else
	{
		id button = [self valueForUndefinedKey:@"rightButton"];
		if (button!=nil)
		{
			return [self makeButton:button tag:RIGHT_BUTTON];
		}
	}
	return nil;
}

- (void)setLeftButton:(id)button
{
	id current = [self valueForUndefinedKey:@"leftButton"];
	[self replaceValue:button forKey:@"leftButton" notification:NO];
	if (current!=button)
	{
		[self setNeedsRefreshingWithSelection:YES];
	}
}

- (void)setRightButton:(id)button
{
	id current = [self valueForUndefinedKey:@"rightButton"];
	[self replaceValue:button forKey:@"rightButton" notification:NO];
	if (current!=button)
	{
		[self setNeedsRefreshingWithSelection:YES];
	}
}

- (void)setRightView:(id)rightview
{
	id current = [self valueForUndefinedKey:@"rightView"];
	[self replaceValue:rightview forKey:@"rightView" notification:NO];
	if (current!=rightview)
	{
		[self setNeedsRefreshingWithSelection:YES];
	}
}

- (void)setLeftView:(id)leftview
{
	id current = [self valueForUndefinedKey:@"leftView"];
	[self replaceValue:leftview forKey:@"leftView" notification:NO];
	if (current!=leftview)
	{
		[self setNeedsRefreshingWithSelection:YES];
	}
}

-(void)setImage:(id)image
{
	id current = [self valueForUndefinedKey:@"image"];
	[self replaceValue:image forKey:@"image" notification:NO];
	if ([current isEqual: image] == NO)
	{
		[self setNeedsRefreshingWithSelection:YES];
	}
}


-(int)tag
{
	return tag;
}

@end

#endif