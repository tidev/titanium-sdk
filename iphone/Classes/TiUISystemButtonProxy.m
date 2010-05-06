/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONESYSTEMBUTTON

#import "TiUISystemButtonProxy.h"

@implementation TiUISystemButtonProxy

MAKE_SYSTEM_PROP(ACTION,UIBarButtonSystemItemAction);
MAKE_SYSTEM_PROP(CAMERA,UIBarButtonSystemItemCamera);
MAKE_SYSTEM_PROP(COMPOSE,UIBarButtonSystemItemCompose);
MAKE_SYSTEM_PROP(BOOKMARKS,UIBarButtonSystemItemBookmarks);
MAKE_SYSTEM_PROP(SEARCH,UIBarButtonSystemItemSearch);
MAKE_SYSTEM_PROP(ADD,UIBarButtonSystemItemAdd);
MAKE_SYSTEM_PROP(TRASH,UIBarButtonSystemItemTrash);
MAKE_SYSTEM_PROP(REPLY,UIBarButtonSystemItemReply);
MAKE_SYSTEM_PROP(STOP,UIBarButtonSystemItemStop);
MAKE_SYSTEM_PROP(REFRESH,UIBarButtonSystemItemRefresh);
MAKE_SYSTEM_PROP(PLAY,UIBarButtonSystemItemPlay);
MAKE_SYSTEM_PROP(PAUSE,UIBarButtonSystemItemPause);
MAKE_SYSTEM_PROP(FAST_FORWARD,UIBarButtonSystemItemFastForward);
MAKE_SYSTEM_PROP(REWIND,UIBarButtonSystemItemRewind);
MAKE_SYSTEM_PROP(EDIT,UIBarButtonSystemItemEdit);
MAKE_SYSTEM_PROP(CANCEL,UIBarButtonSystemItemCancel);
MAKE_SYSTEM_PROP(SAVE,UIBarButtonSystemItemSave);
MAKE_SYSTEM_PROP(ORGANIZE,UIBarButtonSystemItemOrganize);
MAKE_SYSTEM_PROP(DONE,UIBarButtonSystemItemDone);
MAKE_SYSTEM_PROP(FLEXIBLE_SPACE,UIBarButtonSystemItemFlexibleSpace);
MAKE_SYSTEM_PROP(FIXED_SPACE,UIBarButtonSystemItemFixedSpace);

MAKE_SYSTEM_PROP(ACTIVITY,UITitaniumNativeItemSpinner);
MAKE_SYSTEM_PROP(SPINNER,UITitaniumNativeItemSpinner);
MAKE_SYSTEM_PROP(INFO_LIGHT,UITitaniumNativeItemInfoLight);
MAKE_SYSTEM_PROP(INFO_DARK,UITitaniumNativeItemInfoDark);
MAKE_SYSTEM_PROP(DISCLOSURE,UITitaniumNativeItemDisclosure);
MAKE_SYSTEM_PROP(CONTACT_ADD,UITitaniumNativeItemContactAdd);


@end

#endif