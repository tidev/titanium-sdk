/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiLayoutView.h"


@interface TiScrollView : TiLayoutView

@property(nonatomic, copy) void (^onContentLayout)(TiLayoutView* sender, CGRect rect);

-(void)setContentWidth_:(id)val;
-(void)setContentHeight_:(id)val;
-(TiLayoutView*)contentView;
@end
