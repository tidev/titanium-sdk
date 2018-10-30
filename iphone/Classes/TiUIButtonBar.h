/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <TitaniumKit/TiUIView.h>

@interface TiUIButtonBar : TiUIView <LayoutAutosizing> {
  NSInteger selectedIndex;
  BOOL controlSpecifiedWidth;
  UISegmentedControl *segmentedControl;
}

- (void)setTabbedBar:(BOOL)newIsTabbed;

- (IBAction)onSegmentChange:(id)sender;

@end
