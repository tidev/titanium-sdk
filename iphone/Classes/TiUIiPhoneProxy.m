/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONE

#import "TiUIiPhoneProxy.h"
#import "TiUtils.h"
#import "TiApp.h"


#ifdef USE_TI_UIIPHONEANIMATIONSTYLE
	#import "TiUIAnimationStyleProxy.h"
#endif
#ifdef USE_TI_UIIPHONESTATUSBAR
	#import "TiUIStatusBarProxy.h"
#endif
#ifdef USE_TI_UIIPHONEROWANIMATIONSTYLE
	#import "TiUIRowAnimationStyleProxy.h"
#endif
#ifdef USE_TI_UIIPHONESYSTEMBUTTONSTYLE
	#import "TiUISystemButtonStyleProxy.h"
#endif
#ifdef USE_TI_UIIPHONESYSTEMBUTTON
	#import "TiUISystemButtonProxy.h"
#endif
#ifdef USE_TI_UIIPHONEPROGRESSBARSTYLE
	#import "TiUIProgressBarStyleProxy.h"
#endif
#ifdef USE_TI_UIIPHONEACTIVITYINDICATORSTYLE
	#import "TiUIActivityIndicatorStyleProxy.h"
#endif
#ifdef USE_TI_UIIPHONESYSTEMICON
	#import "TiUISystemIconProxy.h"
#endif
#ifdef USE_TI_UIIPHONESCROLLINDICATORSTYLE
	#import "TiUIScrollIndicatorStyleProxy.h"
#endif
#ifdef USE_TI_UIIPHONETABLEVIEWSTYLE
	#import "TiUITableViewStyleProxy.h"
#endif
#ifdef USE_TI_UIIPHONETABLEVIEWSEPARATORSTYLE
	#import "TiUITableViewSeparatorStyleProxy.h"
#endif
#ifdef USE_TI_UIIPHONETABLEVIEWSCROLLPOSITION
	#import "TiUITableViewScrollPositionProxy.h"
#endif
#ifdef USE_TI_UIIPHONETABLEVIEWCELLSELECTIONSTYLE
	#import "TiUITableViewCellSelectionStyleProxy.h"
#endif
#ifdef USE_TI_UIIPHONENAVIGATIONGROUP
	#import "TiUIiPhoneNavigationGroupProxy.h"
#endif
#ifdef USE_TI_UIIPAD
	#import "TiUIiPadProxy.h"
#endif
#ifdef USE_TI_UIIPADPOPOVER
	#import "TiUIiPadPopoverProxy.h"
#endif
#ifdef USE_TI_UIIPADSPLITWINDOW
	#import "TiUIiPadSplitWindowProxy.h"
#endif

@implementation TiUIiPhoneProxy

