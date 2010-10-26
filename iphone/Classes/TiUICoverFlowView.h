/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UICOVERFLOWVIEW

#import "TiUIView.h"
#import "AFOpenFlow/AFOpenFlowView.h"
#import "ImageLoader.h"

@interface TiUICoverFlowView : TiUIView <AFOpenFlowViewDataSource,AFOpenFlowViewDelegate,ImageLoaderDelegate>
{
@private
	AFOpenFlowView *view;
	NSMutableDictionary* toLoad;
	NSMutableDictionary* loading;
	NSRecursiveLock* loadLock;
	int previous;
}

-(void)setImage:(id)image forIndex:(NSInteger)index;

@end

#endif