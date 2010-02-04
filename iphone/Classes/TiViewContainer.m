/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiViewContainer.h"
#import "TiUtils.h"

#define DOUBLE_TAP_DELAY 0.35

@implementation TiViewContainer

-(id)_initWithView:(UIView*)view_ delegate:(id)delegate_ frame:(CGRect)frame_ handlesTouches:(BOOL)touches_
{
	if (self = [super initWithFrame:frame_])
	{
		if(view_ != nil)
		{
			view = [view_ retain];
		}
		delegate = delegate_; // don't retain since he's our parent
		handlesTouches = touches_;
		handlesTaps = NO;
        twoFingerTapIsPossible = YES;
        multipleTouches = NO;
		self.userInteractionEnabled = YES;
		self.multipleTouchEnabled = NO;
	}
	return self;
}

-(void)dealloc
{
	RELEASE_TO_NIL(view);
	[super dealloc];
}

-(UIView*)_view
{
	return view;
}

-(id)delegate
{
	// since we don't retain, return retained/autoreleased to caller
	return [[delegate retain] autorelease];
}

-(void)_stopHandlingTouches:(NSString*)event count:(int)count
{
	if (!handlesTouches && !handlesTaps) return;

	if (count == 0 && [event hasPrefix:@"touch"])
	{
		handlesTouches = NO;
	}
	else if (count == 0 && [event hasSuffix:@"tap"])
	{
		handlesTaps = NO;
	}
	
	if (handlesTaps == NO && handlesTouches == NO)
	{
		self.userInteractionEnabled = NO;
		self.multipleTouchEnabled = NO;
	}
}

-(void)_startHandlingTouches:(NSString*)event count:(int)count
{
	if (handlesTouches && handlesTaps) return;
	
	if ([event hasPrefix:@"touch"])
	{
		handlesTouches = YES;
	}
	else if ([event hasSuffix:@"tap"])
	{
		handlesTaps = YES;
	}

	if (handlesTouches || handlesTaps)
	{
		self.userInteractionEnabled = YES;
	}
	
	if (handlesTaps)
	{
		self.multipleTouchEnabled = YES;
	}
}

-(BOOL)_handlingEvent
{
	return handlesTaps || handlesTouches;
}

#pragma mark Private

- (void)handleSingleTap 
{
	if ([delegate respondsToSelector:@selector(singleTapAtPoint:view:)])
	{
		[delegate singleTapAtPoint:tapLocation view:self];
	}
}

- (void)handleDoubleTap 
{
	if ([delegate respondsToSelector:@selector(doubleTapAtPoint:view:)])
	{
		[delegate doubleTapAtPoint:tapLocation view:self];
	}
}	

- (void)handleTwoFingerTap 
{
	if ([delegate respondsToSelector:@selector(twoFingerTapAtPoint:view:)])
	{
		[delegate twoFingerTapAtPoint:tapLocation view:self];
	}
}


#pragma mark Delegates


// cause ourself to intercept events inside our container
- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event 
{
	// first check to see if this is one of our subviews
	if ([self _handlingEvent] && [self pointInside:[self convertPoint:point toView:self] withEvent:event])
	{
		return self;
	}
	return [super hitTest:point withEvent:event];
}


- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event 
{
	if (handlesTaps)
	{
		// cancel any pending handleSingleTap messages 
		[NSObject cancelPreviousPerformRequestsWithTarget:self selector:@selector(handleSingleTap) object:nil];
    
		// update our touch state
		if ([[event touchesForView:self] count] > 1)
		{
			multipleTouches = YES;
		}
		if ([[event touchesForView:self] count] > 2)
		{
			twoFingerTapIsPossible = NO;
		}
	}

	if (handlesTouches)
	{
		UITouch *touch = [touches anyObject];
		if ([touch view] == self && [delegate respondsToSelector:@selector(touchesBegan:withEvent:)])
		{
			[delegate touchesBegan:touches withEvent:event];
		}
	}
}

- (void)touchesMoved:(NSSet *)touches withEvent:(UIEvent *)event 
{
	if (handlesTouches)
	{
		UITouch *touch = [touches anyObject];
		if ([touch view] == self && [delegate respondsToSelector:@selector(touchesMoved:withEvent:)])
		{
			[delegate touchesMoved:touches withEvent:event];
		}
	}
}

- (void)touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event 
{
	if (handlesTaps)
	{
		BOOL allTouchesEnded = ([touches count] == [[event touchesForView:self] count]);
		
		// first check for plain single/double tap, which is only possible if we haven't seen multiple touches
		if (!multipleTouches) {
			UITouch *touch = [touches anyObject];
			tapLocation = [touch locationInView:self];
			
			if ([touch tapCount] == 1) 
			{
				[self performSelector:@selector(handleSingleTap) withObject:nil afterDelay:DOUBLE_TAP_DELAY];
			} 
			else if([touch tapCount] == 2) 
			{
				[self handleDoubleTap];
			}
		}    
		
		// check for 2-finger tap if we've seen multiple touches and haven't yet ruled out that possibility
		else if (multipleTouches && twoFingerTapIsPossible) 
		{ 
			
			// case 1: this is the end of both touches at once 
			if ([touches count] == 2 && allTouchesEnded) 
			{
				int i = 0; 
				int tapCounts[2]; CGPoint tapLocations[2];
				for (UITouch *touch in touches) {
					tapCounts[i]    = [touch tapCount];
					tapLocations[i] = [touch locationInView:self];
					i++;
				}
				if (tapCounts[0] == 1 && tapCounts[1] == 1) 
				{ 
					// it's a two-finger tap if they're both single taps
					tapLocation = midpointBetweenPoints(tapLocations[0], tapLocations[1]);
					[self handleTwoFingerTap];
				}
			}
			
			// case 2: this is the end of one touch, and the other hasn't ended yet
			else if ([touches count] == 1 && !allTouchesEnded) 
			{
				UITouch *touch = [touches anyObject];
				if ([touch tapCount] == 1) 
				{
					// if touch is a single tap, store its location so we can average it with the second touch location
					tapLocation = [touch locationInView:self];
				} 
				else 
				{
					twoFingerTapIsPossible = NO;
				}
			}
			
			// case 3: this is the end of the second of the two touches
			else if ([touches count] == 1 && allTouchesEnded) 
			{
				UITouch *touch = [touches anyObject];
				if ([touch tapCount] == 1) 
				{
					// if the last touch up is a single tap, this was a 2-finger tap
					tapLocation = midpointBetweenPoints(tapLocation, [touch locationInView:self]);
					[self handleTwoFingerTap];
				}
			}
		}
        
		// if all touches are up, reset touch monitoring state
		if (allTouchesEnded) 
		{
			twoFingerTapIsPossible = YES;
			multipleTouches = NO;
		}
	}

	if (handlesTouches)
	{
		UITouch *touch = [touches anyObject];
		if ([touch view] == self && [delegate respondsToSelector:@selector(touchesEnded:withEvent:)])
		{
			[delegate touchesEnded:touches withEvent:event];
		}
	}
}

- (void)touchesCancelled:(NSSet *)touches withEvent:(UIEvent *)event 
{
	if (handlesTaps)
	{
		twoFingerTapIsPossible = YES;
		multipleTouches = NO;
	}
	if (handlesTouches)
	{
		UITouch *touch = [touches anyObject];
		if ([touch view] == self && [delegate respondsToSelector:@selector(touchesCancelled:withEvent:)])
		{
			[delegate touchesCancelled:touches withEvent:event];
		}
	}
}

@end
