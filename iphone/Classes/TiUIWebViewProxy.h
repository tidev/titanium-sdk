/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIWEBVIEW

#import "TiEvaluator.h"
#import "TiViewProxy.h"

@interface TiUIWebViewProxy : TiViewProxy <TiEvaluator> {
  @private
  NSString *pageToken;
  NSString *evalResult;
  NSArray *webKeySequence;
  BOOL inKJSThread;
}
- (void)setPageToken:(NSString *)pageToken;
#pragma mark - Internal Use Only
- (void)webviewDidFinishLoad;
@end

#endif
