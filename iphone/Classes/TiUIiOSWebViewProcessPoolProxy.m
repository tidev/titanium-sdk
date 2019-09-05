/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIWEBVIEW

#import "TiUIiOSWebViewProcessPoolProxy.h"

@implementation TiUIiOSWebViewProcessPoolProxy

- (id)_initWithPageContext:(id<TiEvaluator>)context
{
  if (self = [super _initWithPageContext:context]) {
    _pool = [[WKProcessPool alloc] init];
  }

  return self;
}

@end

#endif
