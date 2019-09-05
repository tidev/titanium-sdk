/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIWEBVIEW

#import <TitaniumKit/TiProxy.h>
#import <WebKit/WebKit.h>

@interface TiUIiOSWebViewProcessPoolProxy : TiProxy {
}

@property (nonatomic, strong) WKProcessPool *pool;

@end

#endif
