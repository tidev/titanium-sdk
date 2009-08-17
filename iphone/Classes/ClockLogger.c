/*
 *  ClockLogger.c
 *  Titanium
 *
 *  Created by Blain Hamon on 8/14/09.
 *  Copyright 2009 __MyCompanyName__. All rights reserved.
 *
 */

#include "ClockLogger.h"

#ifdef USE_CLOCKLOG
char CLOCKLOG_ENABLED = 1;
#else
char CLOCKLOG_ENABLED = 0;
#endif
double firstTimestamp = 0.0;
