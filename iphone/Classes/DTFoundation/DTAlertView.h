//
//  DTAlertView.h
//  DTFoundation
//
//  Created by Oliver Drobnik on 11/22/12.
//  Copyright (c) 2012 Cocoanetics. All rights reserved.
//

// the block to execute when an alert button is tapped
typedef void (^DTAlertViewBlock)(void);

/**
 Extends UIAlertView with support for blocks
 
 UIAlertView does not have any public methods to set the cancelButtonIndex and firstOtherButtonIndex the last added button will always become the cancel button. 
 */

@interface DTAlertView : UIAlertView

/**
* Initializes the alert view. Add buttons and their blocks afterwards.
 @param title The alert title
 @param message The alert message
*/
- (id)initWithTitle:(NSString *)title message:(NSString *)message;

/**
 Adds a button to the alert view
 
 The last button added always becomes the cancel button
 @param title The title of the new button.
 @param block The block to execute when the button is tapped.
 @returns The index of the new button. Button indices start at 0 and increase in the order they are added.
 */
- (NSInteger)addButtonWithTitle:(NSString *)title block:(DTAlertViewBlock)block;

@end
