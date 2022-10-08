/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSCOVERFLOWVIEW

#import "AFOpenFlow/AFOpenFlowView.h"
#import <TitaniumKit/ImageLoader.h>
#import <TitaniumKit/TiUIView.h>

@interface TiUIiOSCoverFlowView : TiUIView <AFOpenFlowViewDataSource, AFOpenFlowViewDelegate, ImageLoaderDelegate> {
  @private
  AFOpenFlowView *view;
  NSMutableDictionary *toLoad;
  NSMutableDictionary *loading;
  NSRecursiveLock *loadLock;
  NSInteger previous;
}

- (void)setImage:(id)image forIndex:(NSInteger)index;

@end

#endif
