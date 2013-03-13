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
#import "TiUIListViewProxy.h"

@implementation TiUIListItemProxy {
	TiUIListViewProxy *_listViewProxy; // weak
}

@synthesize listItem = _listItem;
@synthesize indexPath = _indexPath;

- (id)initWithListViewProxy:(TiUIListViewProxy *)listViewProxy inContext:(id<TiEvaluator>)context
{
    self = [self _initWithPageContext:context];
    if (self) {
		_listViewProxy = listViewProxy;
		[context.krollContext invokeBlockOnThread:^{
			[context registerProxy:self];
			[listViewProxy rememberProxy:self];
		}];
    }
    return self;
}

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

-(void)dealloc
{
	[_indexPath release];
	[super dealloc];
}

- (TiUIView *)view
{
	return view = (TiUIView *)_listItem.contentView;
}

- (void)detachView
{
	view = nil;
	[super detachView];
}

-(void)_destroy
{
	view = nil;
	[super _destroy];
}

}

@end

#endif
