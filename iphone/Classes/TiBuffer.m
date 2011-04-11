/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiBuffer.h"


@implementation TiBuffer
@synthesize data;

#pragma mark Internals

-(id)initWithData:(NSData *)data_
{
    if (self = [super init]) {
        data = [[NSMutableData alloc] initWithData:data_];
    }
    return self;
}

-(void)dealloc
{
    RELEASE_TO_NIL(data);
    [super dealloc];
}

#pragma mark Public API : Functions

-(TiBlob*)toBlob:(id)_void
{
    return [[[TiBlob alloc] initWithData:[data copy] mimetype:@"application/octet-stream"] autorelease];
}

-(NSString*)toString:(id)_void 
{
    return [[[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] autorelease];
}

@end
