/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#if TARGET_OS_IPHONE

#import "KrollContext.h"

typedef KrollContext * TiBindingRunLoop;

#else

typedef void * TiBindingRunLoop;

#endif

typedef void (*TiBindingCallback)(TiBindingRunLoop runLoop, void * payload);

void TiBindingRunLoopEnqueue(TiBindingRunLoop runLoop, TiBindingCallback callback, void * payload);

