/*
 *  ClockLogger.h
 *  Titanium
 *
 *  Created by Blain Hamon on 8/14/09.
 *  Copyright 2009 __MyCompanyName__. All rights reserved.
 *
 */

#include <CoreFoundation/CoreFoundation.h>
#include <string.h>

extern char CLOCKLOG_ENABLED;
extern double firstTimestamp;

#define CLOCKSTAMP(foo, ...)	\
	if(CLOCKLOG_ENABLED){	\
		double thisTimeStamp = CFAbsoluteTimeGetCurrent();	\
		if(firstTimestamp==0.0)firstTimestamp=thisTimeStamp;	\
		NSLog(@"CLOCKLOG: %f seconds: " foo, thisTimeStamp-firstTimestamp , ##__VA_ARGS__);	\
	}
