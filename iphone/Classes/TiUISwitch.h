/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <TitaniumKit/TiUIView.h>

@interface TiUISwitch : TiUIView <LayoutAutosizing> {
  @private
  UISwitch *switchView;
  BOOL firstInit;
  BOOL animated;
}

- (NSNumber *)value;

- (IBAction)switchChanged:(id)sender;

@end
