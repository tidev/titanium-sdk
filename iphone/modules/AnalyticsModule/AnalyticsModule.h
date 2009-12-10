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
	
	BOOL endingModule;
	BOOL disabled;
}

@property(readwrite,retain,nonatomic)	NSString * sessionID;

- (NSData*) generateEventObject: (NSString*)evttype evtname:(NSString*) evtname data:(id)data;
- (void)enqueuePlatformEvent:(NSString*)evttype evtname:(NSString*)evtname data:(NSDictionary*)data;

/**
 * @tiapi(method=True,name=Analytics.addEvent,since=0.4) send an analytics event associated with the application
 * @tiarg(for=Analytics.addEvent,type=string,name=evttype) event type
 * @tiarg(for=Analytics.addEvent,type=string,name=evtname) event name
 * @tiarg(for=Analytics.addEvent,type=string,name=data,optional=True) event data
 */
- (void) addEvent: (NSString *) eventtype evtname: (NSString*) eventname value: (id) value;
- (void) keepEvents: (NSMutableArray *)newEvents;
- (void) setConnectionState: (NetworkModuleConnectionState) newState;
- (void)sendEvents;


@end

