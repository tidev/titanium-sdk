/**
 * Appcelerator Platform SDK
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 * Proprietary and Confidential - This source code is not for redistribution
 */

@import Foundation;
@import CoreLocation;
@import UIKit;

#import <mach/mach.h>
#import <sys/sysctl.h>
#import <sys/utsname.h>

#import <arpa/inet.h>
#import <ifaddrs.h>
#import <sys/socket.h>
#import <sys/types.h>

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

+ (NSString *_Nonnull)deviceModel;
+ (NSString *_Nullable)jsonStringify:(id _Nonnull)value error:(NSError *_Nullable *_Nullable)error;
+ (id _Nullable)jsonParse:(NSString *_Nonnull)value error:(NSError *_Nullable *_Nullable)error;
+ (NSString *_Nonnull)createUUID;
+ (NSString *_Nonnull)appIdentifier;
+ (NSString *_Nonnull)getArchitecture;
+ (NSString *_Nullable)stringValue:(id _Nullable)value;
+ (BOOL)isEmptyString:(NSString *_Nullable)value;
+ (NSDictionary *_Nullable)locationDictionary:(CLLocation *_Nonnull)newLocation;

@end
