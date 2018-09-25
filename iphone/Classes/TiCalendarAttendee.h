/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_CALENDAR
#import "CalendarModule.h"
#import "TiProxy.h"

@interface TiCalendarAttendee : TiProxy {
  EKParticipant *participant;
}

- (id)_initWithPageContext:(id<TiEvaluator>)context participant:(EKParticipant *)participant_;

@end

#endif
