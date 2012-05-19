/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUIView.h"

@interface TiUIButtonBar : TiUIView<LayoutAutosizing> {
	int selectedIndex;
	BOOL isNullStyle;
	BOOL controlSpecifiedWidth;
	UISegmentedControl * segmentedControl;
}

- (void)setTabbedBar: (BOOL)newIsTabbed;

-(IBAction)onSegmentChange:(id)sender;

@end
