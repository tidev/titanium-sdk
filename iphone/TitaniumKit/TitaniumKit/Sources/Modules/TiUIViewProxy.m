/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIViewProxy.h"

@implementation TiUIViewProxy

static NSArray *uiviewKeySequence;

#pragma mark Internal

- (NSArray *)keySequence
{
  if (uiviewKeySequence == nil) {
    uiviewKeySequence = [[NSArray arrayWithObjects:@"borderRadius", @"borderWidth", @"borderColor", @"viewShadowColor", @"viewShadowRadius", @"viewShadowOffset", nil] retain];
  }
  return uiviewKeySequence;
}

- (NSString *)apiName
{
  return @"Ti.UI.View";
}

@end
