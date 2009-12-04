/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TitaniumCompositeViewController.h"
#import <QuartzCore/QuartzCore.h>
#import "TitaniumHost.h"

@implementation TitaniumCompositeRule

-(void) positionView: (UIView *) subView inView: (UIView *) superView bounds: (CGSize) viewBounds;
{
	CGRect viewRect;
	viewRect.origin=CGPointZero;
	viewRect.size=viewBounds;
	ApplyConstraintToViewWithinViewWithBounds(&constraint, subView, superView, viewRect);
}

- (void) readConstraints:(NSDictionary *) inputDict;
{
	ReadConstraintFromDictionary(&constraint, inputDict,NULL);
}

- (void) dealloc
{
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
		NSEnumerator * viewEnumerator = [contentViewControllers objectEnumerator];
		for(TitaniumCompositeRule * thisRule in contentRules){
			[thisRule positionView:[[viewEnumerator nextObject] view] inView:view bounds:preferredViewSize];
		}
		[pendingRules release];
		pendingRules = nil;
	}
	return view;
}

- (void)didReceiveMemoryWarning {
	// Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
	for(TitaniumContentViewController * thisView in contentViewControllers){
		[thisView didReceiveMemoryWarning];
	}
	// Release any cached data, images, etc that aren't in use.
}

- (void)dealloc {
	[pendingRules release];
	[contentRules release];
	[pendingViewControllers release];
	[contentViewControllers autorelease];
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
		[pendingViewControllers release];
		pendingViewControllers=nil;
		
		if(contentRules == nil){
			contentRules = [[NSMutableArray alloc] initWithCapacity:[rulesObject count]];
		} else {
			[contentRules removeAllObjects];
		}
		if(contentViewControllers == nil){
			contentViewControllers = [[NSMutableArray alloc] initWithCapacity:[rulesObject count]];
		} else {
			[contentViewControllers removeAllObjects];
		}
		
		NSString * callingToken = [[[TitaniumHost sharedHost] currentThread] magicToken];

		for(NSDictionary * thisRuleObject in rulesObject){
			if(![thisRuleObject isKindOfClass:dictClass])continue;

			TitaniumCompositeRule * thisRule = [[TitaniumCompositeRule alloc] init];
			id viewObject = [thisRuleObject objectForKey:@"view"];
			TitaniumContentViewController * thisVC = [TitaniumContentViewController viewControllerForState:viewObject relativeToUrl:baseUrl];
			[thisVC setTitaniumWindowToken:[self titaniumWindowToken]];
			[thisVC addListeningWebContextToken:callingToken];

			[thisRule readConstraints:thisRuleObject];
			[contentViewControllers addObject:thisVC];
			[contentRules addObject:thisRule];
			[thisRule release];
		}
	}
}

#pragma mark Repeaters to subviews

#ifndef __IPHONE_3_0
typedef int UIEventSubtype;
#define UIEventSubtypeMotionShake	1
#endif

- (void)motionEnded:(UIEventSubtype)motion withEvent:(UIEvent *)event
{
	for(TitaniumContentViewController * thisVC in contentViewControllers){
		if([thisVC respondsToSelector:@selector(motionEnded:withEvent:)]){
			[(id)thisVC motionEnded:motion withEvent:event];
		}
	}
}

- (void)setInterfaceOrientation:(TitaniumViewControllerOrientationsAllowed)interfaceOrientation duration:(NSTimeInterval)duration;
{
	for (TitaniumContentViewController * ourVC in contentViewControllers) {
		if ([ourVC respondsToSelector:@selector(setInterfaceOrientation:duration:)]){
			[(TitaniumContentViewController<TitaniumWindowDelegate> *)ourVC setInterfaceOrientation:interfaceOrientation duration:duration];
		}
	}	
}

- (BOOL) isShowingView: (TitaniumContentViewController *) contentView;
{
	if(self==contentView)return YES;
	for(TitaniumContentViewController * thisVC in contentViewControllers){
		if([thisVC isShowingView:contentView])return YES;
	}
	return NO;
}

- (void) setTitaniumWindowToken: (NSString *) newToken;
{
	[super setTitaniumWindowToken:newToken];
	for(TitaniumContentViewController * thisVC in contentViewControllers){
		[thisVC setTitaniumWindowToken:newToken];
	}
}

- (void)updateLayout: (BOOL)animated;
{
	if(!view) return;

	if(pendingRules != nil){
		NSEnumerator * viewEnumerator = [pendingViewControllers objectEnumerator];
		for(TitaniumCompositeRule * thisRule in pendingRules){
			[thisRule positionView:[[viewEnumerator nextObject] view] inView:view bounds:preferredViewSize];
		}
		[pendingRules release];
		pendingRules = nil;
		[pendingViewControllers release];
		pendingViewControllers = nil;
	}
	
	for(TitaniumContentViewController * thisVC in contentViewControllers){
		[thisVC updateLayout:animated];
	}

}

- (void)setFocused:(BOOL)isFocused;
{
	for(TitaniumContentViewController * thisVC in contentViewControllers){
		if([thisVC respondsToSelector:@selector(setFocused:)]){
			[thisVC setFocused:isFocused];
		}
	}
}


- (void)setWindowFocused:(BOOL)isFocused;
{
	for(TitaniumContentViewController * thisVC in contentViewControllers){
		if([thisVC respondsToSelector:@selector(setWindowFocused:)]){
			[thisVC setWindowFocused:isFocused];
		}
	}
}

- (BOOL) sendJavascript: (NSString *) inputString;
{
	BOOL result = NO;
	for(TitaniumContentViewController * thisVC in contentViewControllers){
		if([thisVC respondsToSelector:@selector(sendJavascript:)]){
			result |= [(id)thisVC sendJavascript:inputString];
		}
	}
	return result;
}


#pragma mark Javascript callbacks

- (void) addRule: (NSDictionary *) newRuleObject baseUrl:(NSURL *)baseUrl;
{
	NSDictionary * ourVCObject = [newRuleObject objectForKey:@"view"];
	TitaniumContentViewController * ourVC = [TitaniumContentViewController viewControllerForState:ourVCObject relativeToUrl:baseUrl];
	if(ourVC==nil)return;

	NSString * callingToken = [[[TitaniumHost sharedHost] currentThread] magicToken];
	[ourVC addListeningWebContextToken:callingToken];
	[ourVC setTitaniumWindowToken:[self titaniumWindowToken]];

	TitaniumCompositeRule * ourRule = [[TitaniumCompositeRule alloc] init];
	[ourRule readConstraints:newRuleObject];

	if(contentRules == nil){
		contentRules = [[NSMutableArray alloc] initWithObjects:ourRule,nil];
	} else {
		[contentRules addObject:ourRule];
	}
	if(contentViewControllers == nil){
		contentViewControllers = [[NSMutableArray alloc] initWithObjects:ourVC,nil];
	} else {
		[contentViewControllers addObject:ourVC];
	}
	if(pendingRules == nil){
		pendingRules = [[NSMutableArray alloc] initWithObjects:ourRule,nil];
	} else {
		[pendingRules addObject:ourRule];
	}
	if(pendingViewControllers == nil){
		pendingViewControllers = [[NSMutableArray alloc] initWithObjects:ourVC,nil];
	} else {
		[pendingViewControllers addObject:ourVC];
	}
	[ourRule release];

	[self performSelectorOnMainThread:@selector(updateLayout:) withObject:nil waitUntilDone:NO];
}


@end
