/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include "Logging.h"

// we define this in either case so that we don't have to worry about
// a lipo error because there are no symbols in the object file - this is OK
double firstTimestamp = 0.0;
