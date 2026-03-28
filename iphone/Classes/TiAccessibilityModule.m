/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_ACCESSIBILITY

#import "TiAccessibilityModule.h"
#import <TitaniumKit/TiUIView.h>
#import <TitaniumKit/TiUtils.h>

@implementation TiAccessibilityModule

#pragma mark - Internal

- (NSString *)apiName
{
  return @"Ti.Accessibility";
}

#pragma mark - Public API

// ---------------------------------------------------------------------------
// announce(message)
//
// Posts UIAccessibilityAnnouncementNotification so VoiceOver reads the message
// aloud. This is the iOS equivalent of Android's View.announceForAccessibility().
//
// JavaScript:
//   Ti.Accessibility.announce('Data refreshed');
// ---------------------------------------------------------------------------
- (void)announce:(NSString *)message
{
  if (message == nil || [message length] == 0) {
    NSLog(@"[WARN] Ti.Accessibility.announce called with empty message, ignoring.");
    return;
  }

  // Must be dispatched on the main thread — UIKit accessibility APIs are not thread-safe.
  TiThreadPerformOnMainThread(
      ^{
        UIAccessibilityPostNotification(UIAccessibilityAnnouncementNotification, message);
      },
      NO);
}

// ---------------------------------------------------------------------------
// focus(viewProxy)
//
// Posts UIAccessibilityLayoutChangedNotification with the resolved native view,
// causing VoiceOver to shift focus to that element and read it aloud.
//
// JavaScript:
//   Ti.Accessibility.focus(myRow);
// ---------------------------------------------------------------------------
- (void)focus:(id)viewProxy
{
  if (![viewProxy isKindOfClass:[TiViewProxy class]]) {
    NSLog(@"[WARN] Ti.Accessibility.focus: argument must be a Ti.UI view proxy.");
    return;
  }

  TiViewProxy *proxy = (TiViewProxy *)viewProxy;

  // Resolving the view and posting the notification must happen on the main thread.
  TiThreadPerformOnMainThread(
      ^{
        // peekView returns the TiUIView if it has already been realized, nil otherwise.
        // We use peekView (not -view) to avoid forcing premature view creation.
        TiUIView *uiView = (TiUIView *)[proxy peekView];
        if (uiView == nil) {
          NSLog(@"[WARN] Ti.Accessibility.focus: view is not yet realized, ignoring.");
          return;
        }

        // Retrieve the real accessibility element in case the view overrides it.
        id element = [uiView accessibilityElement];
        UIView *targetView = [element isKindOfClass:[UIView class]] ? element : uiView;

        // UIAccessibilityLayoutChangedNotification moves VoiceOver focus to the
        // supplied element on the next accessibility layout pass.
        UIAccessibilityPostNotification(UIAccessibilityLayoutChangedNotification, targetView);
      },
      NO);
}

@end

#endif /* USE_TI_ACCESSIBILITY */
