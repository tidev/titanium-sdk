/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef MODULE_TI_GESTURE

#import "GestureModule.h"
#import "TitaniumViewController.h"

@implementation GestureModule

#pragma mark startModule

- (BOOL) startModule
{
	NSString * moduleDictString = [NSString stringWithFormat:@"{addEventListener:Ti._ADDEVT,"
			"removeEventListener:Ti._REMEVT,doEvent:Ti._ONEVT,_EVT:{shake:[],orientationchange:[]},"
			"PORTRAIT:%d,LANDSCAPE:%d,LANDSCAPE_LEFT:%d,LANDSCAPE_RIGHT:%d,UPSIDE_PORTRAIT:%d,"
			"isPortrait:function(foo){return (foo & Ti.Gesture.PORTRAIT)!=0;},"
			"isLandscape:function(foo){return (foo & Ti.Gesture.LANDSCAPE)!=0;}}",
			TitaniumViewControllerPortrait, TitaniumViewControllerLandscape,TitaniumViewControllerLandscapeLeft,
			TitaniumViewControllerLandscapeRight,TitaniumViewControllerPortraitUpsideDown];
	[[[TitaniumHost sharedHost] titaniumObject] setObject:[TitaniumJSCode codeWithString:moduleDictString] forKey:@"Gesture"];
	
	return YES;
}

@end

#endif
