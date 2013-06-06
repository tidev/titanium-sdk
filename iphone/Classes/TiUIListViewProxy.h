/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UILISTVIEW

#import "TiViewProxy.h"
#import "TiUIListSectionProxy.h"

@interface TiUIListViewProxy : TiViewProxy < TiUIListViewDelegate >

@property (nonatomic, readonly) NSArray *sections;
@property (nonatomic, readonly) NSNumber *sectionCount;

- (TiUIListSectionProxy *)sectionForIndex:(NSUInteger)index;

@end

#endif
