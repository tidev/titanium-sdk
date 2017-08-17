/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIiOSProxy.h"
#import "TiUtils.h"
#import "Webcolor.h"
#ifdef USE_TI_UIIOS

#ifdef USE_TI_UIIOSPREVIEWCONTEXT
#import "TiUIiOSPreviewActionGroupProxy.h"
#import "TiUIiOSPreviewActionProxy.h"
#import "TiUIiOSPreviewContextProxy.h"
#endif

#ifdef USE_TI_UIIOSMENUPOPUP
#import "TiUIiOSMenuPopupProxy.h"
#endif

#ifdef USE_TI_UIIOSLIVEPHOTOVIEW
#import "TiUIiOSLivePhotoViewProxy.h"
#endif

#ifdef USE_TI_UIIOSTRANSITIONANIMATION
#import "TiUIiOSTransitionAnimationProxy.h"
#endif

#ifdef USE_TI_UIIOSADVIEW
#import "TiUIiOSAdViewProxy.h"
#import <iAd/iAd.h>
#endif

#ifdef USE_TI_UIIOSCOVERFLOWVIEW
#import "TiUIiOSCoverFlowViewProxy.h"
#endif

#ifdef USE_TI_UIIOSTOOLBAR
#import "TiUIToolbarProxy.h"
#endif

#ifdef USE_TI_UIIOSTABBEDBAR
#import "TiUIiOSTabbedBarProxy.h"
#endif

#ifdef USE_TI_UIIOSDOCUMENTVIEWER
#import "TiUIiOSDocumentViewerProxy.h"
#endif

#ifdef USE_TI_UIIOSNAVIGATIONWINDOW
#import "TiUIiOSNavWindowProxy.h"
#endif

#ifdef USE_TI_UIIOSSPLITWINDOW
#import "TiUIiOSSplitWindowProxy.h"
#endif

#ifdef USE_TI_UIIOSANIMATOR
#import "TiAnimatorProxy.h"
#ifdef USE_TI_UIIOSSNAPBEHAVIOR
#import "TiSnapBehavior.h"
#endif
#ifdef USE_TI_UIIOSPUSHBEHAVIOR
#import "TiPushBehavior.h"
#endif
#ifdef USE_TI_UIIOSGRAVITYBEHAVIOR
#import "TiGravityBehavior.h"
#endif
#ifdef USE_TI_UIIOSANCHORATTACHMENTBEHAVIOR
#import "TiAnchorAttachBehavior.h"
#endif
#ifdef USE_TI_UIIOSVIEWATTACHMENTBEHAVIOR
#import "TiViewAttachBehavior.h"
#endif
#ifdef USE_TI_UIIOSCOLLISIONBEHAVIOR
#import "TiCollisionBehavior.h"
#endif
#ifdef USE_TI_UIIOSDYNAMICITEMBEHAVIOR
#import "TiDynamicItemBehavior.h"
#endif
#endif

#ifdef USE_TI_UIIOSAPPLICATIONSHORTCUTS
#import "TiUIiOSApplicationShortcutsProxy.h"
#endif

#if defined(USE_TI_UIIOSLIVEPHOTOBADGE) || defined(USE_TI_UIIOSLIVEPHOTOVIEW)
#import <PhotosUI/PhotosUI.h>
#endif

#ifdef USE_TI_UIIOSBLURVIEW
#import "TiUIiOSBlurViewProxy.h"
#endif

#ifdef USE_TI_UIIOSSTEPPER
#import "TiUIiOSStepperProxy.h"
#endif

#if IS_XCODE_8
#ifdef USE_TI_UIIOSFEEDBACKGENERATOR
#import "TiUIiOSFeedbackGeneratorProxy.h"
#endif
#endif

@implementation TiUIiOSProxy

#define FORGET_AND_RELEASE(x) \
  {                           \
    [self forgetProxy:x];     \
    RELEASE_TO_NIL(x);        \
  }

- (NSString *)apiName
{
  return @"Ti.UI.iOS";
}

- (NSNumber *)forceTouchSupported
{
  return NUMBOOL([TiUtils forceTouchSupported]);
}

- (void)setStatusBarBackgroundColor:(id)value
{
  ENSURE_UI_THREAD(setStatusBarBackgroundColor, value);
  ENSURE_SINGLE_ARG(value, NSString);

  UIView *statusBar = [[[UIApplication sharedApplication] valueForKey:@"statusBarWindow"] valueForKey:@"statusBar"];
  if ([statusBar respondsToSelector:@selector(setBackgroundColor:)]) {
    statusBar.backgroundColor = [[TiUtils colorValue:value] _color];
  }
}

- (NSNumber *)SCROLL_DECELERATION_RATE_NORMAL
{
  return NUMFLOAT(UIScrollViewDecelerationRateNormal);
}

- (NSNumber *)SCROLL_DECELERATION_RATE_FAST
{
  return NUMFLOAT(UIScrollViewDecelerationRateFast);
}

