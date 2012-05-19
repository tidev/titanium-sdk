/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "TiProxy.h"
#import "TiDOMNodeProxy.h"

@interface TiDOMCharacterDataProxy : TiDOMNodeProxy {
@private
}

@property(nonatomic,copy,readwrite) NSString * data;
@property(nonatomic,readonly)	NSNumber * length;
-(NSString *) substringData:(id)args;
-(void)	appendData:(id)args;
-(void) insertData:(id)args;
-(void) deleteData:(id)args;
-(void) replaceData:(id)args;

@end

#endif
