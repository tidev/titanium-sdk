/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"
#import "AnalyticsModule.h"
#import "TiHost.h"
#import "TiApp.h"
#import "ASIHTTPRequest.h"
#import "SBJSON.h"
#import <sys/utsname.h>
#import "NSData+Additions.h"
#import "Reachability.h"

//TODO:
//
// 1. internal feature events
// 2. KS instrumentation
// 3. device reg for push
// 

extern BOOL const TI_APPLICATION_ANALYTICS;
extern NSString * const TI_APPLICATION_NAME;
extern NSString * const TI_APPLICATION_DEPLOYTYPE;
extern NSString * const TI_APPLICATION_ID;
extern NSString * const TI_APPLICATION_VERSION;
extern NSString * const TI_APPLICATION_GUID;

#define TI_DB_WARN_ON_ATTEMPT_COUNT 5
#define TI_DB_RETRY_INTERVAL_IN_SEC 15
#define TI_DB_FLUSH_INTERVAL_IN_SEC 5

// version of our analytics DB
NSString * const TI_DB_VERSION = @"1";

@interface AnalyticsModule ()

-(void)enqueueBlock:(void (^)(void))block;

@end


@implementation AnalyticsModule

-(id)init
{
	if ((self = [super init]))
	{
		lock = [[NSRecursiveLock alloc] init];
		eventQueue = [[NSOperationQueue alloc] init];
	}
	return self;
}

-(void)dealloc
{
	if (database!=nil)
	{
		@try 
		{
			[database close];
		}
		@catch (NSException * e) 
		{
			NSLog(@"[ERROR] Analytics: database error on shutdown: %@",e);
		}
	}
	[eventQueue release];
	RELEASE_TO_NIL(database);
	RELEASE_TO_NIL(retryTimer);
	RELEASE_TO_NIL(flushTimer);
	RELEASE_TO_NIL(url);
	RELEASE_TO_NIL(lock);
	[super dealloc];
}

-(void)enqueueBlock:(void (^)(void))block
{
	[eventQueue addOperationWithBlock:block];
}


-(id)platform
{
	return [[[self pageContext] host] moduleNamed:@"Platform" context:[self pageContext]];
}

-(id)network 
{
	return [[[self pageContext] host] moduleNamed:@"Network" context:[self pageContext]];
}

#pragma mark Work

-(void)backgroundFlushEventQueue
{
	[self enqueueBlock:^{[self flushEventQueueWrapper];}];
}

-(void)requeueEventsOnTimer
{
	[lock lock];
	NSError *error = nil;
	
	[database beginTransaction];
	
	// get the number of attempts
	PLSqliteResultSet *rs = (PLSqliteResultSet*)[database executeQuery:@"select attempts from last_attempt"];
	BOOL found = [rs next];
	int count = found ? [rs intForColumn:@"attempts"] : 0;
	[rs close];
	
	if (count == TI_DB_WARN_ON_ATTEMPT_COUNT)
	{
		DebugLog(@"[WARN] Analytics: %d transmission attempts failed.",count);
	}
	
	NSString *sql = count == 0 ? @"insert into last_attempt VALUES (?,?)" : @"update last_attempt set date = ?, attempts = ?";
	PLSqlitePreparedStatement * statement = (PLSqlitePreparedStatement *) [database prepareStatement:sql error:&error];
	[statement bindParameters:[NSArray arrayWithObjects:[NSDate date],NUMINT(count+1),nil]];
	[statement executeUpdate];
	[database commitTransaction];
	
	[statement close];
	
	if (retryTimer==nil)
	{
		// start our re-attempt timer
		DeveloperLog(@"[DEBUG] Attempted to send analytics event. No network; will try again in %d seconds.",TI_DB_RETRY_INTERVAL_IN_SEC);
		retryTimer = [[NSTimer timerWithTimeInterval:TI_DB_RETRY_INTERVAL_IN_SEC target:self selector:@selector(backgroundFlushEventQueue) userInfo:nil repeats:YES] retain];
		[[NSRunLoop mainRunLoop] addTimer:retryTimer forMode:NSDefaultRunLoopMode];
	}
	
	if (flushTimer!=nil)
	{
		[flushTimer invalidate];
		RELEASE_TO_NIL(flushTimer);
	}
	[lock unlock];
}