- (NSNumber *)CLIP_MODE_DEFAULT
{
  return NUMINT(0);
}
- (NSNumber *)CLIP_MODE_ENABLED
{
  return NUMINT(1);
}
- (NSNumber *)CLIP_MODE_DISABLED
{
  return NUMINT(-1);
}

#ifdef USE_TI_UILISTVIEW
- (NSNumber *)ROW_ACTION_STYLE_DEFAULT
{
  if ([TiUtils isIOS8OrGreater]) {
    return NUMINTEGER(UITableViewRowActionStyleDefault);
  }
  return nil;
}
- (NSNumber *)ROW_ACTION_STYLE_DESTRUCTIVE
{
  if ([TiUtils isIOS8OrGreater]) {
    return NUMINTEGER(UITableViewRowActionStyleDestructive);
  }
  return nil;
}
- (NSNumber *)ROW_ACTION_STYLE_NORMAL
{
  if ([TiUtils isIOS8OrGreater]) {
    return NUMINTEGER(UITableViewRowActionStyleNormal);
  }
  return nil;
}
#endif

#ifdef USE_TI_UIIOSPREVIEWCONTEXT
- (NSNumber *)PREVIEW_ACTION_STYLE_DEFAULT
{
  if ([TiUtils isIOS9OrGreater]) {
    return NUMINTEGER(UIPreviewActionStyleDefault);
  }
  return nil;
}
- (NSNumber *)PREVIEW_ACTION_STYLE_DESTRUCTIVE
{
  if ([TiUtils isIOS9OrGreater]) {
    return NUMINTEGER(UIPreviewActionStyleDestructive);
  }
  return nil;
}
- (NSNumber *)PREVIEW_ACTION_STYLE_SELECTED
{
  if ([TiUtils isIOS9OrGreater]) {
    return NUMINTEGER(UIPreviewActionStyleSelected);
  }
  return nil;
}
#endif

- (void)dealloc
{
  [super dealloc];
}

- (void)didReceiveMemoryWarning:(NSNotification *)notification
{
#ifdef USE_TI_UIIOSANIMATIONSTYLE
  FORGET_AND_RELEASE(_animationStyleProxy);
#endif

#ifdef USE_TI_UIIOSROWANIMATIONSTYLE
  FORGET_AND_RELEASE(_RowAnimationStyle);
#endif
#ifdef USE_TI_UIIOSALERTDIALOGSTYLE
  FORGET_AND_RELEASE(_AlertDialogStyle);
#endif
#if defined(USE_TI_UIIOSTABLEVIEWCELLSELECTIONSTYLE) || defined(USE_TI_UIIOSLISTVIEWCELLSELECTIONSTYLE)
  FORGET_AND_RELEASE(_TableViewCellSelectionStyle);
  FORGET_AND_RELEASE(_ListViewCellSelectionStyle);

#endif

#if defined(USE_TI_UIIOSTABLEVIEWSCROLLPOSITION) || defined(USE_TI_UIIOSLISTVIEWSCROLLPOSITION)
  FORGET_AND_RELEASE(_TableViewScrollPosition);
  FORGET_AND_RELEASE(_ListViewScrollPosition);
#endif
#if defined(USE_TI_UIIOSTABLEVIEWSTYLE) || defined(USE_TI_UIIOSLISTVIEWSTYLE)
  FORGET_AND_RELEASE(_TableViewStyle);
  FORGET_AND_RELEASE(_ListViewStyle);
#endif

#ifdef USE_TI_UIIOSPROGRESSBARSTYLE
  FORGET_AND_RELEASE(_ProgressBarStyle);
#endif
#ifdef USE_TI_UIIOSSCROLLINDICATORSTYLE
  FORGET_AND_RELEASE(_ScrollIndicatorStyle);
#endif
#ifdef USE_TI_UIIOSSTATUSBAR
  FORGET_AND_RELEASE(_StatusBar);
#endif
#ifdef USE_TI_UIIOSSYSTEMBUTTONSTYLE
  FORGET_AND_RELEASE(_SystemButtonStyle);
#endif

#ifdef USE_TI_UIIOSSYSTEMBUTTON
  FORGET_AND_RELEASE(_SystemButton);
#endif
#ifdef USE_TI_UIIOSSYSTEMICON
  FORGET_AND_RELEASE(_SystemIcon);
#endif
  [super didReceiveMemoryWarning:notification];
}

#ifdef USE_TI_UIIOSALERTDIALOGSTYLE
- (TIUIiOSAlertDialogStyleProxy *)AlertDialogStyle
{
  if (_AlertDialogStyle == nil) {
    _AlertDialogStyle = [[TIUIiOSAlertDialogStyleProxy alloc] _initWithPageContext:[self pageContext]];
  }
  return _AlertDialogStyle;
}
#endif

