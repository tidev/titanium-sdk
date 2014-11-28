/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#if defined (USE_TI_UIATTRIBUTEDSTRING) || defined(USE_TI_UIIOSATTRIBUTEDSTRING)
#import "TiProxy.h"

@interface TiUIAttributedStringProxy : TiProxy
{
	NSMutableAttributedString *_attributedString;
	NSMutableArray *attributes;
}

#pragma mark - Not exposed to JS. Internal Use Only.
@property(nonatomic, readonly) NSMutableAttributedString *attributedString;

@end

#endif