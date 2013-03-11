/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UILISTVIEW

#import "TiUIListItemProxy.h"
#import "TiUtils.h"
#import "TiUIListItem.h"

@implementation TiUIListItemProxy

@synthesize listItem = _listItem;

- (id)init
{
    self = [super init];
    if (self) {
		viewInitialized = YES;
		[self windowWillOpen];
		[self windowDidOpen];
		[self willShow];
    }
    return self;
}

- (TiUIView *)view
{
	return view = (TiUIView *)_listItem.contentView;
}

- (void)detachView
{
	view = nil;
}

@end

#endif
