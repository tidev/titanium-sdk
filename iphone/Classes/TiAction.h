/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"

/**
 * generic action wrapper class for packaging something that you
 * want to be executed but simplier than an NSOperation
 */

@interface TiAction : NSObject {
@protected
	id target;
	SEL selector;
	id arg;
}

-(id)initWithTarget:(id)target_ selector:(SEL)selector_ arg:(id)arg_;
-(void)execute;

@property(nonatomic,readonly)	id target;
@property(nonatomic,readonly)	SEL selector;
@property(nonatomic,readonly)	id arg;


@end
