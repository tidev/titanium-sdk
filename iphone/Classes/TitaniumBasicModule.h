/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <Foundation/Foundation.h>
#import "TitaniumModule.h"
#import "TitaniumContentViewController.h"

/**
 * This is a convenient base class for Titanium Modules that provides
 * quick way to build modules in Titanium.
 */
@interface TitaniumBasicModule : NSObject<TitaniumModule>
{
	// dictionary should never be referenced and is only created and deleted during configure
	NSMutableDictionary *dictionary;
	
	NSString *pageToken;
	
	TitaniumHost *host;
}
/**
 * method returns the name of the module. by default, modules that use the convention
 * <ModuleName>Module don't need to override this method since the name of the module
 * will be dynamically determined.  If you module does not follow this convention (bad!),
 * override this method to return your module's name to bind.
 */
-(NSString*) moduleName;

/**
 * override this method to configure your JavaScript properties and functions binding code
 */
- (void) configure;

/**
 * set a property (can only be called during configure)
 */
- (void) bindProperty:(NSString *)key value:(id)value;

/**
 * set a javascript code snippet (can only be called during configure)
 */
- (void) bindCode:(NSString *)key code:(NSString*)code;

/**
 * bind a method selector to be invoked when the property is invoked as a function (can only be called during configure)
 */
- (void) bindFunction:(NSString *)key method:(SEL)method;

/**
 * bind a method selector to be invoked when the property accessor is accessed (can only be called during configure)
 */
- (void) bindAccessor:(NSString *)key method:(SEL)method;

/**
 * bind javascript code that will execute once the module is loaded (can only be called during configure)
 */
- (void) bindInitializer:(NSString *)code;

/**
 * create new content view controller class which is used to create windows/views using token passed in createWindow
 */
- (void)registerContentViewController: (Class)controllerClass forToken:(NSString*)token;

/**
 * evaluate Javascript code in the context of a page. Pass nil for token to invoke in the current page token for the
 * pending or previous method invoked against this module
 */
- (void) evaluateJavascript:(NSString *) code token:(NSString*)token;

/**
 * get the current page token for the currently executing method or the last method executed.  this token is automatically
 * set before a bound method is invoked and persists until the next method is invoked against the module.
 */

- (NSString*) getPageToken;

/**
 * return JSON representation of an array or dictionary
 */
- (NSString*) toJSON:(id)json;

/**
 * return an object from a JSON string representation
 */
- (id) fromJSON:(NSString*)json;

/**
 * return YES to receive extended module notifications. defaults to NO. 
 */
- (BOOL) wantsNotifications;

@end



