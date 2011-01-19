/**
 * Appcelerator Commercial License. Copyright (c) 2010 by Appcelerator, Inc.
 *
 * Appcelerator Titanium is Copyright (c) 2009-2010 by Appcelerator, Inc.
 * and licensed under the Apache Public License (version 2)
 */

#import "TiFacebookLoginButtonProxy.h"
#import "TiUtils.h"

@implementation TiFacebookLoginButtonProxy

@synthesize _module = module;

-(id)initWithModule:(FacebookModule*)module_
{
	if (self = [super init])
	{
		module = [module_ retain];
	}
	return self;
}

-(void)dealloc
{
	RELEASE_TO_NIL(module);
	[super dealloc];
}

MAKE_SYSTEM_PROP(STYLE_NORMAL,FB_LOGIN_BUTTON_NORMAL);
MAKE_SYSTEM_PROP(STYLE_WIDE,FB_LOGIN_BUTTON_WIDE);


@end
