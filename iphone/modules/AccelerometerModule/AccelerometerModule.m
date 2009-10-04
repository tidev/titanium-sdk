/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef MODULE_TI_ACCELEROMETER

#import "AccelerometerModule.h"

//static NSUInteger lastWatchID = 0;

@implementation AccelerometerModule

//	AccelerometerUpdateInterval
//	WatchEvent 'update'
//	
//	When watch and unwatch, we send signal to turn on or off accel if we're going to 0 entries, or adding to 0 entries.
//	
//	
//	
//	
//	


- (void) setAcceleratorWatching: (NSNumber *) doWatchNumber;
{
	if ([doWatchNumber respondsToSelector:@selector(boolValue)]) {
		NSString * currentPageToken = [[[TitaniumHost sharedHost] currentThread] magicToken];
		
		if([doWatchNumber boolValue]){
			[watchingPages addObject:currentPageToken];
		} else {
			[watchingPages removeObject:currentPageToken];
		}
		
		BOOL shouldWatch = [watchingPages count] != 0;
		id newDelegate = (shouldWatch ? self : nil);
		[[UIAccelerometer sharedAccelerometer] setDelegate:newDelegate];
	}
}

- (void)accelerometer:(UIAccelerometer *)accelerometer didAccelerate:(UIAcceleration *)acceleration;
{
	if ([watchingPages count]==0) return;

	TitaniumHost * theHost = [TitaniumHost sharedHost];
	NSString * message = [NSString stringWithFormat:@"Ti.Accelerometer.onUpdate('update',{type:'update',x:%f,y:%f,z:%f,timestamp:%qu})",
			[acceleration x],[acceleration y],[acceleration z],(long long)([acceleration timestamp] * 1000)];

	TitaniumWebViewController * currentView = (TitaniumWebViewController*)[theHost visibleTitaniumContentViewController];

	for (NSString * currentPageToken in watchingPages){
		if([currentView hasToken:currentPageToken]) [currentView performJavascript:message onPageWithToken:currentPageToken];
	}
	//TODO: turn acceleration on and off with changes in visibility.
}

- (BOOL) startModule;
{

	TitaniumInvocationGenerator * invocGen = [TitaniumInvocationGenerator generatorWithTarget:self];
	[(AccelerometerModule *)invocGen setAcceleratorWatching:nil];
	NSInvocation * setAccelWatchInvoc = [invocGen invocation];

//	[(MobileModule *)invocGen clearWatch:nil];
//	NSInvocation * removeInvoc = [invocGen invocation];

//	TitaniumJSCode * getCurrentPosition = [TitaniumJSCode codeWithString:@"function(succCB,errCB,details){var token=Ti.Geo._NEWTOK(details,true);Ti.Geo._WATCH[token]={success:succCB,fail:errCB};}"];
//	TitaniumJSCode * watchPosition = [TitaniumJSCode codeWithString:@"function(succCB,errCB,details){var token=Ti.Geo._NEWTOK(details,false);Ti.Geo._WATCH[token]={success:succCB,fail:errCB};}"];
	watchingPages = [[NSMutableSet alloc] init];

	NSDictionary * accelModule = [NSDictionary dictionaryWithObjectsAndKeys:
			[TitaniumJSCode codeWithString:@"{update:[]}"],@"_EVT",
			[TitaniumJSCode codeWithString:@"Ti._ADDEVT"],@"_ADDEVT",
			[TitaniumJSCode codeWithString:@"Ti._REMEVT"],@"_REMEVT",
			[TitaniumJSCode codeWithString:@"function(type,callback,bubble){var callUpdate=false;"
					"if(type=='update')callUpdate = (this._EVT.update.length==0);"
					"this._ADDEVT(type,callback,bubble);"
					"if(callUpdate)Ti.Accelerometer._SETACCELWATCH(true);"
					"return callback;}"],@"addEventListener",
			[TitaniumJSCode codeWithString:@"function(type,callback,bubble){"
					"var res=this._REMEVT(type,callback,bubble);"
					"if((type=='update')&&(this._EVT.update.length==0))Ti.Accelerometer._SETACCELWATCH(false);"
					"return res;}"],@"removeEventListener",
			[TitaniumJSCode codeWithString:@"Ti._ONEVT"],@"onUpdate",
			setAccelWatchInvoc, @"_SETACCELWATCH",
			nil];
	[[[TitaniumHost sharedHost] titaniumObject] setObject: accelModule forKey:@"Accelerometer"];
	
	return YES;
}

- (void) dealloc
{
	[watchingPages release];
	[super dealloc];
}


@end

#endif