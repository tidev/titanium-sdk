/**
 * Appcelerator Platform SDK
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 * Proprietary and Confidential - This source code is not for redistribution
 */

@import Foundation;
@import CoreLocation;
@import UIKit;


#import <sys/sysctl.h>
#import <mach/mach.h>
#import <sys/utsname.h>

#import <sys/types.h>
#import <sys/socket.h>
#import <ifaddrs.h>
#import <arpa/inet.h>

#ifdef DebugLog
#undef DebugLog
#endif // DebugLog

#ifdef TraceLog
#undef TraceLog
#endif // TraceLog

#ifdef ErrorLog
#undef ErrorLog
#endif

#ifdef DEBUG
#define DebugLog(fmt, ...) NSLog((@"[DEBUG] " fmt), ##__VA_ARGS__)
#define TraceLog(fmt, ...) NSLog((@"[TRACE] " fmt), ##__VA_ARGS__)
#define ErrorLog(fmt, ...) NSLog((@"[ERROR] " fmt), ##__VA_ARGS__)
#else
#define DebugLog(...)
#define TraceLog(...)
#define ErrorLog(...)
#endif // DEBUG

@interface APSUtility : NSObject

+(NSString*)deviceModel;
+(NSString*)jsonStringify:(id)value error:(NSError**)error;
+(id)jsonParse:(NSString*)value error:(NSError**)error;
+(NSString*)createUUID;
+(NSString*)appIdentifier;
+(NSString *)getArchitecture;
+(NSString*)stringValue:(id)value;
+(BOOL)isEmptyString:(NSString*)value;
+(NSDictionary *)locationDictionary:(CLLocation *)newLocation;

@end
