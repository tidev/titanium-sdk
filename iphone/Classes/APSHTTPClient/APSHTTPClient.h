/**
 * Appcelerator APSHTTPClient Library
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifndef RELEASE_TO_NIL
#define RELEASE_TO_NIL(x) { if (x!=nil) { [x release]; x = nil; } }
#endif

#ifndef DebugLog
#if defined(DEBUG) || defined(DEVELOPER)
#define DebugLog(...) { NSLog(__VA_ARGS__); }
#else
#define DebugLog(...) {}
#endif
#endif

#import "APSHTTPRequest.h"
#import "APSHTTPResponse.h"
#import "APSHTTPPostForm.h"
#import "APSHTTPOperation.h"
#import "APSHTTPHelper.h"
