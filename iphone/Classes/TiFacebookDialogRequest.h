/**
 * Appcelerator Commercial License. Copyright (c) 2010 by Appcelerator, Inc.
 *
 * Appcelerator Titanium is Copyright (c) 2009-2010 by Appcelerator, Inc.
 * and licensed under the Apache Public License (version 2)
 */
#ifdef USE_TI_FACEBOOK
#import "FBConnect/Facebook.h"
#import "FacebookModule.h"
#import "KrollCallback.h"

@interface TiFacebookDialogRequest : NSObject <FBDialogDelegate2> {

	KrollCallback *callback;
	FacebookModule *module;
}

-(id)initWithCallback:(KrollCallback*)callback_ module:(FacebookModule*)module_;

@end
#endif