/**
 * APS Analytics
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>
#import <CoreLocation/CoreLocation.h>


/** Constant indicating development deployment */
extern NSString * const APSDeployTypeDevelopment;

/** Constant indicating production deployment */
extern NSString * const APSDeployTypeProduction;


/**
 * The APSAnalytics class configures the application to use the APS analytic services
 * to send analytic data that can be viewed on the Appcelerator Dashboard.
 *
 * For information on getting started with Appcelerator Platform Services,
 * see [Appclerator Platform Services for iOS](http://bit.ly/1kqteQS).
 */
@interface APSAnalytics : NSObject

/**
 * Return the singleton instance to the real-time analytics service.
 */
+(instancetype) sharedInstance;

/**
 * Enable the Analytics Service with the given app key. Calling
 * this method is required to start the process of collecting real-time analytics
 * data and sending it to your Analytics Dashboard. Calling this method more
 * than once results in undefined behavior.
 * @param appKey Application GUID
 * @param deployType Set to either APSDeployTypeDevelopment or APSDeployTypeProduction
 */
-(void)enableWithAppKey:(NSString *)appKey andDeployType:(NSString *)deployType;


/**
 * The session timeout in seconds. If the application has been in the background
 * for longer than the timeout, the analytics service logs an end time to the current user session.
 * Default value is 30 s.
 */
@property (atomic, readwrite) NSTimeInterval sessionTimeout;

/**
 * Retrieves the current deployment type
 * Returns either APSDeployTypeDevelopment or APSDeployTypeProduction
 */
@property (atomic, strong, readonly) NSString *deployType;

//Analytic Event Generators
/**
 * Sends a geolocation event.
 * @param location A CLLocation object containing the location data.
 */

-(void)sendAppGeoEvent:(CLLocation *) location;

/**
 * Sends a navigation event
 * @param firstView String describing the location the user navigated from
 * @param secondView String describing the location the user navigated to
 * @param eventName String describing the event
 * @param payload Extra data to send
 */
-(void)sendAppNavEventFromView:(NSString *)firstView
                        toView:(NSString *)secondView
                      withName:(NSString *)eventName
                       payload:(NSDictionary *)payload;

/**
 * Sends a feature event
 * @param eventName String describing the event
 * @param payload Extra data to send
 * TODO : key/pair vales of string
 */
-(void)sendAppFeatureEvent:(NSString *)eventName
                   payload:(NSDictionary *)payload;

@end
