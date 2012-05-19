/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiModule.h"
#import "PlausibleDatabase.h"

@interface AnalyticsModule : TiModule {
@private
	PLSqliteDatabase* database;
	NSTimer *retryTimer;
	NSTimer *flushTimer;
	NSURL *url;
	NSRecursiveLock *lock;
}

@end
