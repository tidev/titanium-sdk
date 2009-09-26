/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TitaniumCompositeViewController.h"
#import <QuartzCore/QuartzCore.h>

@implementation TitaniumCompositeRule
@synthesize viewController;

-(void) positionInView: (UIView *) superView bounds: (CGSize) viewBounds;
{
	CGRect resultFrame;
	UIViewAutoresizing resultMask;
	
	if(hasLeftConstraint){
		resultFrame.origin.x = left;
		if(hasRightConstraint){
			resultFrame.size.width = viewBounds.width-(left+right);
			resultMask = UIViewAutoresizingFlexibleWidth;
		} else if(hasWidthConstraint){
			resultFrame.size.width = width;
			resultMask = UIViewAutoresizingFlexibleRightMargin;
		} else {
			resultFrame.size.width = viewBounds.width-left;
			resultMask = UIViewAutoresizingFlexibleWidth;
		}
		
	} else if(hasRightConstraint){
		if(hasWidthConstraint){
			resultFrame.size.width = viewBounds.width;
			resultFrame.origin.x = viewBounds.width - (right+width);
			resultMask = UIViewAutoresizingFlexibleLeftMargin;
		} else {
			resultFrame.origin.x = 0;
			resultFrame.size.width = viewBounds.width - right;
			resultMask = UIViewAutoresizingFlexibleWidth;
		}
		
	} else if(hasWidthConstraint){
		resultFrame.size.width = width;
		resultFrame.origin.x = (viewBounds.width-width)/2;
		resultMask = UIViewAutoresizingFlexibleLeftMargin | UIViewAutoresizingFlexibleRightMargin;
		
	} else {
		resultFrame.origin.x=0;
		resultFrame.size.width=viewBounds.width;
		resultMask = UIViewAutoresizingFlexibleWidth;
	}
	
	
	if(hasTopConstraint){
		resultFrame.origin.y = top;
		if(hasBottomConstraint){
			resultFrame.size.height = viewBounds.height-(top+bottom);
			resultMask |= UIViewAutoresizingFlexibleHeight;
		} else if(hasHeightConstraint){
			resultFrame.size.height = height;
			resultMask |= UIViewAutoresizingFlexibleBottomMargin;
		} else {
			resultFrame.size.height = viewBounds.height-top;
			resultMask |= UIViewAutoresizingFlexibleHeight;
		}
		
	} else if(hasBottomConstraint){
		if(hasHeightConstraint){
			resultFrame.size.height = viewBounds.height;
			resultFrame.origin.y = viewBounds.height - bottom;
			resultMask |= UIViewAutoresizingFlexibleTopMargin;
		} else {
			resultFrame.origin.y = 0;
			resultFrame.size.height = viewBounds.height - bottom;
			resultMask |= UIViewAutoresizingFlexibleHeight;
		}
		
	} else if(hasHeightConstraint){
		resultFrame.size.height = height;
		resultFrame.origin.y = (viewBounds.height-height)/2;
		resultMask |= UIViewAutoresizingFlexibleTopMargin | UIViewAutoresizingFlexibleBottomMargin;
		
	} else{
		resultFrame.origin.y=0;
		resultFrame.size.height = viewBounds.height;
		resultMask |= UIViewAutoresizingFlexibleHeight;
		
	}
	
	UIView * subView = [viewController view];
	[[subView layer] setZPosition:(hasZConstraint)?z:0];
	[subView setAutoresizingMask:resultMask];
	[subView setFrame:resultFrame];
	if([subView superview]!=superView)[superView addSubview:subView];
}

#define READ_CONSTRAINT(key,boolVar,floatVar)	\
	inputVal = [inputDict objectForKey:key];	\
	boolVar = [inputVal respondsToSelector:floatValue];	\
	if(boolVar)floatVar = [inputVal floatValue];

- (void) readConstraints:(NSDictionary *) inputDict;
{
	SEL floatValue = @selector(floatValue);
	NSNumber * inputVal;
	READ_CONSTRAINT(@"z",hasZConstraint,z);
	READ_CONSTRAINT(@"left",hasLeftConstraint,left);
	READ_CONSTRAINT(@"right",hasRightConstraint,right);
	READ_CONSTRAINT(@"width",hasWidthConstraint,width);
	READ_CONSTRAINT(@"top",hasTopConstraint,top);
	READ_CONSTRAINT(@"bottom",hasBottomConstraint,bottom);
	READ_CONSTRAINT(@"height",hasHeightConstraint,height);
	
}

- (void) dealloc
{
	[viewController autorelease];
	[super dealloc];
}


@end


@implementation TitaniumCompositeViewController

- (UIView *) view;
{
	if(view==nil){
		CGRect viewFrame;
		viewFrame.origin = CGPointZero;
		viewFrame.size = preferredViewSize;
		view = [[UIView alloc] initWithFrame:viewFrame];
		[view setAutoresizingMask:UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth];
		for(TitaniumCompositeRule * thisRule in viewControllerRules){
			[thisRule positionInView:view bounds:preferredViewSize];
		}
		[pendingRules release];
		pendingRules = nil;
	}
	return view;
}

