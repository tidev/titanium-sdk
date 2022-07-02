/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSSYSTEMICON

#import "TiUIiOSSystemIconProxy.h"
#import <TitaniumKit/TiBase.h>

@implementation TiUIiOSSystemIconProxy

- (NSString *)apiName
{
  return @"Ti.UI.iOS.SystemIcon";
}

MAKE_SYSTEM_PROP(BOOKMARKS, UITabBarSystemItemBookmarks);
MAKE_SYSTEM_PROP(CONTACTS, UITabBarSystemItemContacts);
MAKE_SYSTEM_PROP(DOWNLOADS, UITabBarSystemItemDownloads);
MAKE_SYSTEM_PROP(FAVORITES, UITabBarSystemItemFavorites);
MAKE_SYSTEM_PROP(FEATURED, UITabBarSystemItemFeatured);
MAKE_SYSTEM_PROP(HISTORY, UITabBarSystemItemHistory);
MAKE_SYSTEM_PROP(MORE, UITabBarSystemItemMore);
MAKE_SYSTEM_PROP(MOST_RECENT, UITabBarSystemItemMostRecent);
MAKE_SYSTEM_PROP(MOST_VIEWED, UITabBarSystemItemMostViewed);
MAKE_SYSTEM_PROP(RECENTS, UITabBarSystemItemRecents);
MAKE_SYSTEM_PROP(SEARCH, UITabBarSystemItemSearch);
MAKE_SYSTEM_PROP(TOP_RATED, UITabBarSystemItemTopRated);

@end

#endif
