/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"

@interface TiViewTemplate : TiProxy

@property (nonatomic, readonly) NSString *type;
@property (nonatomic, readonly) NSDictionary *properties;
@property (nonatomic, readonly) NSDictionary *events;
@property (nonatomic, readonly) NSArray *childTemplates;

- (id)initWithViewTemplate:(NSDictionary *)viewTemplate;
- (BOOL)isEmpty;

+ (TiViewTemplate *)templateFromViewTemplate:(id)viewTemplate;

@end
