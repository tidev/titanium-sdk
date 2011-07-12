/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UISCROLLABLEVIEW

#import "TiViewProxy.h"
#import <libkern/OSAtomic.h>

@interface TiUIScrollableViewProxy : TiViewProxy 
{
	pthread_rwlock_t viewsLock;
	NSMutableArray *viewProxies;
}

@property(nonatomic,readonly)	NSArray * viewProxies;
-(TiViewProxy *)viewAtIndex:(int)index;
-(void)lockViews;
-(void)unlockViews;
-(int)viewCount;

@end

#endif