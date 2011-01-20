/**
 * Appcelerator Commercial License. Copyright (c) 2010 by Appcelerator, Inc.
 *
 * Appcelerator Titanium is Copyright (c) 2009-2010 by Appcelerator, Inc.
 * and licensed under the Apache Public License (version 2)
 */
#ifdef USE_TI_FACEBOOK
#import "TiUIView.h"
#import "FBConnect/FBLoginButton.h"
#import "FacebookModule.h"

@interface TiFacebookLoginButton : TiUIView<TiFacebookStateListener> {

	FBLoginButton2 *button;
}

@end
#endif