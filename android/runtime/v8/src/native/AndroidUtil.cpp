/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <time.h>
#include <unistd.h>

#include "AndroidUtil.h"

namespace titanium {

long AndroidUtil::getCurrentMillis()
{
	struct timespec now;
	clock_gettime(CLOCK_MONOTONIC, &now);
	return (long) now.tv_sec * 1000L + (now.tv_nsec / 1000000);
}

}
