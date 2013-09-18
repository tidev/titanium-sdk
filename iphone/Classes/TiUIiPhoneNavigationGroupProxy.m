/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONENAVIGATIONGROUP

#import "TiUIiPhoneNavigationGroupProxy.h"
#import "TiUtils.h"
#import "TiWindowProxy.h"
#import "TiUIiPhoneNavigationGroup.h"
#import "TiApp.h"

@implementation TiUIiPhoneNavigationGroupProxy

-(id)init
{
    if (self = [super init]) {
        //This is done to insert the top line of the nav bar
        //underneath the bottom line of the status bar.
        if (![TiUtils isIOS7OrGreater]) {
            layoutProperties.top = TiDimensionDip(-1);
        }
    }
    return self;
}

#pragma mark - Public API

-(void)open:(NSArray*)args
{
    [self openWindow:args];
}

-(void)close:(NSArray*)args
{
    [self closeWindow:args];
}

#pragma mark - TiTab Protocol

-(UINavigationController*)controller
{
	return [(TiUIiPhoneNavigationGroup*)[self view] controller];
}

-(TiProxy<TiTabGroup>*)tabGroup
{
    return nil;
}

-(void)openWindow:(NSArray*)args
{
	TiWindowProxy *window = [args objectAtIndex:0];
	ENSURE_TYPE(window,TiWindowProxy);
    [window setIsManaged:YES];
	[window setTab:(TiViewProxy<TiTab> *)self];
	[window setParentOrientationController:self];
    //Send to open. Will come back after _handleOpen returns true.
    if (![window opening]) {
        args = ([args count] > 1) ? [args objectAtIndex:1] : nil;
        if (args != nil) {
            args = [NSArray arrayWithObject:args];
        }
        [window open:args];
        return;
    }
	NSDictionary *properties = [args count] > 1 ? [args objectAtIndex:1] : [NSDictionary dictionary];
    TiThreadPerformOnMainThread(^{
        [[self view] performSelector:@selector(pushOnUIThread:) withObject:args];
    }, YES);
}

-(void)closeWindow:(NSArray*)args
{
	if ([args count]>0)
	{
        TiWindowProxy *window = [args objectAtIndex:0];
        ENSURE_TYPE(window,TiWindowProxy);
		NSDictionary *properties = [args count] > 1 ? [args objectAtIndex:1] : [NSDictionary dictionary];
        TiThreadPerformOnMainThread(^{
            [[self view] performSelector:@selector(popOnUIThread:) withObject:args];
        }, YES);
	}
	else
	{
		ENSURE_UI_THREAD(close,args);
		// we're closing the nav group itself
		[[self view] performSelector:@selector(close)];
		[self detachView];
	}
    
}

-(void)windowClosing:(TiWindowProxy*)window animated:(BOOL)animated
{
    //NO OP
}

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
	if ([self viewAttached])
	{
		[(TiUIiPhoneNavigationGroup *)[self view] willAnimateRotationToInterfaceOrientation:toInterfaceOrientation duration:duration];
	}
}

-(UIViewController *)childViewController
{
	return nil;
}


@synthesize parentOrientationController;

-(TiOrientationFlags) orientationFlags
{
	UINavigationController * controller = [self controller];
	for (UIViewController * thisVC in [[controller viewControllers] reverseObjectEnumerator])
	{
		if (![thisVC isKindOfClass:[TiViewController class]])
		{
			continue;
		}
		TiWindowProxy * thisProxy = (TiWindowProxy *)[(TiViewController *)thisVC proxy];
		if ([thisProxy conformsToProtocol:@protocol(TiOrientationController)])
		{
			TiOrientationFlags result = [thisProxy orientationFlags];
			if (result != TiOrientationNone)
			{
				return result;
			}
		}
	}
	return TiOrientationNone;
}

-(void)childOrientationControllerChangedFlags:(id <TiOrientationController>)orientationController
{
	WARN_IF_BACKGROUND_THREAD;
	[parentOrientationController childOrientationControllerChangedFlags:self];
}

-(void)detachView
{
	WARN_IF_BACKGROUND_THREAD;
	if ([self viewAttached]) {
		[(TiUIiPhoneNavigationGroup*)[self view] close];
	}
	[super detachView];
}

@end

#endif