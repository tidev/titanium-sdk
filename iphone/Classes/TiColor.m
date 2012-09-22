/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiColor.h"
#import "Webcolor.h"
#import "TiBase.h"
#import "TiUtils.h"
//TODO: Move all of Webcolor into TiColor.

@implementation TiColor

@synthesize color, name;

+(id)colorNamed:(NSString *)name
{
	TiColor * result;
	UIColor * translatedColor = nil;

	if ([name caseInsensitiveCompare:@"default"] != NSOrderedSame)
	{	//Default is allowed nil, while still counting as a color to stop inheritance.
		translatedColor = [Webcolor webColorNamed:name];
		if(translatedColor == nil)
		{
			return nil;
		}
	}
    if ([TiUtils isIOS6OrGreater] && (translatedColor == [UIColor groupTableViewBackgroundColor])) {
        DebugLog(@"[WARN]Group style table view backgrounds can no longer be represented by a simple color. Reverting to black");
        translatedColor = [UIColor blackColor];
    }
	result = [[self alloc] initWithColor:translatedColor name:name];
	return [result autorelease];
}

-(id)initWithColor:(UIColor*)color_ name:(NSString*)name_
{
	if (self = [super init])
	{
		color = [color_ retain];
		name = [name_ retain];
	}
	return self;
}

-(void)dealloc
{
	RELEASE_TO_NIL(color);
	RELEASE_TO_NIL(name);
	[super dealloc];
}

// we actually instead of returning the UIColor proxy
// just want to return the original name of the color they
// passed in back to us since the UIColor class doesn't have
// a way for us to ask it for the RGB components to construct it
-(id)_proxy:(TiProxyBridgeType)type
{
	return name;
}

#pragma mark Deprecated

-(UIColor*)_color
{
	return self.color;
}

-(NSString*)_name
{
	return self.name;
}

@end