#ifdef USE_TI_UIIOSANIMATIONSTYLE
- (TiUIiOSAnimationStyleProxy *)AnimationStyle
{
  if (_animationStyleProxy == nil) {
    _animationStyleProxy = [[TiUIiOSAnimationStyleProxy alloc] _initWithPageContext:[self pageContext]];
  }
  return _animationStyleProxy;
}
#endif

#if defined(USE_TI_UIIOSTABLEVIEWCELLSELECTIONSTYLE) || defined(USE_TI_UIIOSLISTVIEWCELLSELECTIONSTYLE)
- (TiUIiOSTableViewCellSelectionStyleProxy *)TableViewCellSelectionStyle
{
  if (_TableViewCellSelectionStyle == nil) {
    _TableViewCellSelectionStyle = [[TiUIiOSTableViewCellSelectionStyleProxy alloc] _initWithPageContext:[self pageContext]];
  }
  return _TableViewCellSelectionStyle;
}

- (TiUIiOSTableViewCellSelectionStyleProxy *)ListViewCellSelectionStyle
{
  if (_ListViewCellSelectionStyle == nil) {
    _ListViewCellSelectionStyle = [[TiUIiOSTableViewCellSelectionStyleProxy alloc] _initWithPageContext:[self pageContext]];
  }
  return _ListViewCellSelectionStyle;
}
#endif

#if defined(USE_TI_UIIOSTABLEVIEWSCROLLPOSITION) || defined(USE_TI_UIIOSLISTVIEWSCROLLPOSITION)
- (TiUIiOSTableViewScrollPositionProxy *)TableViewScrollPosition
{
  if (_TableViewScrollPosition == nil) {
    _TableViewScrollPosition = [[TiUIiOSTableViewScrollPositionProxy alloc] _initWithPageContext:[self pageContext]];
  }
  return _TableViewScrollPosition;
}

- (TiUIiOSTableViewScrollPositionProxy *)ListViewScrollPosition
{
  if (_ListViewScrollPosition == nil) {
    _ListViewScrollPosition = [[TiUIiOSTableViewScrollPositionProxy alloc] _initWithPageContext:[self pageContext]];
  }
  return _ListViewScrollPosition;
}
#endif

#if defined(USE_TI_UIIOSTABLEVIEWSTYLE) || defined(USE_TI_UIIOSLISTVIEWSTYLE)
- (TiUIiOSTableViewStyleProxy *)TableViewStyle
{
  if (_TableViewStyle == nil) {
    _TableViewStyle = [[TiUIiOSTableViewStyleProxy alloc] _initWithPageContext:[self pageContext]];
  }
  return _TableViewStyle;
}

- (TiUIiOSTableViewStyleProxy *)ListViewStyle
{
  if (_ListViewStyle == nil) {
    _ListViewStyle = [[TiUIiOSTableViewStyleProxy alloc] _initWithPageContext:[self pageContext]];
  }
  return _ListViewStyle;
}
#endif

#ifdef USE_TI_UIIOSPROGRESSBARSTYLE
- (TiUIiOSProgressBarStyleProxy *)ProgressBarStyle
{
  if (_ProgressBarStyle == nil) {
    _ProgressBarStyle = [[TiUIiOSProgressBarStyleProxy alloc] _initWithPageContext:[self pageContext]];
  }
  return _ProgressBarStyle;
}
#endif

#ifdef USE_TI_UIIOSROWANIMATIONSTYLE
- (TiUIiOSRowAnimationStyleProxy *)RowAnimationStyle
{
  if (_RowAnimationStyle == nil) {
    _RowAnimationStyle = [[TiUIiOSRowAnimationStyleProxy alloc] _initWithPageContext:[self pageContext]];
  }
  return _RowAnimationStyle;
}
#endif

#ifdef USE_TI_UIIOSSCROLLINDICATORSTYLE
- (TiUIiOSScrollIndicatorStyleProxy *)ScrollIndicatorStyle
{
  if (_ScrollIndicatorStyle == nil) {
    _ScrollIndicatorStyle = [[TiUIiOSScrollIndicatorStyleProxy alloc] _initWithPageContext:[self pageContext]];
  }
  return _ScrollIndicatorStyle;
}
#endif

#ifdef USE_TI_UIIOSSTATUSBAR
- (TiUIiOSStatusBarProxy *)StatusBar
{
  if (_StatusBar == nil) {
    _StatusBar = [[TiUIiOSStatusBarProxy alloc] _initWithPageContext:[self pageContext]];
  }
  return _StatusBar;
}
#endif

#ifdef USE_TI_UIIOSSYSTEMBUTTONSTYLE
- (TiUIiOSSystemButtonStyleProxy *)SystemButtonStyle
{
  if (_SystemButtonStyle == nil) {
    _SystemButtonStyle = [[TiUIiOSSystemButtonStyleProxy alloc] _initWithPageContext:[self pageContext]];
  }
  return _SystemButtonStyle;
}
#endif