-(void)flushEventQueue
{
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	if (![lock tryLock]) {
		// We're currently in the middle of flushing the event queue, but didn't block on actually ADDING an event -
		// this means that we don't need to run a second flush.
		[pool release];
		return;
	}
	
	// Can't use network module since pageContext/host may have shut down when sending 'final' events,
	// giving us bad reachability info.
	NetworkStatus status = [[Reachability reachabilityForInternetConnection] currentReachabilityStatus];
	
	// when we can't reach the network, we need to log our attempt, 
	// set a retry timer and just bail...
	if (status != ReachableViaWiFi && status != ReachableViaWWAN)
	{
		[self requeueEventsOnTimer];
		[lock unlock];
		[pool release];
		pool = nil;
		return;
	}

	// we can cancel our timers
	if (retryTimer!=nil)
	{
		[retryTimer invalidate];
		RELEASE_TO_NIL(retryTimer);
	}
	if (flushTimer!=nil)
	{
		[flushTimer invalidate];
		RELEASE_TO_NIL(flushTimer);
	}
	
	// We have a TOTAL of 5s to complete on shutdown, so take up as little of it as possible with analytics -
	// analytics should be on the main thread only during shutdown (and if it is on the main thread otherwise we
	// want it to not block)
	NSTimeInterval timeout = [NSThread isMainThread] ? 2 : 5;
	
	//... And of course, if we're on a background timer, take up even less.  We want this to complete
	// before the expiration date, one way or another.
	// TODO: Documentation is vague about this - can we ever be shutting down AND in the background state,
	// at the same time?
	if ([[UIApplication sharedApplication] applicationState] == UIApplicationStateBackground) {
		timeout = [[UIApplication sharedApplication] backgroundTimeRemaining] * 0.75; // Give us a good chunk of time to complete
	}
	[database beginTransaction];
	
	NSMutableArray *data = [NSMutableArray array];
	
	SBJSON *json = [[[SBJSON alloc] init] autorelease];
	
	PLSqliteResultSet *rs = (PLSqliteResultSet*)[database executeQuery:@"SELECT data FROM pending_events"];
	while ([rs next])
	{
		NSString *event = [rs stringForColumn:@"data"];
		NSError* jsonError = nil;
		id frag = [json fragmentWithString:event error:&jsonError];
		if (jsonError) {
			NSLog(@"[ERROR] Problem sending analytics: %@", [jsonError localizedDescription]);
			NSLog(@"[ERROR] Dropped event was: %@", event);
			continue;
		}
		[data addObject:frag];
	}
	[rs close];
	
	if (url == nil)
	{
		//https://api.appcelerator.net/p/v2/mobile-track
		NSString * kTiAnalyticsUrl = stringWithHexString(@"68747470733a2f2f6170692e61707063656c657261746f722e6e65742f702f76322f6d6f62696c652d747261636b");
		url = [[NSURL URLWithString:kTiAnalyticsUrl] retain];
	}
	
	ASIHTTPRequest* request = [ASIHTTPRequest requestWithURL:url];
	[request setRequestMethod:@"POST"];
	[request addRequestHeader:@"Content-Type" value:@"text/json"];
	[request addRequestHeader:@"User-Agent" value:[[TiApp app] userAgent]];
	//TODO: need to update backend to accept compressed bodies. When done, use [request setShouldCompressRequestBody:YES]
	[request setTimeOutSeconds:timeout];
	[request setShouldPresentAuthenticationDialog:NO];
	[request setUseSessionPersistence:NO];
	[request setUseCookiePersistence:YES];
	[request setShouldRedirect:YES];
	NSString * stringifiedData = [SBJSON stringify:data];
	[request appendPostData:[stringifiedData dataUsingEncoding:NSUTF8StringEncoding]];
	[request setDelegate:self];
	
	@try 
	{
		// run synchronous ... we are either in a sync call or
		// we're on a background timer thread
		[request startSynchronous];
		
		NSError* error = [request error];
		if (error != nil) {
			NSLog(@"[ERROR] Analytics error sending request: %@", [error localizedDescription]);
			[database rollbackTransaction];
			[self requeueEventsOnTimer];
			[lock unlock];
			[pool release];
			pool = nil;
			return;
		}
		
		NSData *data = [request responseData];
		if (data!=nil && [data length]>0) 
		{
			NSString * result = [[[NSString alloc] initWithBytes:[data bytes] length:[data length] encoding:[request responseEncoding]] autorelease];
		
			if (result!=nil)
			{
				VerboseLog(@"[DEBUG] analytics response %@",result);
				VerboseLog(@"[DEBUG] We tried to send to %@ the data: %@ ",url,stringifiedData);
			}
		}
		
		// if we get here, it succeeded and we can clean up records in DB
		[database executeUpdate:@"delete from pending_events"];
		[database executeUpdate:@"delete from last_attempt"];
		
		// only commit if we don't get an error
		[database commitTransaction];
	}
	@catch (NSException * e) 
	{
		NSLog(@"[ERROR] Error sending analytics: %@",e);
		[database rollbackTransaction];
	}
	[lock unlock];
	[pool release];
	pool = nil;
}

