/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <JavaScriptCore/JavaScriptCore.h>

@protocol TiExports <JSExport>

@property (readonly, nonatomic) NSString *apiName;
@property (readonly, nonatomic) NSString *buildDate;
@property (readonly, nonatomic) NSString *buildHash;
@property (readwrite, nonatomic) NSString *userAgent;
@property (readonly, nonatomic) NSString *version;

- (JSValue *)createBuffer:(NSDictionary *)arg;

// Accessors from JS. This is pretty redundant, Maybe introduce macros for this common case?
// (i.e. readonly properties also generate getter methods, readwrite generator getter/setters)
- (NSString *)getBuildDate;
- (NSString *)getBuildHash;
- (NSString *)getUserAgent;
- (void)setUserAgent:(NSString *)value;
- (NSString *)getVersion;

@end

@interface TopTiModule : NSObject <TiExports>
- (NSDictionary *)dumpCoverage:(id)unused_;
@end
