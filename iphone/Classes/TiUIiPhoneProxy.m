/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIiPhoneProxy.h"
#import "TiUtils.h"
#import "TitaniumApp.h"
#import "TiUIAnimationStyleProxy.h"
#import "TiUIStatusBarProxy.h"
#import "TiUIRowAnimationStyleProxy.h"
#import "TiUISystemButtonStyleProxy.h"
#import "TiUISystemButtonProxy.h"
#import "TiUIProgressBarStyleProxy.h"
#import "TiUIActivityIndicatorStyleProxy.h"
#import "TiUISystemIconProxy.h"
#import "TiUIScrollIndicatorStyleProxy.h"
#import "TiUITableViewStyleProxy.h"
#import "TiUITableViewSeparatorStyleProxy.h"
#import "TiUITableViewScrollPositionProxy.h"
#import "TiUITableViewCellSelectionStyleProxy.h"

@implementation TiUIiPhoneProxy

-(void)dealloc
{
	RELEASE_TO_NIL(animationStyle);
	RELEASE_TO_NIL(statusBar);
	RELEASE_TO_NIL(rowAnimationStyle);
	RELEASE_TO_NIL(systemButtonStyle);
	RELEASE_TO_NIL(systemButton);
	RELEASE_TO_NIL(progressBarStyle);
	RELEASE_TO_NIL(activityIndicatorStyle);
	RELEASE_TO_NIL(systemIcon);
	RELEASE_TO_NIL(scrollIndicatorStyle);
	RELEASE_TO_NIL(tableViewStyle);
	RELEASE_TO_NIL(tableViewSeparatorStyle);
	RELEASE_TO_NIL(tableViewScrollPosition);
	RELEASE_TO_NIL(tableViewCellSelectionStyle);
	[super dealloc];
}

#define DEFINE_SUBPROXY(methodName,ivarName)	\
-(TiProxy*)methodName	\
{	\
	if (ivarName==nil)	\
	{	\
		ivarName = [[TiUI##methodName##Proxy alloc] _initWithPageContext:[self pageContext]];	\
	}	\
	return ivarName;	\
}	\

DEFINE_SUBPROXY(AnimationStyle,animationStyle);
DEFINE_SUBPROXY(StatusBar,statusBar);
DEFINE_SUBPROXY(RowAnimationStyle,rowAnimationStyle);
DEFINE_SUBPROXY(SystemButtonStyle,systemButtonStyle);
DEFINE_SUBPROXY(SystemButton,systemButton);
DEFINE_SUBPROXY(ProgressBarStyle,progressBarStyle);
DEFINE_SUBPROXY(ActivityIndicatorStyle,activityIndicatorStyle);
DEFINE_SUBPROXY(SystemIcon,systemIcon);
DEFINE_SUBPROXY(ScrollIndicatorStyle,scrollIndicatorStyle);
DEFINE_SUBPROXY(TableViewStyle,tableViewStyle);
DEFINE_SUBPROXY(TableViewSeparatorStyle,tableViewSeparatorStyle);
DEFINE_SUBPROXY(TableViewScrollPosition,tableViewScrollPosition);
DEFINE_SUBPROXY(TableViewCellSelectionStyle,tableViewCellSelectionStyle);

-(void)hideStatusBar:(id)args
{
	ENSURE_UI_THREAD(hideStatusBar,args);
	[[UIApplication sharedApplication] setStatusBarHidden:YES animated:[TiUtils boolValue:args]];
	[[[TitaniumApp app] controller] resizeView];
}

-(void)showStatusBar:(id)args
{
	ENSURE_UI_THREAD(showStatusBar,args);
	[[UIApplication sharedApplication] setStatusBarHidden:NO animated:[TiUtils boolValue:args]];
	[[[TitaniumApp app] controller] resizeView];
}

-(void)setStatusBarHidden:(NSNumber *)hidden
{
	ENSURE_UI_THREAD(setStatusBarHidden,hidden);
	[[UIApplication sharedApplication] setStatusBarHidden:[hidden boolValue] animated:NO];
	[[[TitaniumApp app] controller] resizeView];
}

BEGIN_UI_THREAD_PROTECTED_VALUE(statusBarHidden,NSNumber)
result = [NSNumber numberWithBool:[[UIApplication sharedApplication] isStatusBarHidden]];
END_UI_THREAD_PROTECTED_VALUE(statusBarHidden)

-(void)setStatusBarStyle:(NSNumber *)style
{
	ENSURE_UI_THREAD(setStatusBarStyle,style);
	[[UIApplication sharedApplication] setStatusBarStyle:[style intValue]];
}

BEGIN_UI_THREAD_PROTECTED_VALUE(statusBarStyle,NSNumber)
result = [NSNumber numberWithInt:[[UIApplication sharedApplication] statusBarStyle]];
END_UI_THREAD_PROTECTED_VALUE(statusBarStyle)

-(void)setAppBadge:(id)value
{
	ENSURE_UI_THREAD(setAppBadge,value);
	if (value == [NSNull null])
	{
		[[UIApplication sharedApplication] setApplicationIconBadgeNumber:0];
	}
	else
	{
		[[UIApplication sharedApplication] setApplicationIconBadgeNumber:[TiUtils intValue:value]];
	}
}

BEGIN_UI_THREAD_PROTECTED_VALUE(appBadge,NSNumber)
result = [NSNumber numberWithInt:[[UIApplication sharedApplication] applicationIconBadgeNumber]];
END_UI_THREAD_PROTECTED_VALUE(appBadge)

-(void)setAppSupportsShakeToEdit:(NSNumber *)shake
{
	ENSURE_UI_THREAD(setAppSupportsShakeToEdit,shake);
	[[UIApplication sharedApplication] setApplicationSupportsShakeToEdit:[shake boolValue]];
}

BEGIN_UI_THREAD_PROTECTED_VALUE(appSupportsShakeToEdit,NSNumber)
result = [NSNumber numberWithBool:[[UIApplication sharedApplication] applicationSupportsShakeToEdit]];
END_UI_THREAD_PROTECTED_VALUE(appSupportsShakeToEdit)


#pragma mark Internal

-(void)didReceiveMemoryWarning:(NSNotification*)notification
{
	RELEASE_TO_NIL(animationStyle);
	RELEASE_TO_NIL(statusBar);
	RELEASE_TO_NIL(rowAnimationStyle);
	RELEASE_TO_NIL(systemButtonStyle);
	RELEASE_TO_NIL(systemButton);
	RELEASE_TO_NIL(progressBarStyle);
	RELEASE_TO_NIL(activityIndicatorStyle);
	RELEASE_TO_NIL(systemIcon);
	RELEASE_TO_NIL(scrollIndicatorStyle);
	RELEASE_TO_NIL(tableViewStyle);
	RELEASE_TO_NIL(tableViewSeparatorStyle);
	RELEASE_TO_NIL(tableViewScrollPosition);
	RELEASE_TO_NIL(tableViewCellSelectionStyle);
	[super didReceiveMemoryWarning:notification];
}

@end
