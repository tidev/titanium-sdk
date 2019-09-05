/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <TitaniumKit/TiProxy.h>

#ifdef USE_TI_UIIOS

#ifdef USE_TI_UIIOSALERTDIALOGSTYLE
#import "TIUIiOSAlertDialogStyleProxy.h"
#endif

#ifdef USE_TI_UIIOSANIMATIONSTYLE
#import "TiUIiOSAnimationStyleProxy.h"
#endif

#if defined(USE_TI_UIIOSTABLEVIEWCELLSELECTIONSTYLE) || defined(USE_TI_UIIOSLISTVIEWCELLSELECTIONSTYLE)
#import "TiUIiOSTableViewCellSelectionStyleProxy.h"
#endif

#if defined(USE_TI_UIIOSTABLEVIEWSCROLLPOSITION) || defined(USE_TI_UIIOSLISTVIEWSCROLLPOSITION)
#import "TiUIiOSTableViewScrollPositionProxy.h"
#endif

#if defined(USE_TI_UIIOSTABLEVIEWSTYLE) || defined(USE_TI_UIIOSLISTVIEWSTYLE)
#import "TiUIiOSTableViewStyleProxy.h"
#endif

#ifdef USE_TI_UIIOSPROGRESSBARSTYLE
#import "TiUIiOSProgressBarStyleProxy.h"
#endif

#ifdef USE_TI_UIIOSROWANIMATIONSTYLE
#import "TiUIiOSRowAnimationStyleProxy.h"
#endif

#ifdef USE_TI_UIIOSSCROLLINDICATORSTYLE
#import "TiUIiOSScrollIndicatorStyleProxy.h"
#endif

#ifdef USE_TI_UIIOSSTATUSBAR
#import "TiUIiOSStatusBarProxy.h"
#endif

#ifdef USE_TI_UIIOSSYSTEMBUTTONSTYLE
#import "TiUIiOSSystemButtonStyleProxy.h"
#endif

#ifdef USE_TI_UIIOSSYSTEMBUTTON
#import "TiUIiOSSystemButtonProxy.h"
#endif

#ifdef USE_TI_UIIOSSYSTEMICON
#import "TiUIiOSSystemIconProxy.h"
#endif

#endif
@interface TiUIiOSProxy : TiProxy {
  @private
}

@property (nonatomic, readonly) NSNumber *SCROLL_DECELERATION_RATE_NORMAL;
@property (nonatomic, readonly) NSNumber *SCROLL_DECELERATION_RATE_FAST;
@property (nonatomic, readonly) NSNumber *CLIP_MODE_DEFAULT;
@property (nonatomic, readonly) NSNumber *CLIP_MODE_ENABLED;
@property (nonatomic, readonly) NSNumber *CLIP_MODE_DISABLED;

#ifdef USE_TI_UILISTVIEW
@property (nonatomic, readonly) NSNumber *ROW_ACTION_STYLE_DEFAULT;
@property (nonatomic, readonly) NSNumber *ROW_ACTION_STYLE_DESTRUCTIVE;
@property (nonatomic, readonly) NSNumber *ROW_ACTION_STYLE_NORMAL;
#endif

#ifdef USE_TI_UIIOSPREVIEWCONTEXT
@property (nonatomic, readonly) NSNumber *PREVIEW_ACTION_STYLE_DEFAULT;
@property (nonatomic, readonly) NSNumber *PREVIEW_ACTION_STYLE_DESTRUCTIVE;
@property (nonatomic, readonly) NSNumber *PREVIEW_ACTION_STYLE_SELECTED;
#endif

#ifdef USE_TI_UIIOSMENUPOPUP
@property (nonatomic, readonly) NSNumber *MENU_POPUP_ARROW_DIRECTION_UP;
@property (nonatomic, readonly) NSNumber *MENU_POPUP_ARROW_DIRECTION_DOWN;
@property (nonatomic, readonly) NSNumber *MENU_POPUP_ARROW_DIRECTION_LEFT;
@property (nonatomic, readonly) NSNumber *MENU_POPUP_ARROW_DIRECTION_RIGHT;
@property (nonatomic, readonly) NSNumber *MENU_POPUP_ARROW_DIRECTION_DEFAULT;
#endif

