/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONESYSTEMICON

#import "TiUIiPhoneSystemIconProxy.h"
#import "TiBase.h"

@implementation TiUIiPhoneSystemIconProxy

-(NSString*)apiName
{
    return @"Ti.UI.iPhone.SystemIcon";
}

MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BOOKMARKS,  UITabBarSystemItemBookmarks,@"UI.iPhone.SystemIcon.BOOKMARKS",@"6.0.0",@"UI.iOS.SystemIcon.BOOKMARKS");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(CONTACTS,   UITabBarSystemItemContacts,@"UI.iPhone.SystemIcon.BOOKMARKS",@"6.0.0",@"UI.iOS.SystemIcon.BOOKMARKS");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(DOWNLOADS,  UITabBarSystemItemDownloads,@"UI.iPhone.SystemIcon.BOOKMARKS",@"6.0.0",@"UI.iOS.SystemIcon.BOOKMARKS");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(FAVORITES,  UITabBarSystemItemFavorites,@"UI.iPhone.SystemIcon.BOOKMARKS",@"6.0.0",@"UI.iOS.SystemIcon.BOOKMARKS");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(FEATURED,   UITabBarSystemItemFeatured,@"UI.iPhone.SystemIcon.BOOKMARKS",@"6.0.0",@"UI.iOS.SystemIcon.BOOKMARKS");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(HISTORY,    UITabBarSystemItemHistory,@"UI.iPhone.SystemIcon.BOOKMARKS",@"6.0.0",@"UI.iOS.SystemIcon.BOOKMARKS");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(MORE,       UITabBarSystemItemMore,@"UI.iPhone.SystemIcon.BOOKMARKS",@"6.0.0",@"UI.iOS.SystemIcon.BOOKMARKS");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(MOST_RECENT,UITabBarSystemItemMostRecent,@"UI.iPhone.SystemIcon.BOOKMARKS",@"6.0.0",@"UI.iOS.SystemIcon.BOOKMARKS");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(MOST_VIEWED,UITabBarSystemItemMostViewed,@"UI.iPhone.SystemIcon.BOOKMARKS",@"6.0.0",@"UI.iOS.SystemIcon.BOOKMARKS");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(RECENTS,    UITabBarSystemItemRecents,@"UI.iPhone.SystemIcon.BOOKMARKS",@"6.0.0",@"UI.iOS.SystemIcon.BOOKMARKS");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(SEARCH,     UITabBarSystemItemSearch,@"UI.iPhone.SystemIcon.BOOKMARKS",@"6.0.0",@"UI.iOS.SystemIcon.BOOKMARKS");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(TOP_RATED,  UITabBarSystemItemTopRated,@"UI.iPhone.SystemIcon.BOOKMARKS",@"6.0.0",@"UI.iOS.SystemIcon.BOOKMARKS");

@end

#endif