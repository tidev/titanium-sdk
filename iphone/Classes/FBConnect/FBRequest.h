/*
 * Copyright 2010 Facebook
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
#ifdef USE_TI_FACEBOOK
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

//JGH: renamed FBRequest2 since current Ti SDK has same class built-in


@protocol FBRequestDelegate2;

/**
 * Do not use this interface directly, instead, use method in Facebook.h
 */
@interface FBRequest2 : NSObject {
  id<FBRequestDelegate2> _delegate;
  NSString*             _url;
  NSString*             _httpMethod;
  NSMutableDictionary*  _params;
  NSURLConnection*      _connection;
  NSMutableData*        _responseText;
}


@property(nonatomic,assign) id<FBRequestDelegate2> delegate;

/**
 * The URL which will be contacted to execute the request.
 */
@property(nonatomic,copy) NSString* url;

/**
 * The API method which will be called.
 */
@property(nonatomic,copy) NSString* httpMethod;

/**
 * The dictionary of parameters to pass to the method.
 *
 * These values in the dictionary will be converted to strings using the
 * standard Objective-C object-to-string conversion facilities.
 */
@property(nonatomic,assign) NSMutableDictionary* params;


@property(nonatomic,assign) NSURLConnection*  connection;

@property(nonatomic,assign) NSMutableData* responseText;


+ (NSString*)serializeURL:(NSString *)baseUrl
                   params:(NSDictionary*)params;

+ (NSString*)serializeURL:(NSString *)baseUrl
                   params:(NSDictionary*)params
               httpMethod:(NSString *)httpMethod;

+ (FBRequest2*)getRequestWithParams:(NSMutableDictionary *) params
                        httpMethod:(NSString *) httpMethod
                          delegate:(id<FBRequestDelegate2>)delegate
                        requestURL:(NSString *) url;
- (BOOL) loading;

- (void) connect;

@end

///////////////////////////////////////////////////////////////////////////////////////////////////

/*
 *Your application should implement this delegate
 */
@protocol FBRequestDelegate2 <NSObject>

@optional

/**
 * Called just before the request is sent to the server.
 */
- (void)requestLoading:(FBRequest2*)request;

/**
 * Called when the server responds and begins to send back data.
 */
- (void)request:(FBRequest2*)request didReceiveResponse:(NSURLResponse*)response;

/**
 * Called when an error prevents the request from completing successfully.
 */
- (void)request:(FBRequest2*)request didFailWithError:(NSError*)error;

/**
 * Called when a request returns and its response has been parsed into an object.
 *
 * The resulting object may be a dictionary, an array, a string, or a number, depending
 * on thee format of the API response.
 */
- (void)request:(FBRequest2*)request didLoad:(id)result;

/**
 * Called when a request returns a response.
 *
 * The result object is the raw response from the server of type NSData
 */
- (void)request:(FBRequest2*)request didLoadRawResponse:(NSData*)data;

@end
#endif