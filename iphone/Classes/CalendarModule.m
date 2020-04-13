/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_CALENDAR

#import "CalendarModule.h"
#import "TiCalendarCalendar.h"
@import TitaniumKit.TiBase;
@import TitaniumKit.TiUtils;

@implementation CalendarModule

#pragma mark - internal methods

- (EKEventStore *)store
{
  if (store == nil) {
    store = [[EKEventStore alloc] init];
  }
  if (store == NULL) {
    DebugLog(@"[WARN] Could not access EventStore. ");
  } else {
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(eventStoreChanged:) name:EKEventStoreChangedNotification object:nil];
  }
  return store;
}

- (NSArray<EKCalendar *> *)allEventKitCalendars
{
  if (![NSThread isMainThread]) {
    __block id result = nil;
    TiThreadPerformOnMainThread(
        ^{
          result = [[self allEventKitCalendars] retain];
        },
        YES);
    return [result autorelease];
  }
  EKEventStore *ourStore = [self store];
  if (ourStore == NULL) {
    DebugLog(@"Could not instantiate an event of the event store.");
    return nil;
  }
  return [ourStore calendarsForEntityType:EKEntityTypeEvent];
}

- (NSString *)apiName
{
  return @"Ti.Calendar";
}

- (void)_configure
{
  [super _configure];
  store = NULL;
}

- (void)eventStoreChanged:(NSNotification *)notification
{
  if ([self _hasListeners:@"change"]) {
    [self fireEvent:@"change" withDict:nil];
  }
}

#pragma mark - Internal Memory Management

- (void)dealloc
{
  RELEASE_TO_NIL(store);
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  [super dealloc];
}

#pragma mark - Public API's

- (NSArray<TiCalendarCalendar *> *)allCalendars
{
  if (![NSThread isMainThread]) {
    __block id result = nil;
    TiThreadPerformOnMainThread(
        ^{
          result = [[self allCalendars] retain];
        },
        YES);
    return [result autorelease];
  }

  NSArray *calendars_ = [self allEventKitCalendars];

  NSMutableArray<TiCalendarCalendar *> *calendars = [NSMutableArray arrayWithCapacity:[calendars_ count]];
  for (EKCalendar *calendar_ in calendars_) {
    TiCalendarCalendar *calendar = [[[TiCalendarCalendar alloc] initWithCalendar:calendar_ module:self] autorelease];
    [calendars addObject:calendar];
  }

  return calendars;
}
GETTER_IMPL(NSArray<TiCalendarCalendar *> *, allCalendars, AllCalendars);

- (NSArray<TiCalendarCalendar *> *)allEditableCalendars
{
  if (![NSThread isMainThread]) {
    __block id result = nil;
    TiThreadPerformOnMainThread(
        ^{
          result = [[self allEditableCalendars] retain];
        },
        YES);
    return [result autorelease];
  }

  NSArray *calendars_ = [self allEventKitCalendars];

  NSMutableArray<TiCalendarCalendar *> *editableCalendars = [NSMutableArray array];
  for (EKCalendar *calendar_ in calendars_) {
    if ([calendar_ allowsContentModifications]) {
      TiCalendarCalendar *calendar = [[TiCalendarCalendar alloc] initWithCalendar:calendar_ module:self];
      [editableCalendars addObject:calendar];
      RELEASE_TO_NIL(calendar);
    }
  }
  return editableCalendars;
}
GETTER_IMPL(NSArray<TiCalendarCalendar *> *, allEditableCalendars, AllEditableCalendars);

- (TiCalendarCalendar *)getCalendarById:(NSString *)calendarId
{
  if (![NSThread isMainThread]) {
    __block id result = nil;
    TiThreadPerformOnMainThread(
        ^{
          result = [[self getCalendarById:calendarId] retain];
        },
        YES);
    return [result autorelease];
  }

  EKEventStore *ourStore = [self store];
  if (ourStore == NULL) {
    DebugLog(@"Could not instantiate an event of the event store.");
    return nil;
  }
  EKCalendar *calendar_ = NULL;

  //Instead of getting calendar by identifier, have to get all and check for match
  //not optimal but best way to fix non existing shared calendar error
  NSArray *allCalendars = [ourStore calendarsForEntityType:EKEntityTypeEvent];
  for (EKCalendar *cal in allCalendars) {
    if ([cal.calendarIdentifier isEqualToString:calendarId]) {
      calendar_ = cal;
      break;
    }
  }

  if (calendar_ == NULL) {
    return NULL;
  }
  TiCalendarCalendar *calendar = [[[TiCalendarCalendar alloc] initWithCalendar:calendar_ module:self] autorelease];
  return calendar;
}

