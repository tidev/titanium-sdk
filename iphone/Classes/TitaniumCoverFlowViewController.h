/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TitaniumContentViewController.h"
#import "AFOpenFlowView.h"

@interface TitaniumCoverFlowViewController : TitaniumContentViewController<AFOpenFlowViewDelegate,AFOpenFlowViewDataSource> {
	NSMutableArray *images;
	AFOpenFlowView *view;
	UIColor *backgroundColor;
	NSMutableArray *backgrouders;
}

-(void)setUrl:(NSURL*)url index:(NSNumber*)index;
-(void)setSelected:(NSNumber*)index;

@end
