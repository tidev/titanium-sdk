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

-(id)_initWithPageContext:(id<TiEvaluator>)context_ args:(id)args module:(FacebookModule*)module_
{
	if (self = [super _initWithPageContext:context_ args:args]) {
		module = [module_ retain];
	}
	return self;
}

-(void)dealloc
{
	RELEASE_TO_NIL(module);
	[super dealloc];
}

// NOTE: We have to override these to do nothing so that we can control the horizontal and vertical (literally)
// on the FB button.
-(void)setWidth:(id)arg
{
}

-(void)setHeight:(id)arg
{
}

// ... But we also need a way to set them internally from the view.
-(void)internalSetHeight:(id)arg
{
	[super setHeight:arg];
}

-(void)internalSetWidth:(id)arg
{
	[super setWidth:arg];
}

MAKE_SYSTEM_PROP(STYLE_NORMAL,FB_LOGIN_BUTTON_NORMAL);
MAKE_SYSTEM_PROP(STYLE_WIDE,FB_LOGIN_BUTTON_WIDE);


@end
