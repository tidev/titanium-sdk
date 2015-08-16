/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"
#import <CoreSpotlight/CoreSpotlight.h>

#ifdef USE_TI_APPIOS
@interface TiAppiOSSearchableItemAttributeSetProxy : TiProxy {
@private
    NSArray *dateFieldTypes;
    NSArray *urlFieldTypes;
    NSArray *unsupportedFieldTypes;
}

-(id)initWithItemContentType:(NSString *)itemContentType withProps:(NSDictionary*)props;

@property(nonatomic,retain) CSSearchableItemAttributeSet *attributes;

#endif

@end
