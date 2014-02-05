/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifndef TI_HTTP_CLIENT_H
#define TI_HTTP_CLIENT_H

#define PE_DEBUG 1

#ifndef RELEASE_TO_NIL
#define RELEASE_TO_NIL(x) { if (x!=nil) { [x release]; x = nil; } }
#endif


#ifndef DeveloperLog
#if PE_DEBUG
#define DeveloperLog(...) { NSLog(__VA_ARGS__); }
#else
#define DeveloperLog(...) {}
#endif
#endif

#ifndef PEAlert
#define PEAlert
#include <UIKit/UIKit.h>

__attribute__((unused))
static void Alert(NSString* title, NSString* msg, ...) {
    va_list args;
    va_start(args, msg);
    
    NSString* message = [[[NSString alloc] initWithFormat:msg arguments:args] autorelease];
    UIAlertView *alert = [[[UIAlertView alloc] init] autorelease];
    [alert addButtonWithTitle:@"ok!"];
    [alert setTitle:title];
    [alert setMessage:message];
    [alert show];
    
    
}
#endif

#include "TiHTTPRequest.h"
#include "TiHTTPResponse.h"
#include "TiHTTPPostForm.h"
#include "TiHTTPOperation.h"
#include "TiHTTPHelper.h"


#endif
