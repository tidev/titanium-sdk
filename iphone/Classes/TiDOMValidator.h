/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import <Foundation/Foundation.h>

@interface TiDOMValidator : NSObject

+(BOOL)checkElementName:(NSString*)pName;
+(BOOL)checkAttributeName:(NSString*)pName;
+(BOOL)checkNamespacePrefix:(NSString*)pName;
+(BOOL)checkNamespaceURI:(NSString*)pName;
@end
#endif