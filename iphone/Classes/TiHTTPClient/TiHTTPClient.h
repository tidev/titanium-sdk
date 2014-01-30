/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Special thanks to Pedro Enrique for implementing this.
 */

#ifndef TI_HTTP_CLIENT_H
#define TI_HTTP_CLIENT_H

#define PE_DEBUG 1

#ifdef TI_BASE_H
#include "TiBase.h"
#else
#define RELEASE_TO_NIL(x) { if (x!=nil) { [x release]; x = nil; } }
#endif


#if PE_DEBUG
#define PELog(...) NSLog(__VA_ARGS__);
#else
#define PELog(...) {};
#endif


#include "TiHTTPRequest.h"
#include "TiHTTPResponse.h"
#include "TiHTTPPostForm.h"
#include "TiHTTPOperation.h"
#include "TiHTTPHelper.h"


#endif
