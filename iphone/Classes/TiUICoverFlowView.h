/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UICOVERFLOWVIEW

#import "TiUIView.h"
#import "AFOpenFlow/AFOpenFlowView.h"

@interface TiUICoverFlowView : TiUIView <AFOpenFlowViewDataSource,AFOpenFlowViewDelegate>
{
@private
	AFOpenFlowView *view;
	NSMutableArray *images;
	int previous;
}

-(void)setURL:(id)urlstr forIndex:(NSInteger)index;

@end

#endif