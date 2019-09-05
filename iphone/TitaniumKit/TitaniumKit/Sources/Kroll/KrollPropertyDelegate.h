/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

//
// this is a simple property delegate that is used to indicate that a return
// value should be delegated as a method to another target/selector when
// invoked. it provides a clean separation between Kroll and an implementation
//

#import <Foundation/Foundation.h>

@interface KrollPropertyDelegate : NSObject {
  @private
  id target;
  SEL selector;
}
- (id)initWithTarget:(id)target selector:(SEL)selector;
- (id)target;
- (SEL)selector;

@end
