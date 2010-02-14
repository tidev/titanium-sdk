/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiMapPinAnnotationView.h"
#import "TiMapView.h"

@implementation TiMapPinAnnotationView

-(void)removeFromSuperview
{
	if (observing)
	{
		[self removeObserver:map forKeyPath:@"selected"];
		observing = NO;
		map = nil;
	}
	[super removeFromSuperview];
}

-(id)initWithAnnotation:(id<MKAnnotation>)annotation reuseIdentifier:(NSString *)reuseIdentifier map:(TiMapView*)map_
{
	if (self = [self initWithAnnotation:annotation reuseIdentifier:reuseIdentifier])
	{
		map = map_;
		[self addObserver:map
				  forKeyPath:@"selected"
					 options:NSKeyValueObservingOptionNew
					 context:@"ANSELECTED"];
		observing = YES;
	}
	return self;
}

@end
