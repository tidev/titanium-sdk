/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */


#import "TweakedScrollView.h"
#import "Logging.h"

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

- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event;
{
	VERBOSE_LOG(@"[DEBUG] Scrollview touchesBegan: We're in mode: %@",[[NSRunLoop currentRunLoop] currentMode]);
	[super touchesBegan:touches withEvent:event];
}

- (void)touchesMoved:(NSSet *)touches withEvent:(UIEvent *)event;
{
	VERBOSE_LOG(@"[DEBUG] Scrollview touchesMoved: We're in mode: %@",[[NSRunLoop currentRunLoop] currentMode]);
	[super touchesMoved:touches withEvent:event];
}

- (void)touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event;
{
	VERBOSE_LOG(@"[DEBUG] Scrollview touchesEnded: We're in mode: %@",[[NSRunLoop currentRunLoop] currentMode]);
	[super touchesEnded:touches withEvent:event];
}

- (void)touchesCancelled:(NSSet *)touches withEvent:(UIEvent *)event;
{
	VERBOSE_LOG(@"[DEBUG] Scrollview touchesCancelled: We're in mode: %@",[[NSRunLoop currentRunLoop] currentMode]);
	[super touchesCancelled:touches withEvent:event];
}

- (BOOL)touchesShouldBegin:(NSSet *)touches withEvent:(UIEvent *)event inContentView:(UIView *)view;
{
//	if([[view superview] isKindOfClass:[UIPickerView class]]){
//		return YES;
//	}
//
//	if([view isKindOfClass:[UIWebView class]]){
//		VERBOSE_LOG(@"[DEBUG] In web view!");
//	}
//	
	BOOL result=[super touchesShouldBegin:touches withEvent:event inContentView:view];
////	NSLog(@"[DEBUG] TouchesShouldBegin:%d withEvent:%@ inContentView:%@ == %d",[touches count],
////		  ([event type]==UIEventTypeTouches)?@"touches":@"motion",NSStringFromClass([view class]),result);
//	
////	if([view isKindOfClass:[UIScrollView class]]){
////		[view touchesBegan:touches withEvent:event];
////		return NO;
////	}
	VERBOSE_LOG(@"[DEBUG] Scrollview touchesShouldBegin: We're in mode: %@",[[NSRunLoop currentRunLoop] currentMode]);

	return result;
}

- (BOOL)touchesShouldCancelInContentView:(UIView *)view;
{
	VERBOSE_LOG(@"[DEBUG] Scrollview touchesShouldCancelInContentView: We're in mode: %@",[[NSRunLoop currentRunLoop] currentMode]);

	UIView * superview = [view superview];
	if([superview isKindOfClass:[UIPickerView class]]){
		return NO;
	}
	BOOL result=[super touchesShouldCancelInContentView:view];
//	if([view isKindOfClass:[UIScrollView class]]) return NO;
	UIView * superduperview = [superview superview];

	if([superduperview isKindOfClass:[UIWebView class]]){
//		return NO;
		
		id superduperviewdelegate = [(UIWebView *)superduperview delegate];
		if ([superduperviewdelegate respondsToSelector:@selector(touchesShouldCancelInContentView:)]){
			result = [superduperviewdelegate touchesShouldCancelInContentView:superduperview];
		}
//		if (result) {
//			int index=[[superview subviews] indexOfObject:view];
//			[view removeFromSuperview];
//			[superview insertSubview:view atIndex:index];
//		}
	}
	VERBOSE_LOG(@"[DEBUG] TouchesShouldCancelInContentView:%@(%@) == %d",NSStringFromClass([view class]),NSStringFromClass([[[view superview] superview] class]),result);

	return result;
}


@end