-(void)flushEventQueueWrapper
{
	NSAutoreleasePool* pool = [[NSAutoreleasePool alloc] init];
	__block UIBackgroundTaskIdentifier backgroundId = UIBackgroundTaskInvalid;
	
	// If we're calling the method outside iOS 4 we have bigger problems, so don't even perform that check here.
	if ([[UIApplication sharedApplication] applicationState] == UIApplicationStateBackground) 
	{
		backgroundId = [[UIApplication sharedApplication] beginBackgroundTaskWithExpirationHandler:^{
			[[UIApplication sharedApplication] endBackgroundTask:backgroundId];
			backgroundId = UIBackgroundTaskInvalid;
		}];
	}
	
	[self flushEventQueue];
	
	if (backgroundId != UIBackgroundTaskInvalid) {
		[[UIApplication sharedApplication] endBackgroundTask:backgroundId];
	}
	[pool release];
}

-(void)startFlushTimer
{
	// TODO: Race condition central
	if (flushTimer==nil)
	{
		flushTimer = [[NSTimer timerWithTimeInterval:TI_DB_FLUSH_INTERVAL_IN_SEC target:self selector:@selector(backgroundFlushEventQueue) userInfo:nil repeats:NO] retain];
		[[NSRunLoop mainRunLoop] addTimer:flushTimer forMode:NSDefaultRunLoopMode];
	}
}

-(void)queueEvent:(NSString*)type name:(NSString*)name data:(NSDictionary*)data immediate:(BOOL)immediate
{
	static int sequence = 0;
	
	NSMutableDictionary *dict = [NSMutableDictionary dictionary];
	
	[dict setObject:@"2" forKey:@"ver"];
	[dict setObject:[TiUtils UTCDate] forKey:@"ts"];
	[dict setObject:[TiUtils createUUID] forKey:@"id"];
	[dict setObject:NUMINT(sequence++) forKey:@"seq"];
	[dict setObject:[TiUtils appIdentifier] forKey:@"mid"];

	[dict setObject:TI_APPLICATION_GUID forKey:@"aguid"];
	[dict setObject:TI_APPLICATION_DEPLOYTYPE forKey:@"deploytype"];
	[dict setObject:name forKey:@"event"];
	[dict setObject:type forKey:@"type"];
	[dict setObject:[[TiApp app] sessionId] forKey:@"sid"];
	if (data==nil)
	{
		[dict setObject:[NSNull null] forKey:@"data"];
	}
	else 
	{
		[dict setObject:data forKey:@"data"];
	}
	NSString *remoteDeviceUUID = [[TiApp app] remoteDeviceUUID];
	if (remoteDeviceUUID==nil)
	{
		[dict setObject:[NSNull null] forKey:@"rdu"];
	}
	else 
	{
		[dict setObject:remoteDeviceUUID forKey:@"rdu"];
	}

	id value = [SBJSON stringify:dict];
	
	NSString *sql = [NSString stringWithFormat:@"INSERT INTO pending_events VALUES (?)"];
	NSError *error = nil;
    // Don't lock until we need to
    [lock lock];
    if (database==nil)
	{
		// doh, no database???
		[lock unlock];
		return;
	}
	PLSqlitePreparedStatement * statement = (PLSqlitePreparedStatement *) [database prepareStatement:sql error:&error];
	[statement bindParameters:[NSArray arrayWithObjects:value,nil]];
    
    
	[database beginTransaction];
	[statement executeUpdate];
	[database commitTransaction];
	[lock unlock];
	
	[statement close];

	
	if (immediate)
	{	
		// if immediate we send right now
		[self flushEventQueueWrapper];
	}
	else
	{
		// otherwise, we start our flush timer to send later
		[self startFlushTimer];
	}
}

