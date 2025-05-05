/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIWEBVIEW

#import <TitaniumKit/TiEvaluator.h>
#import <TitaniumKit/TiViewProxy.h>

@interface TiUIWebViewProxy : TiViewProxy <TiEvaluator> {
  @private
  NSMutableArray<NSString *> *_genericProperties;
  NSArray *_allowedURLSchemes;
  NSString *_pageToken;
}

- (void)refreshHTMLContent;
- (void)setPageToken:(NSString *)pageToken;
@end

#endif