- (TiCalendarCalendar *)defaultCalendar
{
  if (![NSThread isMainThread]) {
    __block id result = nil;
    TiThreadPerformOnMainThread(
        ^{
          result = [[self defaultCalendar] retain];
        },
        YES);
    return [result autorelease];
  }

  EKEventStore *ourStore = [self store];
  if (ourStore == NULL) {
    DebugLog(@"Could not instantiate an event of the event store.");
    return nil;
  }
  EKCalendar *calendar_ = [ourStore defaultCalendarForNewEvents];
  if (calendar_ == NULL) {
    return nil;
  }
  TiCalendarCalendar *calendar = [[[TiCalendarCalendar alloc] initWithCalendar:calendar_ module:self] autorelease];
  return calendar;
}
GETTER_IMPL(TiCalendarCalendar *, defaultCalendar, DefaultCalendar);

- (void)requestAuthorization:(JSValue *)callback forEntityType:(EKEntityType)entityType
{
  NSString *errorStr = nil;
  int code = 0;
  BOOL doPrompt = NO;

  long int permissions = [EKEventStore authorizationStatusForEntityType:entityType];
  switch (permissions) {
  case EKAuthorizationStatusNotDetermined:
    doPrompt = YES;
    break;
  case EKAuthorizationStatusAuthorized:
    break;
  case EKAuthorizationStatusDenied:
    code = EKAuthorizationStatusDenied;
    errorStr = @"The user has denied access to events in Calendar.";
    break;
  case EKAuthorizationStatusRestricted:
    code = EKAuthorizationStatusRestricted;
    errorStr = @"The user is unable to allow access to events in Calendar.";
  default:
    break;
  }

  if (!doPrompt) {
    NSDictionary *propertiesDict = [TiUtils dictionaryWithCode:code message:errorStr];
    [callback callWithArguments:@[ propertiesDict ]];
    return;
  }

  TiThreadPerformOnMainThread(
      ^() {
        EKEventStore *ourstore = [self store];
        [ourstore requestAccessToEntityType:EKEntityTypeEvent
                                 completion:^(BOOL granted, NSError *error) {
                                   NSDictionary *propertiesDict;
                                   if (error == nil) {
                                     NSString *errorMsg = granted ? nil : @"The user has denied access to events in Calendar.";
                                     propertiesDict = [TiUtils dictionaryWithCode:(granted ? 0 : 1) message:errorMsg];
                                   } else {
                                     propertiesDict = [TiUtils dictionaryWithCode:[error code] message:[TiUtils messageFromError:error]];
                                   }
                                   TiThreadPerformOnMainThread(
                                       ^{
                                         [callback callWithArguments:@[ propertiesDict ]];
                                       },
                                       [NSThread isMainThread]);
                                 }];
      },
      NO);
}

#pragma mark - Public API

- (BOOL)hasCalendarPermissions
{
  NSString *calendarPermission = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSCalendarsUsageDescription"];

  if (!calendarPermission) {
    NSLog(@"[ERROR] iOS 10 and later requires the key \"NSCalendarsUsageDescription\" inside the plist in your tiapp.xml when accessing the native calendar. Please add the key and re-run the application.");
  }

  return [self calendarAuthorization] == EKAuthorizationStatusAuthorized;
}

- (void)requestCalendarPermissions:(JSValue *)callback
{
  [self requestAuthorization:callback forEntityType:EKEntityTypeEvent];
}

- (EKAuthorizationStatus)calendarAuthorization
{
  return [EKEventStore authorizationStatusForEntityType:EKEntityTypeEvent];
}
GETTER_IMPL(EKAuthorizationStatus, calendarAuthorization, CalendarAuthorization);

#pragma mark - Properties

#define MAKE_PROP(TYPE, NAME, VALUE) \
  -(TYPE)NAME                        \
  {                                  \
    return VALUE;                    \
  }

MAKE_PROP(EKEventStatus, STATUS_NONE, EKEventStatusNone);
MAKE_PROP(EKEventStatus, STATUS_CONFIRMED, EKEventStatusConfirmed);
MAKE_PROP(EKEventStatus, STATUS_TENTATIVE, EKEventStatusTentative);
MAKE_PROP(EKEventStatus, STATUS_CANCELED, EKEventStatusCanceled);

MAKE_PROP(EKEventAvailability, AVAILABILITY_NOTSUPPORTED, EKEventAvailabilityNotSupported);
MAKE_PROP(EKEventAvailability, AVAILABILITY_BUSY, EKEventAvailabilityBusy);
MAKE_PROP(EKEventAvailability, AVAILABILITY_FREE, EKEventAvailabilityFree);
MAKE_PROP(EKEventAvailability, AVAILABILITY_TENTATIVE, EKEventAvailabilityTentative);
MAKE_PROP(EKEventAvailability, AVAILABILITY_UNAVAILABLE, EKEventAvailabilityUnavailable);

