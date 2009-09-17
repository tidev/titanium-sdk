/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */


#import "TweakedScrollView.h"


@implementation TweakedScrollView


- (id)initWithFrame:(CGRect)frame {
    if (self = [super initWithFrame:frame]) {
        // Initialization code
    }
    return self;
}


- (void)dealloc {
    [super dealloc];
}


- (BOOL)touchesShouldBegin:(NSSet *)touches withEvent:(UIEvent *)event inContentView:(UIView *)view;
{
	BOOL result=[super touchesShouldBegin:touches withEvent:event inContentView:view];
//	NSLog(@"TouchesShouldBegin:%@ withEvent:%@ inContentView:%@ == %d",touches,event,view,result);

	NSLog(@"TouchesShouldBegin:%d withEvent:%@ inContentView:%@ == %d",[touches count],
		  ([event type]==UIEventTypeTouches)?@"touches":@"motion",NSStringFromClass([view class]),result);

	if([[view superview] isKindOfClass:[UIPickerView class]]){
		NSLog(@"Was picker view!");
		return YES;
	}
//	if([view isKindOfClass:[UIScrollView class]]){
//		[view touchesBegan:touches withEvent:event];
//		return NO;
//	}
	return result;
}

- (BOOL)touchesShouldCancelInContentView:(UIView *)view;
{
	BOOL result=[super touchesShouldCancelInContentView:view];
	NSLog(@"TouchesShouldCancelInContentView:%@ == %d",NSStringFromClass([view class]),result);
//	if([view isKindOfClass:[UIScrollView class]]) return NO;
	if([[view superview] isKindOfClass:[UIPickerView class]]){
		NSLog(@"Was picker view!");
		return NO;
	}
	return result;
}


@end
