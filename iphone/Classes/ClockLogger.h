/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include <CoreFoundation/CoreFoundation.h>
#include <string.h>

#ifdef USE_CLOCKLOG
extern double firstTimestamp;
#define CLOCKSTAMP(foo, ...)	\
		double thisTimeStamp = CFAbsoluteTimeGetCurrent();	\
		if(firstTimestamp==0.0)firstTimestamp=thisTimeStamp;	\
		NSLog(@"CLOCKLOG: %f seconds: " foo, thisTimeStamp-firstTimestamp , ##__VA_ARGS__);	
#else
#define CLOCKSTAMP(foo, ...)
#endif