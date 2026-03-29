/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_ACCESSIBILITY

#import "AccessibilityModule.h"
#import <TitaniumKit/TiUIView.h>
#import <TitaniumKit/TiUtils.h>

@implementation AccessibilityModule

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
  NSArray *currentArgs = [JSContext currentArguments];
  if (currentArgs != nil && [currentArgs count] > 0) {
    viewProxy = [currentArgs objectAtIndex:0];
  }

  if ([viewProxy isKindOfClass:[JSValue class]]) {
    viewProxy = [self JSValueToNative:(JSValue *)viewProxy];
  }

  if (![viewProxy isKindOfClass:[TiViewProxy class]]) {
    NSLog(@"[WARN] Ti.Accessibility.focus: argument must be a Ti.UI view proxy, got %@", [viewProxy class]);
    return;
  }

  TiViewProxy *proxy = (TiViewProxy *)viewProxy;

  // Resolving the view and posting the notification must happen on the main thread.
  TiThreadPerformOnMainThread(
      ^{
        if (![proxy viewAttached]) {
          NSLog(@"[WARN] Ti.Accessibility.focus: view is not yet realized, ignoring.");
          return;
        }

        // Retrieve the realized view
        TiUIView *uiView = [proxy view];

        // Retrieve the real accessibility element in case the view overrides it.
        id element = [uiView accessibilityElement];
        UIView *targetView = [element isKindOfClass:[UIView class]] ? element : uiView;

        // UIAccessibilityLayoutChangedNotification moves VoiceOver focus to the
        // supplied element on the next accessibility layout pass.
        // A slight delay ensures it is not swallowed if called during a window transition.
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.25 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
          UIAccessibilityPostNotification(UIAccessibilityLayoutChangedNotification, targetView);
        });
      },
      NO);
}

@end

#endif /* USE_TI_ACCESSIBILITY */
