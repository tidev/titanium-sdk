/**
 * Appcelerator Commercial License. Copyright (c) 2010 by Appcelerator, Inc.
 *
 * Appcelerator Titanium is Copyright (c) 2009-2010 by Appcelerator, Inc.
 * and licensed under the Apache Public License (version 2)
 */
#ifdef USE_TI_FACEBOOK
#import "TiViewProxy.h"
#import "FacebookModule.h"
#import "TiFacebookLoginButton.h"

@interface TiFacebookLoginButtonProxy : TiViewProxy {

	FacebookModule *module;
}

-(id)initWithModule:(FacebookModule*)module_;

@property(nonatomic,readonly) FacebookModule *_module;


@property(nonatomic,readonly) NSNumber *STYLE_NORMAL;
@property(nonatomic,readonly) NSNumber *STYLE_WIDE;

@end
#endif