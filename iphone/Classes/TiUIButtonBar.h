/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUIView.h"

@interface TiUIButtonBar : TiUIView {
	NSInteger selectedIndex;
	UISegmentedControl * segmentedControl;
}

- (void)setTabbedBar: (BOOL)newIsTabbed;
-(UISegmentedControl *)segmentedControl;
-(IBAction)onSegmentChange:(id)sender;

@end
