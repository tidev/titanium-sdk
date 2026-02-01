/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>

@class TiScriptError;

@interface TiErrorNavigationController : UINavigationController

@end

@interface TiErrorController : UIViewController {

  NSString *error;
  TiScriptError *scriptError;
  UIScrollView *scrollView;
  UITextView *messageView;
  UIButton *continueButton;
}

- (id)initWithError:(NSString *)error_;
- (id)initWithScriptError:(TiScriptError *)scriptError_;

@end
