/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

typedef struct TiBindingEventOpaque *TiBindingEvent;

#if TARGET_OS_IPHONE

#import "TiProxy.h"

TiBindingEvent TiBindingEventCreateWithNSObjects(TiProxy *target, TiProxy *source, NSString *type, NSDictionary *payload);

#endif

void TiBindingEventSetBubbles(TiBindingEvent event, bool bubbles);

#pragma mark Error reporting
/*	As of 3.1.0, events can have the common error reporting done at a low level for consistency and speed.
 *	If an event can report errors, it will have the following properties:
 *
 *	success: Boolean. Is true if and only if code is 0.
 *	code: Integer. 0 for no error, system-specific code otherwise. -1 is the default for failure.
 *	error: Optional string.
 *
 *	Error reporting happens if and only if the error code is set. The error string
 *	set and clear does not check the error code, nor does setting the error code
 *	to success clear the message string.
 *
 *	To undo setting the error code, and thus not report, use TiBindingEventClearError
 */

enum {
  kTiErrorCodeSuccess = 0,
  kTiErrorUnknownFailure = -1,
};
void TiBindingEventSetErrorCode(TiBindingEvent event, NSInteger code);
#if TARGET_OS_IPHONE
void TiBindingEventSetErrorMessageWithNSString(TiBindingEvent event, NSString *message);
#endif
void TiBindingEventClearError(TiBindingEvent event);

#pragma mark Processing and disposal

void TiBindingEventFire(TiBindingEvent event);

void TiBindingEventDispose(TiBindingEvent event);
