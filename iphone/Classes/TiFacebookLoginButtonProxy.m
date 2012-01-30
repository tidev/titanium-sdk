/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_FACEBOOK

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

@end
#endif