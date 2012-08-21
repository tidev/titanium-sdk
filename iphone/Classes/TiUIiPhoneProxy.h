/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONE

#import "TiProxy.h"

@interface TiUIiPhoneProxy : TiProxy {
@private
#ifdef USE_TI_UIIPHONEANIMATIONSTYLE
	TiProxy *animationStyle;
#endif
#ifdef USE_TI_UIIPHONESTATUSBAR
	TiProxy *statusBar;
#endif
#ifdef USE_TI_UIIPHONEROWANIMATIONSTYLE	
	TiProxy *rowAnimationStyle;
#endif
#ifdef USE_TI_UIIPHONESYSTEMBUTTONSTYLE	
	TiProxy *systemButtonStyle;
#endif
#ifdef USE_TI_UIIPHONESYSTEMBUTTON
	TiProxy *systemButton;
#endif
#ifdef USE_TI_UIIPHONEPROGRESSBARSTYLE
	TiProxy *progressBarStyle;
#endif
#ifdef USE_TI_UIIPHONEACTIVITYINDICATORSTYLE
	TiProxy *activityIndicatorStyle;
#endif
#ifdef USE_TI_UIIPHONESYSTEMICON
	TiProxy *systemIcon;
#endif
#ifdef USE_TI_UIIPHONESCROLLINDICATORSTYLE
	TiProxy *scrollIndicatorStyle;
#endif
#ifdef USE_TI_UIIPHONETABLEVIEWSTYLE
	TiProxy *tableViewStyle;
#endif
#ifdef USE_TI_UIIPHONETABLEVIEWSEPARATORSTYLE
	TiProxy *tableViewSeparatorStyle;
#endif
#ifdef USE_TI_UIIPHONETABLEVIEWSCROLLPOSITION
	TiProxy *tableViewScrollPosition;
#endif
#ifdef USE_TI_UIIPHONETABLEVIEWCELLSELECTIONSTYLE
	TiProxy *tableViewCellSelectionStyle;
#endif
#ifdef USE_TI_UIIPHONEALERTDIALOGSTYLE
	TiProxy *alertDialogStyle;
#endif
}

#ifdef USE_TI_UIIPHONEANIMATIONSTYLE
	@property(nonatomic,readonly) TiProxy* AnimationStyle;
#endif
#ifdef USE_TI_UIIPHONESTATUSBAR
	@property(nonatomic,readonly) TiProxy* StatusBar;
#endif
#ifdef USE_TI_UIIPHONEROWANIMATIONSTYLE
@property(nonatomic,readonly) TiProxy* RowAnimationStyle;
#endif
#ifdef USE_TI_UIIPHONESYSTEMBUTTONSTYLE
@property(nonatomic,readonly) TiProxy* SystemButtonStyle;
#endif
#ifdef USE_TI_UIIPHONESYSTEMBUTTON
@property(nonatomic,readonly) TiProxy* SystemButton;
#endif
#ifdef USE_TI_UIIPHONEPROGRESSBARSTYLE
@property(nonatomic,readonly) TiProxy* ProgressBarStyle;
#endif
#ifdef USE_TI_UIIPHONEACTIVITYINDICATORSTYLE
@property(nonatomic,readonly) TiProxy* ActivityIndicatorStyle;
#endif
#ifdef USE_TI_UIIPHONESYSTEMICON
@property(nonatomic,readonly) TiProxy* SystemIcon;
#endif
#ifdef USE_TI_UIIPHONESCROLLINDICATORSTYLE
@property(nonatomic,readonly) TiProxy* ScrollIndicatorStyle;
#endif
#ifdef USE_TI_UIIPHONETABLEVIEWSTYLE
@property(nonatomic,readonly) TiProxy* TableViewStyle;
#endif
#ifdef USE_TI_UIIPHONETABLEVIEWSEPARATORSTYLE
@property(nonatomic,readonly) TiProxy* TableViewSeparatorStyle;
#endif
#ifdef USE_TI_UIIPHONETABLEVIEWSCROLLPOSITION
@property(nonatomic,readonly) TiProxy* TableViewScrollPosition;
#endif
#ifdef USE_TI_UIIPHONETABLEVIEWCELLSELECTIONSTYLE
@property(nonatomic,readonly) TiProxy* TableViewCellSelectionStyle;
#endif
#ifdef USE_TI_UIIPHONEALERTDIALOGSTYLE
@property(nonatomic, readonly) TiProxy *AlertDialogStyle;
#endif


@property(nonatomic,readwrite,assign)	NSNumber *statusBarHidden;
@property(nonatomic,readwrite,assign)	NSNumber *statusBarStyle;
@property(nonatomic,readwrite,assign)	NSNumber *appBadge;
@property(nonatomic,readwrite,assign)	NSNumber *appSupportsShakeToEdit;

@property(nonatomic,readonly) NSNumber *MODAL_TRANSITION_STYLE_COVER_VERTICAL;
@property(nonatomic,readonly) NSNumber *MODAL_TRANSITION_STYLE_FLIP_HORIZONTAL;
@property(nonatomic,readonly) NSNumber *MODAL_TRANSITION_STYLE_CROSS_DISSOLVE;

@property(nonatomic,readonly) NSNumber *MODAL_TRANSITION_STYLE_PARTIAL_CURL;

@property(nonatomic,readonly) NSNumber *MODAL_PRESENTATION_FULLSCREEN;
@property(nonatomic,readonly) NSNumber *MODAL_PRESENTATION_PAGESHEET;
@property(nonatomic,readonly) NSNumber *MODAL_PRESENTATION_FORMSHEET;
@property(nonatomic,readonly) NSNumber *MODAL_PRESENTATION_CURRENT_CONTEXT;


-(void)hideStatusBar:(id)args;
-(void)showStatusBar:(id)args;

#ifdef USE_TI_UIIPHONENAVIGATIONGROUP
-(id)createNavigationGroup:(id)args;
#endif


@end

#endif