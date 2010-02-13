/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

@class TiProxy;
@class TiWindowProxy;

@interface TitaniumViewController : UIViewController<UIApplicationDelegate> {
@private
	NSMutableArray *stack;	
	TiWindowProxy *currentWindow;
}

-(void)windowFocused:(TiProxy*)window;
-(void)windowUnfocused:(TiProxy*)window;
-(void)windowBeforeFocused:(TiProxy*)window;
-(void)windowBeforeUnfocused:(TiProxy*)window;

-(CGRect)resizeView;

-(UINavigationController*)currentNavController;

@end
