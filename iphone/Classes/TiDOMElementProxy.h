/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"
#import "GDataXMLNode.h"
#import "TiDOMNodeProxy.h"

@interface TiDOMElementProxy : TiDOMNodeProxy {
@private
	GDataXMLElement *element;
}

@property(nonatomic,readonly) id tagName;

-(void)setElement:(GDataXMLElement*)element;

@end
