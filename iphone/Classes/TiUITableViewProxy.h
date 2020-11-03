/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITABLEVIEW

#ifndef USE_TI_UISEARCHBAR
#define USE_TI_UISEARCHBAR
#endif

#import <TitaniumKit/TiViewProxy.h>

@class TiUITableViewRowProxy;
@class TiUITableViewSectionProxy;
@interface TiUITableViewProxy : TiViewProxy {
  NSMutableArray *sections;
}
- (void)setData:(id)args withObject:(id)properties;
- (NSArray *)data;
//Sections and Data are the sanitized version.
@property (nonatomic, readwrite, copy) NSArray *sections;
- (NSNumber *)sectionCount;

#pragma mark NON-JS functionality
//internalSections is until TODO: Stop JS from using ValueForKey
@property (nonatomic, readwrite, retain) NSMutableArray *internalSections;

- (NSInteger)indexForRow:(TiUITableViewRowProxy *)row;
- (NSInteger)sectionIndexForIndex:(NSInteger)theindex;
- (TiUITableViewRowProxy *)rowForIndex:(NSInteger)index section:(NSInteger *)section;
- (NSIndexPath *)indexPathFromInt:(NSInteger)index;
- (NSInteger)indexForIndexPath:(NSIndexPath *)path;
- (TiUITableViewSectionProxy *)sectionForIndex:(NSInteger)index row:(TiUITableViewRowProxy **)rowOut;
- (void)rememberSection:(TiUITableViewSectionProxy *)section;
- (void)forgetSection:(TiUITableViewSectionProxy *)section;

@end

#endif
