/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_ACCESSIBILITY
#import <JavaScriptCore/JavaScriptCore.h>
#import <TitaniumKit/ObjcModule.h>
#import <TitaniumKit/TiViewProxy.h>

/**
 Ti.Accessibility JS exports.

 Usage (JavaScript):
   Ti.Accessibility.announce('Loading complete');
   Ti.Accessibility.focus(myView);
 */
@protocol TiAccessibilityExports <JSExport>

/**
 Posts a VoiceOver announcement notification so that the message is read aloud.

 @param message The string to announce.
 */
- (void)announce:(NSString *)message;

/**
 Requests VoiceOver focus to move to the native view represented by viewProxy.

 Posts UIAccessibilityLayoutChangedNotification, which causes VoiceOver to re-read
 the focused element and shift focus to the supplied view.

 @param viewProxy A TiViewProxy (or subclass) whose native view should receive focus.
 */
- (void)focus:(id)viewProxy;

@end

/**
 TiAccessibilityModule exposes global accessibility helpers as Ti.Accessibility on iOS.

 Registered as a built-in module under the name "Ti.Accessibility".
 */
@interface TiAccessibilityModule : ObjcModule <TiAccessibilityExports>
@end

#endif /* USE_TI_ACCESSIBILITY */