@property (nonatomic, readonly) NSNumber *LIVEPHOTO_PLAYBACK_STYLE_HINT;
@property (nonatomic, readonly) NSNumber *LIVEPHOTO_PLAYBACK_STYLE_FULL;

//Modules
#ifdef USE_TI_UIIOSANIMATIONSTYLE
@property (nonatomic, readwrite, assign) TiUIiOSAnimationStyleProxy *animationStyleProxy;
#endif

#ifdef USE_TI_UIIOSROWANIMATIONSTYLE
@property (nonatomic, readwrite, assign) TiUIiOSRowAnimationStyleProxy *RowAnimationStyle;
#endif

#ifdef USE_TI_UIIOSALERTDIALOGSTYLE
@property (nonatomic, readwrite, assign) TIUIiOSAlertDialogStyleProxy *AlertDialogStyle;
#endif
#if defined(USE_TI_UIIOSTABLEVIEWCELLSELECTIONSTYLE) || defined(USE_TI_UIIOSLISTVIEWCELLSELECTIONSTYLE)
@property (nonatomic, readwrite, assign) TiUIiOSTableViewCellSelectionStyleProxy *TableViewCellSelectionStyle;
@property (nonatomic, readwrite, assign) TiUIiOSTableViewCellSelectionStyleProxy *ListViewCellSelectionStyle;
#endif

#if defined(USE_TI_UIIOSTABLEVIEWSCROLLPOSITION) || defined(USE_TI_UIIOSLISTVIEWSCROLLPOSITION)
@property (nonatomic, readwrite, assign) TiUIiOSTableViewScrollPositionProxy *TableViewScrollPosition;
@property (nonatomic, readwrite, assign) TiUIiOSTableViewScrollPositionProxy *ListViewScrollPosition;
#endif
#if defined(USE_TI_UIIOSTABLEVIEWSTYLE) || defined(USE_TI_UIIOSLISTVIEWSTYLE)
@property (nonatomic, readwrite, assign) TiUIiOSTableViewStyleProxy *TableViewStyle;
@property (nonatomic, readwrite, assign) TiUIiOSTableViewStyleProxy *ListViewStyle;
#endif

#ifdef USE_TI_UIIOSPROGRESSBARSTYLE
@property (nonatomic, readwrite, assign) TiUIiOSProgressBarStyleProxy *ProgressBarStyle;
#endif

#ifdef USE_TI_UIIOSSCROLLINDICATORSTYLE
@property (nonatomic, readwrite, assign) TiUIiOSScrollIndicatorStyleProxy *ScrollIndicatorStyle;
#endif

#ifdef USE_TI_UIIOSSTATUSBAR
@property (nonatomic, readwrite, assign) TiUIiOSStatusBarProxy *StatusBar;
#endif
#ifdef USE_TI_UIIOSSYSTEMBUTTONSTYLE
@property (nonatomic, readwrite, assign) TiUIiOSSystemButtonStyleProxy *SystemButtonStyle;
#endif

#ifdef USE_TI_UIIOSSYSTEMBUTTON
@property (nonatomic, readwrite, assign) TiUIiOSSystemButtonProxy *SystemButton;
#endif

#ifdef USE_TI_UIIOSSYSTEMICON
@property (nonatomic, readwrite, assign) TiUIiOSSystemIconProxy *SystemIcon;
#endif

@property (nonatomic, readwrite, assign) NSNumber *appBadge;
@property (nonatomic, readwrite, assign) NSNumber *appSupportsShakeToEdit;

//Modal_Presentation&Transition
@property (nonatomic, readonly) NSNumber *MODAL_PRESENTATION_FULLSCREEN;
@property (nonatomic, readonly) NSNumber *MODAL_PRESENTATION_PAGESHEET;
@property (nonatomic, readonly) NSNumber *MODAL_PRESENTATION_FORMSHEET;
@property (nonatomic, readonly) NSNumber *MODAL_PRESENTATION_CURRENT_CONTEXT;
@property (nonatomic, readonly) NSNumber *MODAL_PRESENTATION_OVER_CURRENT_CONTEXT;
@property (nonatomic, readonly) NSNumber *MODAL_PRESENTATION_OVER_CURRENT_FULL_SCREEN;

