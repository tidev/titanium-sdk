/**
 * APS Analytics
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

@import Foundation;
@import CoreLocation;

/** Constant indicating development deployment */
extern NSString * const APSDeployTypeDevelopment;

/** Constant indicating production deployment */
extern NSString * const APSDeployTypeProduction;

/**
 * The APSAnalytics class configures the application to use the APS analytic services
 * to send analytic data that can be viewed on the Appcelerator Dashboard.
 *
 * For information on getting started with Appcelerator Platform Services,
 * see [Appcelerator Platform Services for iOS](http://bit.ly/1kqteQS).
 */
@interface APSAnalytics : NSObject

/**
 * Return the singleton instance to the real-time analytics service.
 */
+ (instancetype) sharedInstance;

/**
 * The session timeout in seconds. If the application has been in the background
 * for longer than the timeout, the analytics service logs an end time to the current user session.
 * Default: 30s
 */
@property (atomic, readwrite) NSTimeInterval sessionTimeout;

/**
 * Retrieves the current deployment type.
 * Returns either APSDeployTypeDevelopment or APSDeployTypeProduction.
 */
@property (atomic, strong, readonly) NSString *deployType;

/**
 * Allows the user to opt out from Analytics during runtime to comply to GPDR.
 * Default: NO
 *
 * @since 2.1.0
 */
@property (nonatomic, assign, getter=isOptedOut) BOOL optedOut;

/**
 * Sends a geolocation event.
 * @param location A CLLocation object containing the location data.
 */
- (void)sendAppGeoEvent:(CLLocation *) location;

/**
 * Sends a navigation event
 * @param firstView String describing the location the user navigated from.
 * @param secondView String describing the location the user navigated to.
 * @param eventName String describing the event.
 * @param payload Extra data to send. You can only send strings and numbers.
 */
- (void)sendAppNavEventFromView:(NSString *)firstView
                        toView:(NSString *)secondView
                      withName:(NSString *)eventName
                       payload:(NSDictionary *)payload;

/**
 * Sends a feature event.
 * @param eventName String describing the event.
 * @param payload Extra data to send. You can only send strings and numbers.
 */
- (void)sendAppFeatureEvent:(NSString *)eventName
                   payload:(NSDictionary *)payload;

/**
 * Sends a crash event.
 * @param payload crash data to send.
 */
- (void)sendAppCrashEvent:(NSDictionary *)payload;

/**
 * Enables Analytics with a given app-key and deploy-type.
 * @param appKey The APSAnalytics app-key.
 * @param deployType The deploy-type of the application.
 */
-(void)enableWithAppKey:(NSString *)appKey andDeployType:(NSString *)deployType;

@end
