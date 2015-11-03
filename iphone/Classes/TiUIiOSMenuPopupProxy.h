/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSMENUPOPUP
#import "TiProxy.h"

@interface TiUIiOSMenuPopupProxy : TiProxy

/*
 *  The menu items to be presented inside the menu.
 */
@property(nonatomic,retain) NSMutableArray<UIMenuItem*> *menuItems;

/*
 *  Shows the menu.
 */
-(void)show:(id)args;

/*
 *  Hides the menu.
 */
-(void)hide:(id)args;

@end
#endif