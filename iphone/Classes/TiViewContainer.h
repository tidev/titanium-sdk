/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <UIKit/UIKit.h>

@class TiViewContainer;

@protocol TiViewContainerDelegate
@optional
-(void)singleTapAtPoint:(CGPoint)location view:(TiViewContainer*)view;
-(void)doubleTapAtPoint:(CGPoint)location view:(TiViewContainer*)view;
-(void)twoFingerTapAtPoint:(CGPoint)location view:(TiViewContainer*)view;
@end

@interface TiViewContainer : UIView {
	UIView *view;
	id delegate;
	
    // Touch detection
	BOOL handlesTouches;
	BOOL handlesTaps;
    CGPoint tapLocation;         // Needed to record location of single tap, which will only be registered after delayed perform.
    BOOL multipleTouches;        // YES if a touch event contains more than one touch; reset when all fingers are lifted.
    BOOL twoFingerTapIsPossible; // Set to NO when 2-finger tap can be ruled out (e.g. 3rd finger down, fingers touch down too far apart, etc).
}

-(id)_initWithView:(UIView*)view delegate:(id)delegate frame:(CGRect)frame handlesTouches:(BOOL)yn;
-(UIView*)_view;
-(void)_stopHandlingTouches:(NSString*)event count:(int)count;
-(void)_startHandlingTouches:(NSString*)event count:(int)count;
-(BOOL)_handlingEvent;
-(id)delegate;

@end
