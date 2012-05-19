/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"

/**
 The generic action wrapper class for packaging something that you
 want to be executed but simplier than an NSOperation.
 @deprecated
 */
@interface TiAction : NSObject {
@protected
	id target;
	SEL selector;
	id arg;
}

/**
 Initializes the action.
 @param target_ The action target object.
 @param selector_ The selector to perform on the target.
 @param arg_ The argument to pass to the method.
 */
-(id)initWithTarget:(id)target_ selector:(SEL)selector_ arg:(id)arg_;

/**
 Tells the action to invoke the selector on target.
 */
-(void)execute;

/**
 Returns the target object for the action.
 */
@property(nonatomic,readonly)	id target;

/**
 Returns the actions's selector.
 */
@property(nonatomic,readonly)	SEL selector;

/**
 Returns the action's argument.
 */
@property(nonatomic,readonly)	id arg;


@end
