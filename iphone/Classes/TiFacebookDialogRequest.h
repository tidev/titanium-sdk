/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_FACEBOOK
#import "FBConnect/Facebook.h"
#import "FacebookModule.h"
#import "KrollCallback.h"

@interface TiFacebookDialogRequest : NSObject <FBDialogDelegate> {

	KrollCallback *callback;
	FacebookModule *module;
}

-(id)initWithCallback:(KrollCallback*)callback_ module:(FacebookModule*)module_;

@end
#endif