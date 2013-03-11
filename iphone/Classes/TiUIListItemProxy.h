/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UILISTVIEW

#import "TiViewProxy.h"

@class TiUIListItem;

@interface TiUIListItemProxy : TiViewProxy

@property (nonatomic, readwrite, assign) TiUIListItem *listItem;

@end

#endif
