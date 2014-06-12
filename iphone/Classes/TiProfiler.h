/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include "TiBase.h"

#ifdef __cplusplus
#define EXTERN_FUNC extern "C"
#else
#define EXTERN_FUNC extern
#endif

EXTERN_FUNC void  TiProfilerStart(NSString*, NSInteger);
EXTERN_FUNC void  TiProfilerStop();
EXTERN_FUNC void  TiProfilerDiscoveryStart(NSString*, NSArray*, void(^)(NSString *, NSInteger));
EXTERN_FUNC void  TiProfilerEnable(TiObjectRef);
EXTERN_FUNC void  TiProfilerWillExecute(TiContextRef, const char*);
EXTERN_FUNC void  TiProfilerDidExecute(TiContextRef, const char*);
