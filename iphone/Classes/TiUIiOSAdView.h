/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUIView.h"

#ifdef USE_TI_UIIOSADVIEW

#import "TiUIiOSAdViewProxy.h"
#import <iAd/iAd.h>

@interface TiUIiOSAdView : TiUIView<ADBannerViewDelegate> {

@private
	ADBannerView *adview;
}

@property (nonatomic, readonly) ADBannerView* adview;

@end

#endif