#ifdef USE_TI_UIIOSSYSTEMBUTTON
- (TiUIiOSSystemButtonProxy *)SystemButton
{
  if (_SystemButton == nil) {
    _SystemButton = [[TiUIiOSSystemButtonProxy alloc] _initWithPageContext:[self pageContext]];
  }
  return _SystemButton;
}
#endif

#ifdef USE_TI_UIIOSSYSTEMICON
- (TiUIiOSSystemIconProxy *)SystemIcon
{
  if (_SystemIcon == nil) {
    _SystemIcon = [[TiUIiOSSystemIconProxy alloc] _initWithPageContext:[self pageContext]];
  }
  return _SystemIcon;
}
#endif

- (void)setAppBadge:(id)value
{
  ENSURE_UI_THREAD(setAppBadge, value);
  if (value == [NSNull null]) {
    [[UIApplication sharedApplication] setApplicationIconBadgeNumber:0];
  } else {
    [[UIApplication sharedApplication] setApplicationIconBadgeNumber:[TiUtils intValue:value]];
  }
}

BEGIN_UI_THREAD_PROTECTED_VALUE(appBadge, NSNumber)
result = [NSNumber numberWithInteger:[[UIApplication sharedApplication] applicationIconBadgeNumber]];
END_UI_THREAD_PROTECTED_VALUE(appBadge)

- (void)setAppSupportsShakeToEdit:(NSNumber *)shake
{
  ENSURE_UI_THREAD(setAppSupportsShakeToEdit, shake);
  [[UIApplication sharedApplication] setApplicationSupportsShakeToEdit:[shake boolValue]];
}

BEGIN_UI_THREAD_PROTECTED_VALUE(appSupportsShakeToEdit, NSNumber)
result = [NSNumber numberWithBool:[[UIApplication sharedApplication] applicationSupportsShakeToEdit]];
END_UI_THREAD_PROTECTED_VALUE(appSupportsShakeToEdit)

#ifdef USE_TI_UIIOSBLURVIEW
- (id)BLUR_EFFECT_STYLE_EXTRA_LIGHT
{
  if ([TiUtils isIOS8OrGreater]) {
    return NUMINTEGER(UIBlurEffectStyleExtraLight);
  }
  return [NSNull null];
}

- (id)BLUR_EFFECT_STYLE_LIGHT
{
  if ([TiUtils isIOS8OrGreater]) {
    return NUMINTEGER(UIBlurEffectStyleLight);
  }
  return [NSNull null];
}

- (id)BLUR_EFFECT_STYLE_DARK
{
  if ([TiUtils isIOS8OrGreater]) {
    return NUMINTEGER(UIBlurEffectStyleDark);
  }
  return [NSNull null];
}

- (id)BLUR_EFFECT_STYLE_REGULAR
{
#if IS_XCODE_8
  if ([TiUtils isIOS10OrGreater]) {
    return NUMINTEGER(UIBlurEffectStyleRegular);
  }
#endif
  return [NSNull null];
}

- (id)BLUR_EFFECT_STYLE_PROMINENT
{
#if IS_XCODE_8
  if ([TiUtils isIOS10OrGreater]) {
    return NUMINTEGER(UIBlurEffectStyleProminent);
  }
#endif
  return [NSNull null];
}
#endif

#ifdef USE_TI_UIIOSMENUPOPUP
MAKE_SYSTEM_PROP(MENU_POPUP_ARROW_DIRECTION_UP, UIMenuControllerArrowUp);
MAKE_SYSTEM_PROP(MENU_POPUP_ARROW_DIRECTION_DOWN, UIMenuControllerArrowDown);
MAKE_SYSTEM_PROP(MENU_POPUP_ARROW_DIRECTION_LEFT, UIMenuControllerArrowLeft);
MAKE_SYSTEM_PROP(MENU_POPUP_ARROW_DIRECTION_RIGHT, UIMenuControllerArrowRight);
MAKE_SYSTEM_PROP(MENU_POPUP_ARROW_DIRECTION_DEFAULT, UIMenuControllerArrowDefault);
#endif

#ifdef USE_TI_UISEARCHBAR
MAKE_SYSTEM_PROP(SEARCH_BAR_STYLE_PROMINENT, UISearchBarStyleProminent);
MAKE_SYSTEM_PROP(SEARCH_BAR_STYLE_MINIMAL, UISearchBarStyleMinimal);
#endif

#if defined(USE_TI_UISCROLLVIEW) || defined(USE_TI_UILISTVIEW)
MAKE_SYSTEM_PROP(KEYBOARD_DISMISS_MODE_NONE, UIScrollViewKeyboardDismissModeNone);
MAKE_SYSTEM_PROP(KEYBOARD_DISMISS_MODE_ON_DRAG, UIScrollViewKeyboardDismissModeOnDrag);
MAKE_SYSTEM_PROP(KEYBOARD_DISMISS_MODE_INTERACTIVE, UIScrollViewKeyboardDismissModeInteractive);
#endif

