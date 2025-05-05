/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UITOOLBAR)

#import <TitaniumKit/TiToolbar.h>
#import <TitaniumKit/TiViewProxy.h>

@interface TiUIToolbarProxy : TiViewProxy <TiToolbar> {
  @private
  NSString *_apiName;
}

- (id)_initWithPageContext:(id<TiEvaluator>)context_ args:(NSArray *)args apiName:(NSString *)apiName;

@end

#endif