-(void)dealloc
{
#ifdef USE_TI_UIIPHONEANIMATIONSTYLE
	RELEASE_TO_NIL(animationStyle);
#endif
#ifdef USE_TI_UIIPHONESTATUSBAR	
	RELEASE_TO_NIL(statusBar);
#endif
#ifdef USE_TI_UIIPHONEROWANIMATIONSTYLE
	RELEASE_TO_NIL(rowAnimationStyle);
#endif
#ifdef USE_TI_UIIPHONESYSTEMBUTTONSTYLE
	RELEASE_TO_NIL(systemButtonStyle);
#endif
#ifdef USE_TI_UIIPHONESYSTEMBUTTON
	RELEASE_TO_NIL(systemButton);
#endif
#ifdef USE_TI_UIIPHONEPROGRESSBARSTYLE
	RELEASE_TO_NIL(progressBarStyle);
#endif
#ifdef USE_TI_UIIPHONEACTIVITYINDICATORSTYLE
	RELEASE_TO_NIL(activityIndicatorStyle);
#endif
#ifdef USE_TI_UIIPHONESYSTEMICON
	RELEASE_TO_NIL(systemIcon);
#endif
#ifdef USE_TI_UIIPHONESCROLLINDICATORSTYLE
	RELEASE_TO_NIL(scrollIndicatorStyle);
#endif
#ifdef USE_TI_UIIPHONETABLEVIEWSTYLE
	RELEASE_TO_NIL(tableViewStyle);
#endif
#ifdef USE_TI_UIIPHONETABLEVIEWSEPARATORSTYLE
	RELEASE_TO_NIL(tableViewSeparatorStyle);
#endif
#ifdef USE_TI_UIIPHONETABLEVIEWSCROLLPOSITION
	RELEASE_TO_NIL(tableViewScrollPosition);
#endif
#ifdef USE_TI_UIIPHONETABLEVIEWCELLSELECTIONSTYLE
	RELEASE_TO_NIL(tableViewCellSelectionStyle);
#endif
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

#ifdef USE_TI_UIIPHONEANIMATIONSTYLE
	DEFINE_SUBPROXY(AnimationStyle,animationStyle);
#endif
#ifdef USE_TI_UIIPHONESTATUSBAR
	DEFINE_SUBPROXY(StatusBar,statusBar);
#endif
#ifdef USE_TI_UIIPHONEROWANIMATIONSTYLE
	DEFINE_SUBPROXY(RowAnimationStyle,rowAnimationStyle);
#endif
#ifdef USE_TI_UIIPHONESYSTEMBUTTONSTYLE
	DEFINE_SUBPROXY(SystemButtonStyle,systemButtonStyle);
#endif
#ifdef USE_TI_UIIPHONESYSTEMBUTTON
	DEFINE_SUBPROXY(SystemButton,systemButton);
#endif
#ifdef USE_TI_UIIPHONEPROGRESSBARSTYLE
	DEFINE_SUBPROXY(ProgressBarStyle,progressBarStyle);
#endif
#ifdef USE_TI_UIIPHONEACTIVITYINDICATORSTYLE
	DEFINE_SUBPROXY(ActivityIndicatorStyle,activityIndicatorStyle);
#endif
#ifdef USE_TI_UIIPHONESYSTEMICON
	DEFINE_SUBPROXY(SystemIcon,systemIcon);
#endif
#ifdef USE_TI_UIIPHONESCROLLINDICATORSTYLE
	DEFINE_SUBPROXY(ScrollIndicatorStyle,scrollIndicatorStyle);
#endif
#ifdef USE_TI_UIIPHONETABLEVIEWSTYLE
	DEFINE_SUBPROXY(TableViewStyle,tableViewStyle);
#endif
#ifdef USE_TI_UIIPHONETABLEVIEWSEPARATORSTYLE
	DEFINE_SUBPROXY(TableViewSeparatorStyle,tableViewSeparatorStyle);
#endif
#ifdef USE_TI_UIIPHONETABLEVIEWSCROLLPOSITION
	DEFINE_SUBPROXY(TableViewScrollPosition,tableViewScrollPosition);
#endif
#ifdef USE_TI_UIIPHONETABLEVIEWCELLSELECTIONSTYLE
	DEFINE_SUBPROXY(TableViewCellSelectionStyle,tableViewCellSelectionStyle);
#endif

#define RESPONDS_TO_3_2_STATUSBAR_SELECTOR \
[[UIApplication sharedApplication] respondsToSelector:@selector(setStatusBarHidden:withAnimation:)]

-(void)hideStatusBar:(id)args
{
	ENSURE_UI_THREAD(hideStatusBar,args);
	ENSURE_SINGLE_ARG_OR_NIL(args,NSDictionary);
	
	BOOL animated = [TiUtils boolValue:@"animated" properties:args def:YES];
	
	if (RESPONDS_TO_3_2_STATUSBAR_SELECTOR) {
		int style = (animated==NO) ? UIStatusBarAnimationNone : [TiUtils intValue:@"animationStyle" properties:args def:UIStatusBarAnimationSlide];
		[[UIApplication sharedApplication] setStatusBarHidden:YES withAnimation:style];
	}
	else {
		[[UIApplication sharedApplication] setStatusBarHidden:YES];
	}
	
	[[[TiApp app] controller] resizeView];
}

-(void)showStatusBar:(id)args
{
	ENSURE_UI_THREAD(showStatusBar,args);
	ENSURE_SINGLE_ARG_OR_NIL(args,NSDictionary);
	
	BOOL animated = [TiUtils boolValue:@"animated" properties:args def:YES];

	if (RESPONDS_TO_3_2_STATUSBAR_SELECTOR) {
		int style = (animated==NO) ? UIStatusBarAnimationNone : [TiUtils intValue:@"animationStyle" properties:args def:UIStatusBarAnimationSlide];
		[[UIApplication sharedApplication] setStatusBarHidden:NO withAnimation:style];
	}
	else {
		[[UIApplication sharedApplication] setStatusBarHidden:NO];		
	}

	[[[TiApp app] controller] resizeView];
}

-(void)setStatusBarHidden:(id)hidden
{
	ENSURE_UI_THREAD(setStatusBarHidden,hidden);
	ENSURE_SINGLE_ARG(hidden,NSObject);
	
	BOOL value = [TiUtils boolValue:hidden];
	
	if (RESPONDS_TO_3_2_STATUSBAR_SELECTOR) {
		[[UIApplication sharedApplication] setStatusBarHidden:value withAnimation:UIStatusBarAnimationNone];
	}
	else {
		[[UIApplication sharedApplication] setStatusBarHidden:value];
	}

	[[[TiApp app] controller] resizeView];
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

#ifdef USE_TI_UIIPHONENAVIGATIONGROUP
-(id)createNavigationGroup:(id)args
{
	// don't create a static depedency, do it with lazy binding
	Class cl = NSClassFromString(@"TiUIiPhoneNavigationGroupProxy");
	return [[[cl alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}
#endif

MAKE_SYSTEM_PROP(MODAL_TRANSITION_STYLE_COVER_VERTICAL,UIModalTransitionStyleCoverVertical);
MAKE_SYSTEM_PROP(MODAL_TRANSITION_STYLE_FLIP_HORIZONTAL,UIModalTransitionStyleFlipHorizontal);
MAKE_SYSTEM_PROP(MODAL_TRANSITION_STYLE_CROSS_DISSOLVE,UIModalTransitionStyleCrossDissolve);



#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2

MAKE_SYSTEM_PROP(MODAL_PRESENTATION_FULLSCREEN,UIModalPresentationFullScreen);
MAKE_SYSTEM_PROP(MODAL_TRANSITION_STYLE_PARTIAL_CURL,UIModalTransitionStylePartialCurl);
MAKE_SYSTEM_PROP(MODAL_PRESENTATION_PAGESHEET,UIModalPresentationPageSheet);
MAKE_SYSTEM_PROP(MODAL_PRESENTATION_FORMSHEET,UIModalPresentationFormSheet);
MAKE_SYSTEM_PROP(MODAL_PRESENTATION_CURRENT_CONTEXT,UIModalPresentationCurrentContext);

#endif



#pragma mark Internal

-(void)didReceiveMemoryWarning:(NSNotification*)notification
{
#ifdef USE_TI_UIIPHONEANIMATIONSTYLE
	RELEASE_TO_NIL(animationStyle);
#endif
#ifdef USE_TI_UIIPHONESTATUSBAR
	RELEASE_TO_NIL(statusBar);
#endif
#ifdef USE_TI_UIIPHONEROWANIMATIONSTYLE
	RELEASE_TO_NIL(rowAnimationStyle);
#endif
#ifdef USE_TI_UIIPHONESYSTEMBUTTONSTYLE
	RELEASE_TO_NIL(systemButtonStyle);
#endif
#ifdef USE_TI_UIIPHONESYSTEMBUTTON
	RELEASE_TO_NIL(systemButton);
#endif
#ifdef USE_TI_UIIPHONEPROGRESSBARSTYLE
	RELEASE_TO_NIL(progressBarStyle);
#endif
#ifdef USE_TI_UIIPHONEACTIVITYINDICATORSTYLE
	RELEASE_TO_NIL(activityIndicatorStyle);
#endif
#ifdef USE_TI_UIIPHONESYSTEMICON
	RELEASE_TO_NIL(systemIcon);
#endif
#ifdef USE_TI_UIIPHONESCROLLINDICATORSTYLE
	RELEASE_TO_NIL(scrollIndicatorStyle);
#endif
#ifdef USE_TI_UIIPHONETABLEVIEWSTYLE
	RELEASE_TO_NIL(tableViewStyle);
#endif
#ifdef USE_TI_UIIPHONETABLEVIEWSEPARATORSTYLE
	RELEASE_TO_NIL(tableViewSeparatorStyle);
#endif
#ifdef USE_TI_UIIPHONETABLEVIEWSCROLLPOSITION
	RELEASE_TO_NIL(tableViewScrollPosition);
#endif
#ifdef USE_TI_UIIPHONETABLEVIEWCELLSELECTIONSTYLE
	RELEASE_TO_NIL(tableViewCellSelectionStyle);
#endif
	[super didReceiveMemoryWarning:notification];
}

@end

#endif