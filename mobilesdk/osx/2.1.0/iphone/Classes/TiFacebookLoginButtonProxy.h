/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_FACEBOOK
#import "TiViewProxy.h"
#import "FacebookModule.h"
#import "TiFacebookLoginButton.h"

@interface TiFacebookLoginButtonProxy : TiViewProxy {

	FacebookModule *module;
}

-(id)_initWithPageContext:(id<TiEvaluator>)context_ args:(id)args module:(FacebookModule*)module_;

@property(nonatomic,readonly) FacebookModule *_module;

-(void)internalSetWidth:(id)width;
-(void)internalSetHeight:(id)height;

@end
#endif