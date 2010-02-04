/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

@class TiProxy;
@class TiWindowProxy;

@protocol TiTab

@required


-(TiProxy*)tabGroup;
-(UINavigationController*)controller;

-(void)open:(NSArray*)args;
-(void)close:(NSArray*)args;
-(void)windowClosing:(TiWindowProxy*)window animated:(BOOL)animated;

@end