-(NSString*)checkForEnrollment:(BOOL*)enrolled
{
	NSString * supportFolderPath = [NSSearchPathForDirectoriesInDomains(NSApplicationSupportDirectory, NSUserDomainMask, YES) objectAtIndex:0];
	NSString * folderPath = [supportFolderPath stringByAppendingPathComponent:@"analytics"];
	NSFileManager * theFM = [NSFileManager defaultManager];
	BOOL isDirectory;
	BOOL exists = [theFM fileExistsAtPath:folderPath isDirectory:&isDirectory];
	if (!exists) [theFM createDirectoryAtPath:folderPath withIntermediateDirectories:YES attributes:nil error:nil];
	*enrolled = exists;
	return folderPath;
}

-(void)loadDB:(NSString*)path create:(BOOL)create
{
	[lock lock];
    if ([database goodConnection]) {
		[lock unlock];
		return;
    }
	// make sure SQLite can run from multiple threads
	sqlite3_enable_shared_cache(TRUE);

	NSString *filepath = [NSString stringWithFormat:@"%@/analytics.db",path];
	
    RELEASE_TO_NIL(database);
	database = [[PLSqliteDatabase alloc] initWithPath:filepath];
	if (![database open])
	{
		NSLog(@"[ERROR] Couldn't open analytics database");
		RELEASE_TO_NIL(database);
		[lock unlock];
		return;
	}
	
	[database beginTransaction];
	[database executeUpdate:@"CREATE TABLE IF NOT EXISTS version (version INTEGER)"];

	NSString *currentVersion = nil;
	PLSqliteResultSet *rs = (PLSqliteResultSet*)[database executeQuery:@"SELECT version from version"];
	[rs next];
	currentVersion = [TiUtils stringValue:[rs objectForColumn:@"version"]];
	[rs close];
	
	BOOL migrate = NO;
	
	if (currentVersion==nil||[currentVersion isKindOfClass:[NSNull class]])
	{
		migrate = YES;
		[database executeUpdate:[NSString stringWithFormat:@"INSERT INTO version VALUES('%@')",TI_DB_VERSION]];
	}
	else if (![currentVersion isEqualToString:TI_DB_VERSION])
	{
		migrate = YES;
	}

	if (migrate)
	{
		[database executeUpdate:@"DROP TABLE IF EXISTS last_attempt"];
		[database executeUpdate:@"DROP TABLE IF EXISTS pending_events"];
		[database executeUpdate:@"CREATE TABLE IF NOT EXISTS last_attempt (date DATE, attempts INTEGER)"];
		[database executeUpdate:@"CREATE TABLE IF NOT EXISTS pending_events (data TEXT)"];
	}
	
	[database commitTransaction];
	[lock unlock];
}

-(void)enroll
{
	@try 
	{
		// if not online (since we need some stuff), re-queue for later
		id online = [[self network] valueForKey:@"online"];
		if ([TiUtils boolValue:online]==NO)
		{
			[self performSelector:@selector(enroll) withObject:nil afterDelay:10];
			return;
		}
		
		id platform = [self platform];
		
		NSMutableDictionary *enrollment = [NSMutableDictionary dictionary];
		
		[enrollment setObject:[platform valueForKey:@"processorCount"] forKey:@"oscpu"];
		[enrollment setObject:[platform valueForKey:@"ostype"] forKey:@"ostype"];
		[enrollment setObject:[platform valueForKey:@"architecture"] forKey:@"osarch"];
		[enrollment setObject:[platform valueForKey:@"model"] forKey:@"model"];
		[enrollment setObject:TI_APPLICATION_NAME forKey:@"app_name"];
		[enrollment setObject:TI_APPLICATION_DEPLOYTYPE forKey:@"deploytype"];
		[enrollment setObject:TI_APPLICATION_ID forKey:@"app_id"];
		[enrollment setObject:@"iphone" forKey:@"platform"];
		
		[self queueEvent:@"ti.enroll" name:@"ti.enroll" data:enrollment immediate:NO];
	}
	@catch (NSException * e) 
	{
		NSLog(@"[ERROR] Error sending analytics event: %@",e);
	}
}