#ifdef USE_TI_UIIOSADVIEW
- (NSString *)AD_SIZE_PORTRAIT
{
  return [TiUIiOSAdViewProxy portraitSize];
}

- (NSString *)AD_SIZE_LANDSCAPE
{
  return [TiUIiOSAdViewProxy landscapeSize];
}

- (id)createAdView:(id)args
{
#if IS_XCODE_8
  DebugLog(@"[WARN] iAd is deprecated in iOS 10 and will be removed in future versions of iOS. Please consider to replace it with a different service.");
#endif

  return [[[TiUIiOSAdViewProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}
#endif

#ifdef USE_TI_UIIOSCOVERFLOWVIEW
- (id)createCoverFlowView:(id)args
{
  return [[[TiUIiOSCoverFlowViewProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}
#endif

#ifdef USE_TI_UIIOSTOOLBAR
- (id)createToolbar:(id)args
{
  DEPRECATED_REPLACED(@"UI.iOS.Toolbar", @"6.2.0", @"UI.Toolbar (parity with Android)")
  return [[[TiUIToolbarProxy alloc] _initWithPageContext:[self executionContext] args:args apiName:@"Ti.UI.iOS.Toolbar"] autorelease];
}
#endif

#ifdef USE_TI_UIIOSTABBEDBAR
- (id)createTabbedBar:(id)args
{
  return [[[TiUIiOSTabbedBarProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}
#endif

#ifdef USE_TI_UIIOSDOCUMENTVIEWER
- (id)createDocumentViewer:(id)args
{
  return [[[TiUIiOSDocumentViewerProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}
#endif

#ifdef USE_TI_UIIOSNAVIGATIONWINDOW
- (id)createNavigationWindow:(id)args
{
  return [[[TiUIiOSNavWindowProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}
#endif

#ifdef USE_TI_UIIOSSPLITWINDOW
- (id)createSplitWindow:(id)args
{
  return [[[TiUIiOSSplitWindowProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}
#endif

#ifdef USE_TI_UIIOSTRANSITIONANIMATION
- (id)createTransitionAnimation:(id)args;
{
  return [[[TiUIiOSTransitionAnimationProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}
#endif

#ifdef USE_TI_UIIOSPREVIEWCONTEXT
- (id)createPreviewAction:(id)args
{
  return [[[TiUIiOSPreviewActionProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}

- (id)createPreviewActionGroup:(id)args
{
  return [[[TiUIiOSPreviewActionGroupProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}

- (id)createPreviewContext:(id)args
{
  return [[[TiUIiOSPreviewContextProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}
#endif

#ifdef USE_TI_UIIOSMENUPOPUP
- (id)createMenuPopup:(id)args
{
  return [[[TiUIiOSMenuPopupProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}
#endif

#ifdef USE_TI_UIIOSBLURVIEW
- (id)createBlurView:(id)args
{
  return [[[TiUIiOSBlurViewProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}
#endif

#ifdef USE_TI_UIIOSSTEPPER
- (id)createStepper:(id)args
{
  return [[[TiUIiOSStepperProxy alloc] _initWithPageContext:[self pageContext] args:args] autorelease];
}
#endif

#ifdef USE_TI_UIIOSLIVEPHOTOVIEW
- (id)createLivePhotoView:(id)args
{
  return [[[TiUIiOSLivePhotoViewProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}

- (NSNumber *)LIVEPHOTO_PLAYBACK_STYLE_FULL
{
  if ([TiUtils isIOS9_1OrGreater]) {
    return NUMINTEGER(PHLivePhotoViewPlaybackStyleFull);
  }
  return nil;
}

- (NSNumber *)LIVEPHOTO_PLAYBACK_STYLE_HINT
{
  if ([TiUtils isIOS9_1OrGreater]) {
    return NUMINTEGER(PHLivePhotoViewPlaybackStyleHint);
  }

  return nil;
}
#endif

#ifdef USE_TI_UIIOSLIVEPHOTOBADGE
- (TiBlob *)createLivePhotoBadge:(id)value
{
  if ([TiUtils isIOS9_1OrGreater] == NO) {
    return nil;
  }

  ENSURE_ARG_COUNT(value, 1);
  ENSURE_ARRAY(value);
  id option = [value objectAtIndex:0];

  UIImage *badge = [PHLivePhotoView livePhotoBadgeImageWithOptions:[TiUtils intValue:option def:PHLivePhotoBadgeOptionsOverContent]];

  // Badges only work on devices.
  if (badge == nil) {
    return nil;
  }

  TiBlob *image = [[[TiBlob alloc] _initWithPageContext:[self pageContext] andImage:badge] autorelease];

  return image;
}
#endif

#ifdef USE_TI_UIIOSLIVEPHOTO_BADGE_OPTIONS_OVER_CONTENT
- (NSNumber *)LIVEPHOTO_BADGE_OPTIONS_OVER_CONTENT
{
  if ([TiUtils isIOS9_1OrGreater]) {
    return NUMINTEGER(PHLivePhotoBadgeOptionsOverContent);
  }
  return NUMINT(0);
}
#endif

#ifdef USE_TI_UIIOSLIVEPHOTO_BADGE_OPTIONS_LIVE_OFF
- (NSNumber *)LIVEPHOTO_BADGE_OPTIONS_LIVE_OFF
{
  if ([TiUtils isIOS9_1OrGreater]) {
    return NUMINTEGER(PHLivePhotoBadgeOptionsLiveOff);
  }
  return NUMINT(0);
}
#endif

#ifdef USE_TI_UIIOSANIMATOR
- (id)createAnimator:(id)args
{
  return [[[TiAnimatorProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}
#ifdef USE_TI_UIIOSSNAPBEHAVIOR
- (id)createSnapBehavior:(id)args
{
  return [[[TiSnapBehavior alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}
#endif
#ifdef USE_TI_UIIOSPUSHBEHAVIOR
- (id)createPushBehavior:(id)args
{
  return [[[TiPushBehavior alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}
//TiPushBehavior Constants
MAKE_SYSTEM_PROP(PUSH_MODE_CONTINUOUS, 0);
MAKE_SYSTEM_PROP(PUSH_MODE_INSTANTANEOUS, 1);
#endif

#ifdef USE_TI_UIIOSGRAVITYBEHAVIOR
- (id)createGravityBehavior:(id)args
{
  return [[[TiGravityBehavior alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}
#endif

#ifdef USE_TI_UIIOSANCHORATTACHMENTBEHAVIOR
- (id)createAnchorAttachmentBehavior:(id)args
{
  return [[[TiAnchorAttachBehavior alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}
#endif

#ifdef USE_TI_UIIOSVIEWATTACHMENTBEHAVIOR
- (id)createViewAttachmentBehavior:(id)args
{
  return [[[TiViewAttachBehavior alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}
#endif

#ifdef USE_TI_UIIOSCOLLISIONBEHAVIOR
- (id)createCollisionBehavior:(id)args
{
  return [[[TiCollisionBehavior alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}
//TiCollisionBehavior Constants
MAKE_SYSTEM_PROP(COLLISION_MODE_ITEM, 0);
MAKE_SYSTEM_PROP(COLLISION_MODE_BOUNDARY, 1);
MAKE_SYSTEM_PROP(COLLISION_MODE_ALL, 2);
#endif

#ifdef USE_TI_UIIOSDYNAMICITEMBEHAVIOR
- (id)createDynamicItemBehavior:(id)args
{
  return [[[TiDynamicItemBehavior alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}
#endif
#endif

MAKE_SYSTEM_PROP(BLEND_MODE_NORMAL, kCGBlendModeNormal);
MAKE_SYSTEM_PROP(BLEND_MODE_MULTIPLY, kCGBlendModeMultiply);
MAKE_SYSTEM_PROP(BLEND_MODE_SCREEN, kCGBlendModeScreen);
MAKE_SYSTEM_PROP(BLEND_MODE_OVERLAY, kCGBlendModeOverlay);
MAKE_SYSTEM_PROP(BLEND_MODE_DARKEN, kCGBlendModeDarken);
MAKE_SYSTEM_PROP(BLEND_MODE_LIGHTEN, kCGBlendModeLighten);
MAKE_SYSTEM_PROP(BLEND_MODE_COLOR_DODGE, kCGBlendModeColorDodge);
MAKE_SYSTEM_PROP(BLEND_MODE_COLOR_BURN, kCGBlendModeColorBurn);
MAKE_SYSTEM_PROP(BLEND_MODE_SOFT_LIGHT, kCGBlendModeSoftLight);
MAKE_SYSTEM_PROP(BLEND_MODE_HARD_LIGHT, kCGBlendModeHardLight);
MAKE_SYSTEM_PROP(BLEND_MODE_DIFFERENCE, kCGBlendModeDifference);
MAKE_SYSTEM_PROP(BLEND_MODE_EXCLUSION, kCGBlendModeExclusion);
MAKE_SYSTEM_PROP(BLEND_MODE_HUE, kCGBlendModeHue);
MAKE_SYSTEM_PROP(BLEND_MODE_SATURATION, kCGBlendModeSaturation);
MAKE_SYSTEM_PROP(BLEND_MODE_COLOR, kCGBlendModeColor);
MAKE_SYSTEM_PROP(BLEND_MODE_LUMINOSITY, kCGBlendModeLuminosity);
MAKE_SYSTEM_PROP(BLEND_MODE_CLEAR, kCGBlendModeClear);
MAKE_SYSTEM_PROP(BLEND_MODE_COPY, kCGBlendModeCopy);
MAKE_SYSTEM_PROP(BLEND_MODE_SOURCE_IN, kCGBlendModeSourceIn);
MAKE_SYSTEM_PROP(BLEND_MODE_SOURCE_OUT, kCGBlendModeSourceOut);
MAKE_SYSTEM_PROP(BLEND_MODE_SOURCE_ATOP, kCGBlendModeSourceAtop);
MAKE_SYSTEM_PROP(BLEND_MODE_DESTINATION_OVER, kCGBlendModeDestinationOver);
MAKE_SYSTEM_PROP(BLEND_MODE_DESTINATION_IN, kCGBlendModeDestinationIn);
MAKE_SYSTEM_PROP(BLEND_MODE_DESTINATION_OUT, kCGBlendModeDestinationOut);
MAKE_SYSTEM_PROP(BLEND_MODE_DESTINATION_ATOP, kCGBlendModeDestinationAtop);
MAKE_SYSTEM_PROP(BLEND_MODE_XOR, kCGBlendModeXOR);
MAKE_SYSTEM_PROP(BLEND_MODE_PLUS_DARKER, kCGBlendModePlusDarker);
MAKE_SYSTEM_PROP(BLEND_MODE_PLUS_LIGHTER, kCGBlendModePlusLighter);

MAKE_SYSTEM_STR(COLOR_GROUP_TABLEVIEW_BACKGROUND, IOS_COLOR_GROUP_TABLEVIEW_BACKGROUND);
MAKE_SYSTEM_STR(TABLEVIEW_INDEX_SEARCH, UITableViewIndexSearch);

MAKE_SYSTEM_PROP(WEBVIEW_NAVIGATIONTYPE_LINK_CLICKED, UIWebViewNavigationTypeLinkClicked);
MAKE_SYSTEM_PROP(WEBVIEW_NAVIGATIONTYPE_FORM_SUBMITTED, UIWebViewNavigationTypeFormSubmitted);
MAKE_SYSTEM_PROP(WEBVIEW_NAVIGATIONTYPE_BACK_FORWARD, UIWebViewNavigationTypeBackForward);
MAKE_SYSTEM_PROP(WEBVIEW_NAVIGATIONTYPE_RELOAD, UIWebViewNavigationTypeReload);
MAKE_SYSTEM_PROP(WEBVIEW_NAVIGATIONTYPE_FORM_RESUBMITTED, UIWebViewNavigationTypeFormResubmitted);
MAKE_SYSTEM_PROP(WEBVIEW_NAVIGATIONTYPE_OTHER, UIWebViewNavigationTypeOther);

#ifdef USE_TI_UIIOSAPPLICATIONSHORTCUTS
- (id)createApplicationShortcuts:(id)args
{
  return [[[TiUIiOSApplicationShortcutsProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}

MAKE_SYSTEM_PROP(SHORTCUT_ICON_TYPE_COMPOSE, UIApplicationShortcutIconTypeCompose);
MAKE_SYSTEM_PROP(SHORTCUT_ICON_TYPE_PLAY, UIApplicationShortcutIconTypePlay);
MAKE_SYSTEM_PROP(SHORTCUT_ICON_TYPE_PAUSE, UIApplicationShortcutIconTypePause);
MAKE_SYSTEM_PROP(SHORTCUT_ICON_TYPE_ADD, UIApplicationShortcutIconTypeAdd);
MAKE_SYSTEM_PROP(SHORTCUT_ICON_TYPE_LOCATION, UIApplicationShortcutIconTypeLocation);
MAKE_SYSTEM_PROP(SHORTCUT_ICON_TYPE_SEARCH, UIApplicationShortcutIconTypeSearch);
MAKE_SYSTEM_PROP(SHORTCUT_ICON_TYPE_SHARE, UIApplicationShortcutIconTypeShare);
MAKE_SYSTEM_PROP(SHORTCUT_ICON_TYPE_PROHIBIT, UIApplicationShortcutIconTypeProhibit);
MAKE_SYSTEM_PROP(SHORTCUT_ICON_TYPE_CONTACT, UIApplicationShortcutIconTypeContact);
MAKE_SYSTEM_PROP(SHORTCUT_ICON_TYPE_HOME, UIApplicationShortcutIconTypeHome);
MAKE_SYSTEM_PROP(SHORTCUT_ICON_TYPE_MARK_LOCATION, UIApplicationShortcutIconTypeMarkLocation);
MAKE_SYSTEM_PROP(SHORTCUT_ICON_TYPE_FAVORITE, UIApplicationShortcutIconTypeFavorite);
MAKE_SYSTEM_PROP(SHORTCUT_ICON_TYPE_LOVE, UIApplicationShortcutIconTypeLove);
MAKE_SYSTEM_PROP(SHORTCUT_ICON_TYPE_CLOUD, UIApplicationShortcutIconTypeCloud);
MAKE_SYSTEM_PROP(SHORTCUT_ICON_TYPE_INVITATION, UIApplicationShortcutIconTypeInvitation);
MAKE_SYSTEM_PROP(SHORTCUT_ICON_TYPE_CONFIRMATION, UIApplicationShortcutIconTypeConfirmation);
MAKE_SYSTEM_PROP(SHORTCUT_ICON_TYPE_MAIL, UIApplicationShortcutIconTypeMail);
MAKE_SYSTEM_PROP(SHORTCUT_ICON_TYPE_MESSAGE, UIApplicationShortcutIconTypeMessage);
MAKE_SYSTEM_PROP(SHORTCUT_ICON_TYPE_DATE, UIApplicationShortcutIconTypeDate);
MAKE_SYSTEM_PROP(SHORTCUT_ICON_TYPE_TIME, UIApplicationShortcutIconTypeTime);
MAKE_SYSTEM_PROP(SHORTCUT_ICON_TYPE_CAPTURE_PHOTO, UIApplicationShortcutIconTypeCapturePhoto);
MAKE_SYSTEM_PROP(SHORTCUT_ICON_TYPE_CAPTURE_VIDEO, UIApplicationShortcutIconTypeCaptureVideo);
MAKE_SYSTEM_PROP(SHORTCUT_ICON_TYPE_TASK, UIApplicationShortcutIconTypeTask);
MAKE_SYSTEM_PROP(SHORTCUT_ICON_TYPE_TASK_COMPLETED, UIApplicationShortcutIconTypeTaskCompleted);
MAKE_SYSTEM_PROP(SHORTCUT_ICON_TYPE_ALARM, UIApplicationShortcutIconTypeAlarm);
MAKE_SYSTEM_PROP(SHORTCUT_ICON_TYPE_BOOKMARK, UIApplicationShortcutIconTypeBookmark);
MAKE_SYSTEM_PROP(SHORTCUT_ICON_TYPE_SHUFFLE, UIApplicationShortcutIconTypeShuffle);
MAKE_SYSTEM_PROP(SHORTCUT_ICON_TYPE_AUDIO, UIApplicationShortcutIconTypeAudio);
MAKE_SYSTEM_PROP(SHORTCUT_ICON_TYPE_UPDATE, UIApplicationShortcutIconTypeUpdate);
#endif

//Modal Transition and Presentatiom
MAKE_SYSTEM_PROP(MODAL_TRANSITION_STYLE_COVER_VERTICAL, UIModalTransitionStyleCoverVertical);
MAKE_SYSTEM_PROP(MODAL_TRANSITION_STYLE_FLIP_HORIZONTAL, UIModalTransitionStyleFlipHorizontal);
MAKE_SYSTEM_PROP(MODAL_TRANSITION_STYLE_CROSS_DISSOLVE, UIModalTransitionStyleCrossDissolve);

MAKE_SYSTEM_PROP(MODAL_PRESENTATION_FULLSCREEN, UIModalPresentationFullScreen);
MAKE_SYSTEM_PROP(MODAL_TRANSITION_STYLE_PARTIAL_CURL, UIModalTransitionStylePartialCurl);
MAKE_SYSTEM_PROP(MODAL_PRESENTATION_PAGESHEET, UIModalPresentationPageSheet);
MAKE_SYSTEM_PROP(MODAL_PRESENTATION_FORMSHEET, UIModalPresentationFormSheet);
MAKE_SYSTEM_PROP(MODAL_PRESENTATION_CURRENT_CONTEXT, UIModalPresentationCurrentContext);

#if IS_XCODE_8
#ifdef USE_TI_UIIOSFEEDBACKGENERATOR

- (id)createFeedbackGenerator:(id)args
{
  return [[[TiUIiOSFeedbackGeneratorProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}

MAKE_SYSTEM_PROP(FEEDBACK_GENERATOR_TYPE_SELECTION, 0);
MAKE_SYSTEM_PROP(FEEDBACK_GENERATOR_TYPE_IMPACT, 1);
MAKE_SYSTEM_PROP(FEEDBACK_GENERATOR_TYPE_NOTIFICATION, 2);

MAKE_SYSTEM_PROP(FEEDBACK_GENERATOR_NOTIFICATION_TYPE_SUCCESS, UINotificationFeedbackTypeSuccess);
MAKE_SYSTEM_PROP(FEEDBACK_GENERATOR_NOTIFICATION_TYPE_WARNING, UINotificationFeedbackTypeWarning);
MAKE_SYSTEM_PROP(FEEDBACK_GENERATOR_NOTIFICATION_TYPE_ERROR, UINotificationFeedbackTypeError);

MAKE_SYSTEM_PROP(FEEDBACK_GENERATOR_IMPACT_STYLE_LIGHT, UIImpactFeedbackStyleLight);
MAKE_SYSTEM_PROP(FEEDBACK_GENERATOR_IMPACT_STYLE_MEDIUM, UIImpactFeedbackStyleMedium);
MAKE_SYSTEM_PROP(FEEDBACK_GENERATOR_IMPACT_STYLE_HEAVY, UIImpactFeedbackStyleHeavy);
#endif
#endif

@end
#endif