@property (nonatomic, readonly) NSNumber *MODAL_TRANSITION_STYLE_COVER_VERTICAL;
@property (nonatomic, readonly) NSNumber *MODAL_TRANSITION_STYLE_FLIP_HORIZONTAL;
@property (nonatomic, readonly) NSNumber *MODAL_TRANSITION_STYLE_CROSS_DISSOLVE;

@property (nonatomic, readonly) NSNumber *MODAL_TRANSITION_STYLE_PARTIAL_CURL;

#ifdef USE_TI_UIIOSBLURVIEW
@property (nonatomic, readonly) NSNumber *BLUR_EFFECT_STYLE_EXTRA_LIGHT;
@property (nonatomic, readonly) NSNumber *BLUR_EFFECT_STYLE_LIGHT;
@property (nonatomic, readonly) NSNumber *BLUR_EFFECT_STYLE_DARK;
#endif

#if IS_SDK_IOS_11
@property (nonatomic, readonly) NSNumber *LARGE_TITLE_DISPLAY_MODE_AUTOMATIC;
@property (nonatomic, readonly) NSNumber *LARGE_TITLE_DISPLAY_MODE_ALWAYS;
@property (nonatomic, readonly) NSNumber *LARGE_TITLE_DISPLAY_MODE_NEVER;
#endif

/**
    Checks the force touch capibility of the current device.
 */
- (NSNumber *)forceTouchSupported;

#ifdef USE_TI_UIIOSCOVERFLOWVIEW
- (id)createCoverFlowView:(id)args;
#endif
#ifdef USE_TI_UIIOSTOOLBAR
- (id)createToolbar:(id)args;
#endif
#ifdef USE_TI_UIIOSTABBEDBAR
- (id)createTabbedBar:(id)args;
#endif
#ifdef USE_TI_UIIOSDOCUMENTVIEWER
- (id)createDocumentViewer:(id)args;
#endif
#ifdef USE_TI_UIIOSNAVIGATIONWINDOW
- (id)createNavigationWindow:(id)args;
#endif
#ifdef USE_TI_UIIOSSPLITWINDOW
- (id)createSplitWindow:(id)args;
#endif
#ifdef USE_TI_UIIOSANIMATOR
- (id)createAnimator:(id)args;
#endif
#ifdef USE_TI_UIIOSSNAPBEHAVIOR
- (id)createSnapBehavior:(id)args;
#endif
#ifdef USE_TI_UIIOSPUSHBEHAVIOR
- (id)createPushBehavior:(id)args;
#endif
#ifdef USE_TI_UIIOSGRAVITYBEHAVIOR
- (id)createGravityBehavior:(id)args;
#endif
#ifdef USE_TI_UIIOSANCHORATTACHMENTBEHAVIOR
- (id)createAnchorAttachmentBehavior:(id)args;
#endif
#ifdef USE_TI_UIIOSVIEWATTACHMENTBEHAVIOR
- (id)createViewAttachmentBehavior:(id)args;
#endif
#ifdef USE_TI_UIIOSCOLLISIONBEHAVIOR
- (id)createCollisionBehavior:(id)args;
#endif
#ifdef USE_TI_UIIOSDYNAMICITEMBEHAVIOR
- (id)createDynamicItemBehavior:(id)args;
#endif
#ifdef USE_TI_UIIOSTRANSITIONANIMATION
- (id)createTransitionAnimation:(id)args;
#endif
#ifdef USE_TI_UIIOSPREVIEWCONTEXT
- (id)createPreviewAction:(id)args;
- (id)createPreviewActionGroup:(id)args;
- (id)createPreviewContext:(id)args;
#endif
#ifdef USE_TI_UIIOSMENUPOPUP
- (id)createMenuPopup:(id)args;
#endif
#ifdef USE_TI_UIIOSBLURVIEW
- (id)createBlurView:(id)args;
#endif
#ifdef USE_TI_UIIOSAPPLICATIONSHORTCUTS
- (id)createApplicationShortcuts:(id)args;
#endif
#ifdef USE_TI_UIIOSFEEDBACKGENERATOR
- (id)createFeedbackGenerator:(id)args;
#endif
#ifdef USE_TI_UIWEBVIEW
- (id)createWebViewConfiguration:(id)args;
- (id)createWebViewProcessPool:(id)args;
#endif
@end
