/**
 * Appcelerator Titanium Mobile Profiler
 * Copyright (c) 2013-2014 by Appcelerator, Inc. All Rights Reserved.
 * Proprietary and Confidential - This source code is not for redistribution
 */
#import <JavaScriptCore/JavaScriptCore.h>

#ifdef __cplusplus
#define EXTERN_FUNC extern "C"
#else
#define EXTERN_FUNC extern
#endif

EXTERN_FUNC void  TiProfilerStart(NSString*, NSInteger);
EXTERN_FUNC void  TiProfilerStop();
EXTERN_FUNC void  TiProfilerDiscoveryStart(NSString*, NSArray*, void(^)(NSString *, NSInteger));
EXTERN_FUNC void  TiProfilerEnable(JSObjectRef, JSGlobalContextRef);
EXTERN_FUNC void  TiProfilerWillExecute(JSContextRef, const char*);
EXTERN_FUNC void  TiProfilerDidExecute(JSContextRef, const char*);
