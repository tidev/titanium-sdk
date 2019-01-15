/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiViewTemplate.h"

@implementation TiViewTemplate {
  NSString *_type;
  NSMutableDictionary *_properties;
  NSMutableDictionary *_events;
  NSMutableArray *_childTemplates;
}

@synthesize type = _type;
@synthesize properties = _properties;
@synthesize events = _events;
@synthesize childTemplates = _childTemplates;

- (id)initWithViewTemplate:(NSDictionary *)viewTemplate
{
  self = [super init];
  if (self) {
    [self loadFromDictionary:viewTemplate];
  }
  return self;
}

- (void)dealloc
{
  [_type release];
  [_properties release];
  [_events release];
  [_childTemplates release];
  [super dealloc];
}

- (BOOL)isEmpty
{
  return ([_type length] == 0) && ([_properties count] == 0) && ([_events count] == 0) && ([_childTemplates count] == 0);
}

- (void)loadFromDictionary:(NSDictionary *)viewTemplate
{
  [_properties release];
  _properties = [[NSMutableDictionary alloc] init];
  [_events release];
  _events = [[NSMutableDictionary alloc] init];
  [_childTemplates release];
  _childTemplates = [[NSMutableArray alloc] init];

  [_type release];
  _type = [[viewTemplate objectForKey:@"type"] copy];

  id properties = [viewTemplate objectForKey:@"properties"];
  if ([properties isKindOfClass:[NSDictionary class]]) {
    [(NSDictionary *)properties enumerateKeysAndObjectsUsingBlock:^(id key, id value, BOOL *stop) {
      if ([key isKindOfClass:[NSString class]] && ![value isKindOfClass:[KrollCallback class]]) {
        [_properties setObject:value forKey:key];
      }
    }];
  }
  id bindIdValue = [viewTemplate objectForKey:@"bindId"];
  if ([bindIdValue isKindOfClass:[NSString class]]) {
    [_properties setObject:bindIdValue forKey:@"bindId"];
  }

  id events = [viewTemplate objectForKey:@"events"];
  if ([events isKindOfClass:[NSDictionary class]]) {
    [(NSDictionary *)events enumerateKeysAndObjectsUsingBlock:^(id eventName, id listener, BOOL *stop) {
      if ([eventName isKindOfClass:[NSString class]] && ([listener isKindOfClass:[KrollCallback class]] || [listener isKindOfClass:[NSArray class]])) {
        if ([listener isKindOfClass:[KrollCallback class]]) {
          listener = [NSArray arrayWithObject:listener];
        }
        NSMutableArray *listeners = [[NSMutableArray alloc] initWithCapacity:[listener count]];
        [(NSArray *)listener enumerateObjectsUsingBlock:^(id callback, NSUInteger idx, BOOL *stop) {
          if ([callback isKindOfClass:[KrollCallback class]]) {
            KrollWrapper *wrapper = [callback toKrollWrapper];
            [wrapper protectJsobject];
            [listeners addObject:wrapper];
          }
        }];
        [_events setObject:listeners forKey:eventName];
        [listeners release];
      }
    }];
  }

  id childTemplates = [viewTemplate objectForKey:@"childTemplates"];
  if ([childTemplates isKindOfClass:[NSArray class]]) {
    [(NSArray *)childTemplates enumerateObjectsUsingBlock:^(id childTemplate, NSUInteger idx, BOOL *stop) {
      childTemplate = [[self class] templateFromViewTemplate:childTemplate];
      if (childTemplate != nil) {
        [_childTemplates addObject:childTemplate];
      }
    }];
  }
}

+ (TiViewTemplate *)templateFromViewTemplate:(id)viewTemplate
{
  if ([viewTemplate isKindOfClass:[TiViewTemplate class]]) {
    return ![viewTemplate isEmpty] ? viewTemplate : nil;
  } else if ([viewTemplate isKindOfClass:[NSDictionary class]]) {
    viewTemplate = [[self alloc] initWithViewTemplate:viewTemplate];
    if (![viewTemplate isEmpty]) {
      return [viewTemplate autorelease];
    }
    [viewTemplate release];
  }
  return nil;
}

@end