MAKE_PROP(EKSpan, SPAN_THISEVENT, EKSpanThisEvent);
MAKE_PROP(EKSpan, SPAN_FUTUREEVENTS, EKSpanFutureEvents);

MAKE_PROP(EKRecurrenceFrequency, RECURRENCEFREQUENCY_DAILY, EKRecurrenceFrequencyDaily);
MAKE_PROP(EKRecurrenceFrequency, RECURRENCEFREQUENCY_WEEKLY, EKRecurrenceFrequencyWeekly);
MAKE_PROP(EKRecurrenceFrequency, RECURRENCEFREQUENCY_MONTHLY, EKRecurrenceFrequencyMonthly);
MAKE_PROP(EKRecurrenceFrequency, RECURRENCEFREQUENCY_YEARLY, EKRecurrenceFrequencyYearly);

MAKE_PROP(EKAuthorizationStatus, AUTHORIZATION_UNKNOWN, EKAuthorizationStatusNotDetermined);
MAKE_PROP(EKAuthorizationStatus, AUTHORIZATION_RESTRICTED, EKAuthorizationStatusRestricted);
MAKE_PROP(EKAuthorizationStatus, AUTHORIZATION_DENIED, EKAuthorizationStatusDenied);
MAKE_PROP(EKAuthorizationStatus, AUTHORIZATION_AUTHORIZED, EKAuthorizationStatusAuthorized);

MAKE_PROP(EKParticipantStatus, ATTENDEE_STATUS_UNKNOWN, EKParticipantStatusUnknown);
MAKE_PROP(EKParticipantStatus, ATTENDEE_STATUS_PENDING, EKParticipantStatusPending);
MAKE_PROP(EKParticipantStatus, ATTENDEE_STATUS_ACCEPTED, EKParticipantStatusAccepted);
MAKE_PROP(EKParticipantStatus, ATTENDEE_STATUS_DECLINED, EKParticipantStatusDeclined);
MAKE_PROP(EKParticipantStatus, ATTENDEE_STATUS_TENTATIVE, EKParticipantStatusTentative);
MAKE_PROP(EKParticipantStatus, ATTENDEE_STATUS_DELEGATED, EKParticipantStatusDelegated);
MAKE_PROP(EKParticipantStatus, ATTENDEE_STATUS_COMPLETED, EKParticipantStatusCompleted);
MAKE_PROP(EKParticipantStatus, ATTENDEE_STATUS_IN_PROCESS, EKParticipantStatusInProcess);

MAKE_PROP(EKParticipantRole, ATTENDEE_ROLE_UNKNOWN, EKParticipantRoleUnknown);
MAKE_PROP(EKParticipantRole, ATTENDEE_ROLE_REQUIRED, EKParticipantRoleRequired);
MAKE_PROP(EKParticipantRole, ATTENDEE_ROLE_OPTIONAL, EKParticipantRoleOptional);
MAKE_PROP(EKParticipantRole, ATTENDEE_ROLE_CHAIR, EKParticipantRoleChair);
MAKE_PROP(EKParticipantRole, ATTENDEE_ROLE_NON_PARTICIPANT, EKParticipantRoleNonParticipant);

MAKE_PROP(EKParticipantType, ATTENDEE_TYPE_UNKNOWN, EKParticipantTypeUnknown);
MAKE_PROP(EKParticipantType, ATTENDEE_TYPE_PERSON, EKParticipantTypePerson);
MAKE_PROP(EKParticipantType, ATTENDEE_TYPE_ROOM, EKParticipantTypeRoom);
MAKE_PROP(EKParticipantType, ATTENDEE_TYPE_RESOURCE, EKParticipantTypeResource);
MAKE_PROP(EKParticipantType, ATTENDEE_TYPE_GROUP, EKParticipantTypeGroup);

MAKE_PROP(EKSourceType, SOURCE_TYPE_LOCAL, EKSourceTypeLocal);
MAKE_PROP(EKSourceType, SOURCE_TYPE_EXCHANGE, EKSourceTypeExchange);
MAKE_PROP(EKSourceType, SOURCE_TYPE_CALDAV, EKSourceTypeCalDAV);
MAKE_PROP(EKSourceType, SOURCE_TYPE_MOBILEME, EKSourceTypeMobileMe);
MAKE_PROP(EKSourceType, SOURCE_TYPE_SUBSCRIBED, EKSourceTypeSubscribed);
MAKE_PROP(EKSourceType, SOURCE_TYPE_BIRTHDAYS, EKSourceTypeBirthdays);
@end

#endif
