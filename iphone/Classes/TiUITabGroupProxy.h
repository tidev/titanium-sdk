/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITAB

#import "TiWindowProxyNeue.h"
#import "TiTabGroup.h"

@interface TiUITabGroupProxy : TiWindowProxyNeue<TiTabGroup>
{
@private
	NSMutableArray *tabs;
}

-(UITabBar*)tabbar;
-(void)_resetTabArray:(NSArray*)newTabOrder; // Used in tab reordering 
@end

#endif