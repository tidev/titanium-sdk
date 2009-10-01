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
	if([[view superview] isKindOfClass:[UIPickerView class]]){
		return YES;
	}

	if([view isKindOfClass:[UIWebView class]]){
		NSLog(@"In web view!");
	}
	
	BOOL result=[super touchesShouldBegin:touches withEvent:event inContentView:view];
	NSLog(@"TouchesShouldBegin:%d withEvent:%@ inContentView:%@ == %d",[touches count],
		  ([event type]==UIEventTypeTouches)?@"touches":@"motion",NSStringFromClass([view class]),result);
	
//	if([view isKindOfClass:[UIScrollView class]]){
//		[view touchesBegan:touches withEvent:event];
//		return NO;
//	}
	return result;
}

- (BOOL)touchesShouldCancelInContentView:(UIView *)view;
{
	UIView * superview = [view superview];
	if([superview isKindOfClass:[UIPickerView class]]){
		return NO;
	}
	BOOL result=[super touchesShouldCancelInContentView:view];
//	if([view isKindOfClass:[UIScrollView class]]) return NO;
	UIView * superduperview = [superview superview];

	if([superduperview isKindOfClass:[UIWebView class]]){
		id superduperviewdelegate = [(UIWebView *)superduperview delegate];
		if ([superduperviewdelegate respondsToSelector:@selector(touchesShouldCancelInContentView:)]){
			result = [superduperviewdelegate touchesShouldCancelInContentView:superduperview];
		}
	}
	NSLog(@"TouchesShouldCancelInContentView:%@(%@) == %d",NSStringFromClass([view class]),NSStringFromClass([[[view superview] superview] class]),result);
	return result;
}


@end
