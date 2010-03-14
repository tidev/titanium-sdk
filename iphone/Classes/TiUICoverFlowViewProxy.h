/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiViewProxy.h"
#include "AFOpenFlow/AFOpenFlowView.h"


@interface TiUICoverFlowViewProxy : TiViewProxy<AFOpenFlowViewDataSource,AFOpenFlowViewDelegate> {
	NSMutableArray * imageUrls;
}

@property(nonatomic,copy)NSArray * images;

-(void)setURL:(int)index withObject:(id)newUrl;

//			"res.setSelected=function(i){ res.selected = i; };"
//			"res.getSelected=function(){ return res.selected; };"
//			"res.setURL=function(i,newUrl){if(this._TOKEN){Ti.UI._CFLVWACT(this._TOKEN," STRINGVAL(COVERFLOWVIEW_SETURL) ",[i,newUrl]);}};"


@end
