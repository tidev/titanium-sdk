/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if IS_XCODE_7
#ifdef USE_TI_APPIOSSEARCHABLEITEMATTRIBUTESET
#import "TiProxy.h"
#import <CoreSpotlight/CoreSpotlight.h>

@interface TiAppiOSSearchableItemAttributeSetProxy : TiProxy {
@private
    NSArray *dateFieldTypes;
    NSArray *urlFieldTypes;
    NSArray *unsupportedFieldTypes;
}

-(id)initWithItemContentType:(NSString *)itemContentType withProps:(NSDictionary*)props;

@property(nonatomic,retain) CSSearchableItemAttributeSet *attributes;

@end
#endif
#endif