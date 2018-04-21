/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_UIIOSFEEDBACKGENERATOR

#import <TitaniumKit/TiProxy.h>

/**
 * Enumeration to handle the feedback generator type in this proxy.
 */
typedef NS_ENUM(NSInteger, TiUIiOSFeedbackGeneratorType) {
  TiUIiOSFeedbackGeneratorTypeSelection = 0,
  TiUIiOSFeedbackGeneratorTypeImpact = 1,
  TiUIiOSFeedbackGeneratorTypeNotification = 2
};

/**
 * Provide support for the iOS 10 haptic engine on supported devices (currently iPhone 7
 * and iPhone 7 Plus). The developer can specify a feedback generator type to distungish
 * between a selection-, impact-, and notification-generator to receive different kind of
 * haptic feedbacks.
 */
@interface TiUIiOSFeedbackGeneratorProxy : TiProxy {
  UIFeedbackGenerator *generator;
  TiUIiOSFeedbackGeneratorType type;
}

/**
 * Used to prepare the haptic sensor for the upcoming interaction with it.
 * @param unused Unused parameter to expose this API as a method.
 */
- (void)prepare:(id)unused;

/**
 * Used to trigger a haptic feedback after a selection has been made.
 * @param unused Unused parameter to expose this API as a method.
 */
- (void)selectionChanged:(id)unused;

/**
 * Used to trigger a haptic feedback after an impact occurred.
 * @param unused Unused parameter to expose this API as a method.
 */
- (void)impactOccurred:(id)unused;

/**
 * Used to trigger a haptic feedback after a notification has been received.
 * @param value The type of the notification to manage the peculiarity of the haptic feedback.
 */
- (void)notificationOccurred:(id)value;

@end

#endif
