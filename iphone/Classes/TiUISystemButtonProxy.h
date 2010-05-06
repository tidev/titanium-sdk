/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONESYSTEMBUTTON

#import "TiProxy.h"

@interface TiUISystemButtonProxy : TiProxy {

}


@property(nonatomic,readonly) NSNumber *ACTION;
@property(nonatomic,readonly) NSNumber *ACTIVITY;
@property(nonatomic,readonly) NSNumber *CAMERA;
@property(nonatomic,readonly) NSNumber *COMPOSE;
@property(nonatomic,readonly) NSNumber *BOOKMARKS;
@property(nonatomic,readonly) NSNumber *SEARCH;
@property(nonatomic,readonly) NSNumber *ADD;
@property(nonatomic,readonly) NSNumber *TRASH;
@property(nonatomic,readonly) NSNumber *ORGANIZE;
@property(nonatomic,readonly) NSNumber *REPLY;
@property(nonatomic,readonly) NSNumber *STOP;
@property(nonatomic,readonly) NSNumber *REFRESH;
@property(nonatomic,readonly) NSNumber *PLAY;
@property(nonatomic,readonly) NSNumber *FAST_FORWARD;
@property(nonatomic,readonly) NSNumber *PAUSE;
@property(nonatomic,readonly) NSNumber *REWIND;
@property(nonatomic,readonly) NSNumber *EDIT;
@property(nonatomic,readonly) NSNumber *CANCEL;
@property(nonatomic,readonly) NSNumber *SAVE;
@property(nonatomic,readonly) NSNumber *DONE;
@property(nonatomic,readonly) NSNumber *FLEXIBLE_SPACE;
@property(nonatomic,readonly) NSNumber *FIXED_SPACE;
@property(nonatomic,readonly) NSNumber *INFO_LIGHT;
@property(nonatomic,readonly) NSNumber *INFO_DARK;
@property(nonatomic,readonly) NSNumber *DISCLOSURE;
@property(nonatomic,readonly) NSNumber *CONTACT_ADD;
@property(nonatomic,readonly) NSNumber *SPINNER; // maps to ACTIVITY

@end

#endif