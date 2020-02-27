/**
 * Appcelerator APSHTTPClient Library
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>

@interface APSHTTPPostForm : NSObject

@property (nonatomic, readonly) NSData *requestData;
@property (nonatomic, readonly) NSDictionary *requestHeaders;
@property (nonatomic, readonly) NSString *contentType;

- (void)setJSONData:(id)json;
- (void)setStringData:(NSString *)str;
- (void)appendData:(NSData *)data withContentType:(NSString *)contentType;

- (void)addDictionay:(NSDictionary *)dict;
- (void)addFormKey:(NSString *)key andValue:(NSString *)value;

- (void)addFormFile:(NSString *)path;
- (void)addFormFile:(NSString *)path fieldName:(NSString *)name;
- (void)addFormFile:(NSString *)path fieldName:(NSString *)name contentType:(NSString *)contentType;

- (void)addFormData:(NSData *)data;
- (void)addFormData:(NSData *)data fileName:(NSString *)fileName;
- (void)addFormData:(NSData *)data fileName:(NSString *)fileName fieldName:(NSString *)fieldName;
- (void)addFormData:(NSData *)data fileName:(NSString *)fileName fieldName:(NSString *)fieldName contentType:(NSString *)contentType;

- (void)addHeaderKey:(NSString *)key andHeaderValue:(NSString *)value;
- (void)destroyTemporaryData;

@end
