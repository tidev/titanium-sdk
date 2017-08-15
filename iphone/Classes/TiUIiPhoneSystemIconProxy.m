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

- (NSString *)apiName
{
  return @"Ti.UI.iPhone.SystemIcon";
}

MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BOOKMARKS, UITabBarSystemItemBookmarks, @"UI.iPhone.SystemIcon.BOOKMARKS", @"5.4.0", @"UI.iOS.SystemIcon.BOOKMARKS");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(CONTACTS, UITabBarSystemItemContacts, @"UI.iPhone.SystemIcon.CONTACTS", @"5.4.0", @"UI.iOS.SystemIcon.CONTACTS");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(DOWNLOADS, UITabBarSystemItemDownloads, @"UI.iPhone.SystemIcon.DOWNLOADS", @"5.4.0", @"UI.iOS.SystemIcon.DOWNLOADS");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(FAVORITES, UITabBarSystemItemFavorites, @"UI.iPhone.SystemIcon.FAVORITES", @"5.4.0", @"UI.iOS.SystemIcon.FAVORITES");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(FEATURED, UITabBarSystemItemFeatured, @"UI.iPhone.SystemIcon.FEATURED", @"5.4.0", @"UI.iOS.SystemIcon.FEATURED");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(HISTORY, UITabBarSystemItemHistory, @"UI.iPhone.SystemIcon.HISTORY", @"5.4.0", @"UI.iOS.SystemIcon.HISTORY");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(MORE, UITabBarSystemItemMore, @"UI.iPhone.SystemIcon.MORE", @"5.4.0", @"UI.iOS.SystemIcon.MORE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(MOST_RECENT, UITabBarSystemItemMostRecent, @"UI.iPhone.SystemIcon.MOST_RECENT", @"5.4.0", @"UI.iOS.SystemIcon.MOST_RECENT");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(MOST_VIEWED, UITabBarSystemItemMostViewed, @"UI.iPhone.SystemIcon.MOST_VIEWED", @"5.4.0", @"UI.iOS.SystemIcon.MOST_VIEWED");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(RECENTS, UITabBarSystemItemRecents, @"UI.iPhone.SystemIcon.RECENTS", @"5.4.0", @"UI.iOS.SystemIcon.RECENTS");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(SEARCH, UITabBarSystemItemSearch, @"UI.iPhone.SystemIcon.SEARCH", @"5.4.0", @"UI.iOS.SystemIcon.SEARCH");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(TOP_RATED, UITabBarSystemItemTopRated, @"UI.iPhone.SystemIcon.TOP_RATED", @"5.4.0", @"UI.iOS.SystemIcon.TOP_RATED");

@end

#endif