- (void)didReceiveMemoryWarning {
	// Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
	for(TitaniumCompositeRule * thisRule in viewControllerRules){
		[[thisRule viewController] didReceiveMemoryWarning];
	}
	// Release any cached data, images, etc that aren't in use.
}

- (void)dealloc {
	[pendingRules release];
	[viewControllerRules release];
    [super dealloc];
}

- (void) readState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
{
	Class dictClass = [NSDictionary class];
	if(![inputState isKindOfClass:dictClass])return;
	
	NSArray * rulesObject = [inputState objectForKey:@"rules"];
	if([rulesObject isKindOfClass:[NSArray class]]){
		[pendingRules release];
		pendingRules=nil;
		
		if(viewControllerRules == nil){
			viewControllerRules = [[NSMutableArray alloc] initWithCapacity:[rulesObject count]];
		} else {
			[viewControllerRules removeAllObjects];
		}
		
		for(NSDictionary * thisRuleObject in rulesObject){
			if(![thisRuleObject isKindOfClass:dictClass])continue;

			TitaniumCompositeRule * thisRule = [[TitaniumCompositeRule alloc] init];
			id viewObject = [thisRuleObject objectForKey:@"view"];
			TitaniumContentViewController * thisVC = [TitaniumContentViewController viewControllerForState:viewObject relativeToUrl:baseUrl];
			[thisRule readConstraints:thisRuleObject];
			[thisRule setViewController:thisVC];

			[viewControllerRules addObject:thisRule];
			[thisRule release];
		}
	}
}

#pragma mark Repeaters to subviews

#ifndef __IPHONE_3_0
typedef int UIEventSubtype;
const UIEventSubtype UIEventSubtypeMotionShake=1;
#endif

- (void)motionEnded:(UIEventSubtype)motion withEvent:(UIEvent *)event
{
	for(TitaniumCompositeRule * thisRule in viewControllerRules){
		TitaniumContentViewController * ourVC = [thisRule viewController];
		if([ourVC respondsToSelector:@selector(motionEnded:withEvent:)]){
			[(id)ourVC motionEnded:motion withEvent:event];
		}
	}
}

- (BOOL) isShowingView: (TitaniumContentViewController *) contentView;
{
	if(self==contentView)return YES;
	for(TitaniumCompositeRule * thisRule in viewControllerRules){
		if(contentView==[thisRule viewController])return YES;
	}
	return NO;
}

- (void) setTitaniumWindowToken: (NSString *) newToken;
{
	[super setTitaniumWindowToken:newToken];
	for(TitaniumCompositeRule * thisRule in viewControllerRules){
		[[thisRule viewController] setTitaniumWindowToken:newToken];
	}
}

- (void)updateLayout: (BOOL)animated;
{
	if(!view) return;

	if(pendingRules != nil){
		for(TitaniumCompositeRule * thisRule in pendingRules){
			[thisRule positionInView:view bounds:preferredViewSize];
		}
		[pendingRules release];
		pendingRules = nil;	
	}

//	for(TitaniumCompositeRule * thisRule in viewControllerRules){
//		[thisRule positionInView:view bounds:preferredViewSize];
//	}
	
	for(TitaniumCompositeRule * thisRule in viewControllerRules){
		[[thisRule viewController] updateLayout:animated];
	}

}

- (void)setFocused:(BOOL)isFocused;
{
	for(TitaniumCompositeRule * thisRule in viewControllerRules){
		TitaniumContentViewController * focusedContentController = [thisRule viewController];
		if([focusedContentController respondsToSelector:@selector(setFocused:)]){
			[focusedContentController setFocused:isFocused];
		}
	}
}


- (void)setWindowFocused:(BOOL)isFocused;
{
	for(TitaniumCompositeRule * thisRule in viewControllerRules){
		TitaniumContentViewController * focusedContentController = [thisRule viewController];
		if([focusedContentController respondsToSelector:@selector(setWindowFocused:)]){
			[focusedContentController setWindowFocused:isFocused];
		}
	}
}


#pragma mark Javascript callbacks

- (void) addRule: (NSDictionary *) newRuleObject baseUrl:(NSURL *)baseUrl;
{
	NSDictionary * ourVCObject = [newRuleObject objectForKey:@"view"];
	TitaniumContentViewController * ourVC = [TitaniumContentViewController viewControllerForState:ourVCObject relativeToUrl:baseUrl];
	if(ourVC==nil)return;

	TitaniumCompositeRule * ourRule = [[TitaniumCompositeRule alloc] init];
	[ourRule setViewController:ourVC];
	[ourRule readConstraints:newRuleObject];

	if(viewControllerRules == nil){
		viewControllerRules = [[NSMutableArray alloc] initWithObjects:ourRule,nil];
	} else {
		[viewControllerRules addObject:ourRule];
	}
	if(pendingRules == nil){
		pendingRules = [[NSMutableArray alloc] initWithObjects:ourRule,nil];
	} else {
		[pendingRules addObject:ourRule];
	}
	[ourRule release];

	[self performSelectorOnMainThread:@selector(updateLayout:) withObject:nil waitUntilDone:NO];
}


@end
