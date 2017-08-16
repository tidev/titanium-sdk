/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONESYSTEMBUTTON

#import "TiUIiPhoneSystemButtonProxy.h"
#import "TiBase.h"

@implementation TiUIiPhoneSystemButtonProxy

- (NSString *)apiName
{
  return @"Ti.UI.iPhone.SystemButton";
}

MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(ACTION, UIBarButtonSystemItemAction, @"UI.iPhone.SystemButton.ACTION", @"5.4.0", @"UI.iOS.SystemButton.ACTION");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(CAMERA, UIBarButtonSystemItemCamera, @"UI.iPhone.SystemButton.CAMERA", @"5.4.0", @"UI.iOS.SystemButton.CAMERA");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(COMPOSE, UIBarButtonSystemItemCompose, @"UI.iPhone.SystemButton.COMPOSE", @"5.4.0", @"UI.iOS.SystemButton.COMPOSE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BOOKMARKS, UIBarButtonSystemItemBookmarks, @"UI.iPhone.SystemButton.BOOKMARKS", @"5.4.0", @"UI.iOS.SystemButton.BOOKMARKS");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(SEARCH, UIBarButtonSystemItemSearch, @"UI.iPhone.SystemButton.SEARCH", @"5.4.0", @"UI.iOS.SystemButton.SEARCH");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(ADD, UIBarButtonSystemItemAdd, @"UI.iPhone.SystemButton.ADD", @"5.4.0", @"UI.iOS.SystemButton.ADD");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(TRASH, UIBarButtonSystemItemTrash, @"UI.iPhone.SystemButton.TRASH", @"5.4.0", @"UI.iOS.SystemButton.TRASH");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(REPLY, UIBarButtonSystemItemReply, @"UI.iPhone.SystemButton.REPLY", @"5.4.0", @"UI.iOS.SystemButton.REPLY");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(STOP, UIBarButtonSystemItemStop, @"UI.iPhone.SystemButton.STOP", @"5.4.0", @"UI.iOS.SystemButton.STOP");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(REFRESH, UIBarButtonSystemItemRefresh, @"UI.iPhone.SystemButton.REFRESH", @"5.4.0", @"UI.iOS.SystemButton.REFRESH");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(PLAY, UIBarButtonSystemItemPlay, @"UI.iPhone.SystemButton.PLAY", @"5.4.0", @"UI.iOS.SystemButton.PLAY");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(PAUSE, UIBarButtonSystemItemPause, @"UI.iPhone.SystemButton.PAUSE", @"5.4.0", @"UI.iOS.SystemButton.PAUSE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(FAST_FORWARD, UIBarButtonSystemItemFastForward, @"UI.iPhone.SystemButton.FAST_FORWARD", @"5.4.0", @"UI.iOS.SystemButton.FAST_FORWARD");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(REWIND, UIBarButtonSystemItemRewind, @"UI.iPhone.SystemButton.REWIND", @"5.4.0", @"UI.iOS.SystemButton.REWIND");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(EDIT, UIBarButtonSystemItemEdit, @"UI.iPhone.SystemButton.EDIT", @"5.4.0", @"UI.iOS.SystemButton.EDIT");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(CANCEL, UIBarButtonSystemItemCancel, @"UI.iPhone.SystemButton.CANCEL", @"5.4.0", @"UI.iOS.SystemButton.CANCEL");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(SAVE, UIBarButtonSystemItemSave, @"UI.iPhone.SystemButton.SAVE", @"5.4.0", @"UI.iOS.SystemButton.SAVE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(ORGANIZE, UIBarButtonSystemItemOrganize, @"UI.iPhone.SystemButton.ORGANIZE", @"5.4.0", @"UI.iOS.SystemButton.ORGANIZE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(DONE, UIBarButtonSystemItemDone, @"UI.iPhone.SystemButton.DONE", @"5.4.0", @"UI.iOS.SystemButton.DONE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(FLEXIBLE_SPACE, UIBarButtonSystemItemFlexibleSpace, @"UI.iPhone.SystemButton.FLEXIBLE_SPACE", @"5.4.0", @"UI.iOS.SystemButton.FLEXIBLE_SPACE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(FIXED_SPACE, UIBarButtonSystemItemFixedSpace, @"UI.iPhone.SystemButton.FIXED_SPACE", @"5.4.0", @"UI.iOS.SystemButton.FIXED_SPACE");

MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(ACTIVITY, UITitaniumNativeItemSpinner, @"UI.iPhone.SystemButtonStyle.ACTIVITY", @"5.4.0", @"UI.iOS.SystemButtonStyle.ACTIVITY");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(SPINNER, UITitaniumNativeItemSpinner, @"UI.iPhone.SystemButtonStyle.SPINNER", @"5.4.0", @"UI.iOS.SystemButtonStyle.SPINNER");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(INFO_LIGHT, UITitaniumNativeItemInfoLight, @"UI.iPhone.SystemButtonStyle.INFO_LIGHT", @"5.4.0", @"UI.iOS.SystemButtonStyle.INFO_LIGHT");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(INFO_DARK, UITitaniumNativeItemInfoDark, @"UI.iPhone.SystemButtonStyle.INFO_DARK", @"5.4.0", @"UI.iOS.SystemButtonStyle.INFO_DARK");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(DISCLOSURE, UITitaniumNativeItemDisclosure, @"UI.iPhone.SystemButtonStyle.DISCLOSURE", @"5.4.0", @"UI.iOS.SystemButtonStyle.DISCLOSURE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(CONTACT_ADD, UITitaniumNativeItemContactAdd, @"UI.iPhone.SystemButtonStyle.CONTACT_ADD", @"5.4.0", @"UI.iOS.SystemButtonStyle.CONTACT_ADD");

@end

#endif