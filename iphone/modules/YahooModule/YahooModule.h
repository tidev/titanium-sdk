/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <Foundation/Foundation.h>
#import "TitaniumBasicModule.h"

@interface YahooModule : TitaniumBasicModule {

}

@end


/**
 * @tiapi(method=True,name=Yahoo.yql,since=0.7) run a YQL query
 * @tiarg(for=Yahoo.yql,type=string,name=sql) sql statement in YQL format
 * @tiarg(for=Yahoo.yql,type=function,name=callback) callback function to receive result
 */


/**
 * @tiapi(method=True,name=Yahoo.setOAuthParameters,since=0.7) setup the application OAuth parameters - this must be called before any other methods
 * @tiarg(for=Yahoo.setOAuthParameters,type=string,name=consumerkey) your application's Yahoo consumer key
 * @tiarg(for=Yahoo.setOAuthParameters,type=string,name=sharedsecret) your application's Yahoo shared secret
 */
