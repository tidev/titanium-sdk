/**
 * APS Analytics
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>

@interface APSAnalytics : NSObject {
}

//Initializers
+(void)enableWithAppKey:(NSString *)key withDeployType:(NSString*)deployType;
+(void)setBaseURL:(NSString *) url;
+(void)setDeployType:(NSString *) deployType;
+(void)setSessionTimeout:(NSTimeInterval) interval;

//Analytic Event Generators
+(void)sendAppGeoEvent:(NSArray*) locations;

+(void)sendAppNavEventFrom:(NSString*) firstView
                        to:(NSString*)secondView
                  withName:(NSString*)type
               withPayload:(NSDictionary*) data;

+(void)sendFeatureEvent:(NSString*)eventName
            withPayload:(NSDictionary*)data;
//Helper properties
+(NSString*)getVersion;
+(NSString*)getLastEvent;
+(NSString*)getDeployType;
+(NSString*)DEPLOY_TYPE_DEVELOPMENT;
+(NSString*)DEPLOY_TYPE_PRODUCTION;


//Titanium Specific
+(void)sendCustomEvent:(NSString*)event withType:(NSString*)eventName data:(NSDictionary*)data;

@end
