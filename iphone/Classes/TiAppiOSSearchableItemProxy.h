/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"
#import <CoreSpotlight/CoreSpotlight.h>

#ifdef USE_TI_APPIOS
@interface TiAppiOSSearchableItemProxy : TiProxy {

}
-(id)initWithUniqueIdentifier:(NSString *)identifier
         withDomainIdentifier:(NSString*)domainIdentifier
             withAttributeSet:(CSSearchableItemAttributeSet *)attributeSet;

@property(nonatomic,retain) CSSearchableItem *item;

#endif
@end
