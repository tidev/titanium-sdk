/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

@import UIKit;

@interface TiErrorController : UIViewController {

  NSString *error;
  UILabel *disclosureLabel;
  UILabel *messageLabel;
  UIButton *dismissButton;
  UIView *centerView;
  UILabel *titleLabel;
}

- (id)initWithError:(NSString *)error_;

@end
