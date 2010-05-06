/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONESYSTEMICON

#import "TiProxy.h"

@interface TiUISystemIconProxy : TiProxy {

}

@property(nonatomic,readonly) NSNumber *BOOKMARKS;
@property(nonatomic,readonly) NSNumber *CONTACTS;
@property(nonatomic,readonly) NSNumber *DOWNLOADS;
@property(nonatomic,readonly) NSNumber *FAVORITES;
@property(nonatomic,readonly) NSNumber *HISTORY;
@property(nonatomic,readonly) NSNumber *FEATURED;
@property(nonatomic,readonly) NSNumber *MORE;
@property(nonatomic,readonly) NSNumber *MOST_RECENT;
@property(nonatomic,readonly) NSNumber *MOST_VIEWED;
@property(nonatomic,readonly) NSNumber *RECENTS;
@property(nonatomic,readonly) NSNumber *SEARCH;
@property(nonatomic,readonly) NSNumber *TOP_RATED;

@end

#endif