-(NSDictionary *)startupDataPayload
{
	BOOL enrolled = NO;
	NSString *path = [self checkForEnrollment:&enrolled];
	
	[self loadDB:path create:enrolled==NO];
	
	if (enrolled==NO)
	{
		[self enroll];
	}
	
	int tz = [[NSTimeZone systemTimeZone] secondsFromGMT] / 60; // get the timezone offset to UTC in minutes
	struct utsname u;
	uname(&u);
	
	id platform = [self platform];
	id network = [self network];
	
	NSString * version = [NSString stringWithCString:TI_VERSION_STR encoding:NSUTF8StringEncoding];
	NSString * os = [platform valueForKey:@"version"];
	NSString * username = [platform valueForKey:@"username"];
	NSString * mmodel = [platform valueForKey:@"model"];
	NSString * nettype = [network valueForKey:@"networkTypeName"];
	
	NSDictionary * data = [NSDictionary dictionaryWithObjectsAndKeys:
						   NUMINT(tz),@"tz",
						   TI_APPLICATION_DEPLOYTYPE,@"deploytype",
						   @"iphone",@"os",
						   version,@"version",
						   TI_APPLICATION_VERSION,@"app_version",
						   os,@"osver",
						   VAL_OR_NSNULL(nettype),@"nettype",
						   VAL_OR_NSNULL(mmodel),@"model",
						   @"iphone", @"platform",
						   nil
						   ];
	return data;
}

#pragma mark Lifecycle

-(void)startup
{
	static bool AnalyticsStarted = NO;
	
	DebugLog(@"[DEBUG] Analytics is enabled = %@", (TI_APPLICATION_ANALYTICS==NO ? @"NO":@"YES"));
	
	if (AnalyticsStarted || TI_APPLICATION_ANALYTICS==NO)
	{
		return;
	}

	AnalyticsStarted = YES;
	
	WARN_IF_BACKGROUND_THREAD_OBJ;	//NSNotificationCenter is not threadsafe!
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(analyticsEvent:) name:kTiAnalyticsNotification object:nil];
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(remoteDeviceUUIDChanged:) name:kTiRemoteDeviceUUIDNotification object:nil];
	[self enqueueBlock:^{[self queueEvent:@"ti.start" name:@"ti.start" data:[self startupDataPayload] immediate:NO];}];
	[super startup];
}

-(void)shutdown:(id)sender
{
	if (TI_APPLICATION_ANALYTICS)
	{
		[self enqueueBlock:^{[self queueEvent:@"ti.end" name:@"ti.end" data:nil immediate:YES];}];
		WARN_IF_BACKGROUND_THREAD_OBJ;	//NSNotificationCenter is not threadsafe!
		[[NSNotificationCenter defaultCenter] removeObserver:self name:kTiAnalyticsNotification object:nil];
		[[NSNotificationCenter defaultCenter] removeObserver:self name:kTiRemoteDeviceUUIDNotification object:nil];
	}
}

#pragma mark Event Notification

-(void)analyticsEvent:(NSNotification*)note
{
	id userInfo = [note userInfo];
	if (![userInfo isKindOfClass:[NSDictionary class]])
	{
		DebugLog(@"[ERROR] Invalid analytics event received. Expected dictionary, got: %@",[userInfo class]);
		return;
	}
	[self enqueueBlock:^{
	NSDictionary *event = (NSDictionary*)userInfo;
	NSString *name = [event objectForKey:@"name"];
	NSString *type = [event objectForKey:@"type"];
	NSDictionary *data = [event objectForKey:@"data"];
	
	if (IS_NULL_OR_NIL(data) && [type isEqualToString:@"ti.foreground"]) {
		//Do we want to open this up to other events? On one hand, more data
		//is good. On the other, sending unneeded data is expensive.
		data = [self startupDataPayload];
	}
	[self queueEvent:type name:name data:data immediate:NO];
	}];
}

-(void)remoteDeviceUUIDChanged:(NSNotification*)note
{
	id userInfo = [note userInfo];
	NSString *deviceid = [userInfo objectForKey:@"deviceid"];
	NSDictionary *event = [NSDictionary dictionaryWithObject:deviceid forKey:@"deviceid"];
	[self enqueueBlock:^{[self queueEvent:@"app.settings" name:@"RemoteDeviceUUID" data:event immediate:NO];}];
}

#pragma mark Helper methods

-(NSDictionary*)dataToDictionary:(id)data
{
	if (data!=nil && [data isKindOfClass:[NSDictionary class]]==NO)
	{
		id value = [SBJSON stringify:data];
		data = [NSDictionary dictionaryWithObject:value forKey:@"data"];
	}
	return data;
}

