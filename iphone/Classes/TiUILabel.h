/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUIView.h"

@interface TiUILabel : TiUIView<LayoutAutosizing> {
@private
	UILabel *label;
	BOOL requiresLayout;
}

@property(nonatomic,getter=isHighlighted) BOOL     highlighted;          // default is NO

@end
