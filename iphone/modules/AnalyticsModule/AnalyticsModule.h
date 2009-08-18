/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <Foundation/Foundation.h>
#import "TitaniumModule.h"
#import "NetworkModule.h"

@interface AnalyticsModule : NSObject<TitaniumModule> {
	NetworkModuleConnectionState connectionState;
	NSDate * packetDueDate;
	BOOL hasSentStart;

	int callsMade;
	NSString * sessionID;
	int sequence;
	NSMutableArray * events;
	NSTimer * timer;
	NSLock * mutex;
}

@property(readwrite,retain,nonatomic)	NSString * sessionID;

- (void) sendAsyncData: (NSData*)data  timeout:(NSTimeInterval)timeout;
- (NSData*) generateEventObject: (NSString*)name data:(id)data;
- (void)enqueuePlatformEvent:(NSString*)name data:(NSDictionary*)data;

/**
 * @tiapi(method=True,name=Analytics.addEvent,since=0.4) send an analytics event associated with the application
 * @tiarg(for=Analytics.addEvent,type=string,name=event) event name
 * @tiarg(for=Analytics.addEvent,type=string,name=data,optional=True) event data
 * @tidepends(for=Analytics.addEvent,uses=Network.createHTTPClient)
 */
- (void) addEvent: (NSString *) name value: (id) value;
- (void) keepEvents: (NSMutableArray *)newEvents;
- (void) setConnectionState: (NetworkModuleConnectionState) newState;
- (void)sendEvents;


@end