// internal event handler
-(void)queueKeyValueEvent:(id)args type:(NSString*)type
{
	if ([args count] < 1)
	{
		[self throwException:@"invalid number of arguments, expected at least 1" subreason:nil location:CODELOCATION];
		return;
	}
	NSString *event = [args objectAtIndex:0];
	id data = [args count] > 1 ? [args objectAtIndex:1] : [NSDictionary dictionary];
	[self enqueueBlock:^{
		NSDictionary *payload = [NSDictionary dictionaryWithObjectsAndKeys:[self dataToDictionary:data],@"data",nil];	
		[self queueEvent:type name:event data:payload immediate:NO];
	}];
}

#pragma mark Public APIs

-(void)addEvent:(id)args
{
	if ([args count] < 2)
	{
		[self throwException:@"invalid number of arguments, expected at least 2" subreason:nil location:CODELOCATION];
		return;
	}
	NSString *type = [args objectAtIndex:0];
	NSString *name = [args objectAtIndex:1];
	id data = [args count] > 2 ? [args objectAtIndex:2] : [NSDictionary dictionary];
	[self enqueueBlock:^{
		DeveloperLog(@"[INFO] Analytics->addEvent with type: %@, name: %@, data: %@",type,name,data);
		
		[self queueEvent:type name:name data:[self dataToDictionary:data] immediate:NO];
	}];
}

-(void)navEvent:(id)args
{
	// from, to, event, data
	if ([args count] < 2)
	{
		[self throwException:@"invalid number of arguments, expected at least 2" subreason:nil location:CODELOCATION];
		return;
	}
	NSString *from = [args objectAtIndex:0];
	NSString *to = [args objectAtIndex:1];
	NSString *event = [args count] > 2 ? [args objectAtIndex:2] : @"";
	id data = [args count] > 3 ? [args objectAtIndex:3] : [NSDictionary dictionary];
	[self enqueueBlock:^{
		NSDictionary *payload = [NSDictionary dictionaryWithObjectsAndKeys:from,@"from",
							   to,@"to",[self dataToDictionary:data],@"data",nil];
		
		DeveloperLog(@"[INFO] Analytics->navEvent with from: %@, to: %@, event: %@, data: %@",from,to,event,data);

		[self queueEvent:@"app.nav" name:event data:payload immediate:NO];
	}];
}

-(void)timedEvent:(id)args
{
	// event, start, stop, duration, data
	if ([args count] < 4)
	{
		[self throwException:@"invalid number of arguments, expected at least 4" subreason:nil location:CODELOCATION];
		return;
	}
	NSString *event = [args objectAtIndex:0];
	NSDate *start = [args objectAtIndex:1];	
	NSDate *stop = [args objectAtIndex:2];
	ENSURE_TYPE(start,NSDate);
	ENSURE_TYPE(stop,NSDate);
	
	id duration = [args objectAtIndex:3];
	id data = [args count] > 4 ? [args objectAtIndex:4] : [NSDictionary dictionary];
	
	[self enqueueBlock:^{
		NSDictionary *payload = [NSDictionary dictionaryWithObjectsAndKeys:
								 [TiUtils UTCDateForDate:start],@"start",
								 [TiUtils UTCDateForDate:stop],@"stop",
								 duration,@"duration",
								 [self dataToDictionary:data],@"data",nil];
		
		DeveloperLog(@"[INFO] Analytics->timedEvent with event: %@, start: %@, stop: %@, duration: %@, data: %@",event,start,stop,duration,data);

		[self queueEvent:@"app.timed_event" name:event data:payload immediate:NO];
	}];
}

#define PRINT_EVENT_DETAILS(name,args) \
  id event = [args objectAtIndex:0];\
  id data = [args count] > 1 ? [args objectAtIndex:1] : nil;\
  DeveloperLog(@"[INFO] Analytics->%s with event: %@, data: %@",#name,event,data);\


-(void)featureEvent:(id)args
{
	PRINT_EVENT_DETAILS(featureEvent,args);
	[self queueKeyValueEvent:args type:@"app.feature"];
}

-(void)settingsEvent:(id)args
{
	PRINT_EVENT_DETAILS(settingsEvent,args);
	[self queueKeyValueEvent:args type:@"app.settings"];
}

-(void)userEvent:(id)args
{
	PRINT_EVENT_DETAILS(userEvent,args);
	[self queueKeyValueEvent:args type:@"app.user"];
}

@end
