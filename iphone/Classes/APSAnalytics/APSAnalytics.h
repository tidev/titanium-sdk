/**
 * APS Analytics
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>
/**
 * The APSAnalytics class configures the application to use the APS analytic services
 * to send analytic data that can be viewed on the Appcelerator Dashboard.
 *
 * For information on getting started with Appcelerator Platform Services,
 * see [Appclerator Platform Services for iOS](http://bit.ly/1kqteQS).
 */
@interface APSAnalytics : NSObject {
}

//Initializers
/**
 * Initializes the APS Anayltics service.
 * @param key Application GUID
 * @param deployType Set to either DEPLOY_TYPE_DEVELOPMENT or DEPLOY_TYPE_PRODUCTION
 */
+(void)enableWithAppKey:(NSString *)key withDeployType:(NSString*)deployType;

/**
 * Sets the base URL to send analytic events
 * @param url Base URL
 */
+(void)setBaseURL:(NSString *) url;

/**
 * Sets the deloy type.  Set to development by default.
 * @param deployType Set to either DEPLOY_TYPE_DEVELOPMENT or DEPLOY_TYPE_PRODUCTION
 */
+(void)setDeployType:(NSString *) deployType;

/**
 * Sets the session timeout in seconds. If the application has been in the background
 * for longer than the timeout, the analytics service logs an end time to the current user session.
 * Default value is 30 s.
 * @param interval Timeout in seconds
 */
+(void)setSessionTimeout:(NSTimeInterval) interval;

//Analytic Event Generators
/**
 * Sends a geolocation event.
 * @param locations An array of CLLocation objects containing the location data.
 */
+(void)sendAppGeoEvent:(NSArray*) locations;

/**
 * Sends a navigation event
 * @param firstView String describing the location the user navigated from
 * @param secondView String describing the location the user navigated to
 * @param type String describing the event
 * @param data Extra data to send
 */
+(void)sendAppNavEventFrom:(NSString*) firstView
                        to:(NSString*)secondView
                  withName:(NSString*)type
               withPayload:(NSDictionary*) data;

/**
 * Sends a feature event
 * @param eventName String describing the event
 * @param data Extra data to send
 */
+(void)sendFeatureEvent:(NSString*)eventName
            withPayload:(NSDictionary*)data;

//Helper properties
/**
  * Returns if analytics has been enabled
  * @return Returns YES if analytics is enabled
  */
+(BOOL)getEnabled;

/**
 * Retrieves the last event logged
 * @return Last logged event
 */
+(NSString*)getLastEvent;

/**
 * Retrieves the current deployment type
 * @return Returns either DEPLOY_TYPE_DEVELOPMENT or DEPLOY_TYPE_PRODUCTION
 */
+(NSString*)getDeployType;

/** Constant indicating development deployment */
+(NSString*)DEPLOY_TYPE_DEVELOPMENT;

/** Constant indicating production deployment */
+(NSString*)DEPLOY_TYPE_PRODUCTION;

//Titanium Specific
+(void)sendCustomEvent:(NSString*)event withType:(NSString*)eventName data:(NSDictionary*)data;

+(BOOL)debug;
+(void)setDebug:(BOOL)value;

@end
