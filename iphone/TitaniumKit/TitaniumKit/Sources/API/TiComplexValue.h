/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

/**
 The simple wrapper for properties which have "withObject"
 argument semantics that need to be stored inside our proxy until the
 view is available.  currently the key/value store of the properties
 makes it difficult to handle without marshalling them inside a wrapped
 container like this.
 */

#import <Foundation/Foundation.h>

@interface TiComplexValue : NSObject {
  id value;
  NSDictionary *properties;
}

/**
 Initializes the value.
 @param value The value to set.
 @param properties The additional properties.
 */
- (id)initWithValue:(id)value properties:(NSDictionary *)properties;

/**
 Returns the underlying value.
 */
@property (nonatomic, readonly) id value;

/**
 Returns the associated properties dictionary.
 */
@property (nonatomic, readonly) NSDictionary *properties;

@end
