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

/*	TiBindingRunLoop's Enqueue will add a callback that will be run once
 *	during the run loop's idle. This is for things like events, callbacks,
 *	and other invocations from native into Javascript.
 */
void TiBindingRunLoopEnqueue(TiBindingRunLoop runLoop, TiBindingCallback callback, void * payload);

/*	TiBindingRunLoop's CallOnStart will add a callback that will be run
 *	every time a run loop is started, before the file is executed. Because
 *	the file the run loop uses is not parsed or run yet, there won't be a
 *	path, but this lets you enqeue methods to run immediately after the
 *	parsing, or set up changes to the runtime environment. The Titanium
 *	and other globals WILL be set during the callback's execution.
 *
 *	These callbacks are invoked before:
 *		app.js is started
 *		A background service is started
 *		A window with an url property is being opened
 */
void TiBindingRunLoopCallOnStart(TiBindingCallback callback, void * payload);
