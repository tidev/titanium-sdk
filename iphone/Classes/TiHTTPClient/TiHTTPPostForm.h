//
//  TiForm.h
//  HTTPClient
//
//  Created by Pedro Enrique on 1/17/14.
//  Copyright (c) 2014 Pedro Enrique. All rights reserved.
//

#import <Foundation/Foundation.h>

#ifndef PELog
#define PELog(...) {\
/*NSLog(__VA_ARGS__);*/\
}
#endif
#ifndef RELEASE_TO_NIL
#define RELEASE_TO_NIL(x) { if (x!=nil) { [x release]; x = nil; } }
#endif

@interface TiHTTPPostForm : NSObject
{
    NSMutableDictionary *_requestFormDictionay;
    NSMutableArray *_requestFilesArray;
    NSMutableDictionary *_headers;
    NSMutableData *_postFormData;
    NSData *_jsonData;
    NSData *_stringData;
}
@property(nonatomic, readonly) NSData *requestData;
@property(nonatomic, readonly) NSDictionary *requestHeaders;

-(void)setJSONData:(id)json;
-(void)setStringData:(NSString*)str;

-(void)addDictionay:(NSDictionary*)dict;
-(void)addFormKey:(NSString*)key andValue:(NSString*)value;

-(void)addFormFile:(NSString*)path;
-(void)addFormFile:(NSString*)path fieldName:(NSString*)name;
-(void)addFormFile:(NSString*)path fieldName:(NSString*)name contentType:(NSString*)contentType;

-(void)addFormData:(NSData*)data;
-(void)addFormData:(NSData*)data fileName:(NSString*)fileName;
-(void)addFormData:(NSData*)data fileName:(NSString*)fileName fieldName:(NSString*)fieldName;
-(void)addFormData:(NSData*)data fileName:(NSString*)fileName fieldName:(NSString*)fieldName contentType:(NSString*)contentType;

-(void)addHeaderKey:(NSString*)key andHeaderValue:(NSString*)value;

@end
