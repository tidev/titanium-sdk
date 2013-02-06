//
//  NSObject+DTRuntime.h
//  DTFoundation
//
//  Created by Oliver Drobnik on 4/25/12.
//  Copyright (c) 2012 Cocoanetics. All rights reserved.
//

/**
 Methods to dynamically modify objects at runtime
 */

@interface NSObject (DTRuntime)

/**-------------------------------------------------------------------------------------
 @name Method Swizzling
 ---------------------------------------------------------------------------------------
 */

/**
 Exchanges two method implementations. After the call methods to the first selector will now go to the second one and vice versa.
 @param selector The first method
 @param otherSelector The second method
 */
+ (void)swizzleMethod:(SEL)selector withMethod:(SEL)otherSelector;
 
 
/**
 Exchanges two class method implementations. After the call methods to the first selector will now go to the second one and vice versa.
 @param selector The first method
 @param otherSelector The second method
 */
+ (void)swizzleClassMethod:(SEL)selector withMethod:(SEL)otherSelector;

@end
