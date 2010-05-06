/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONESYSTEMBUTTONSTYLE

#import "TiProxy.h"

@interface TiUISystemButtonStyleProxy : TiProxy {

}

@property(nonatomic,readonly) NSNumber *DONE;
@property(nonatomic,readonly) NSNumber *BORDERED;
@property(nonatomic,readonly) NSNumber *PLAIN;
@property(nonatomic,readonly) NSNumber *BAR;	//TODO: review this


@end

#endif