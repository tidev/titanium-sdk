/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef MODULE_TI_APP

#import <Foundation/Foundation.h>
#import "TitaniumModule.h"


@interface AppModule : NSObject<TitaniumModule> {
	NSUserDefaults * defaultsObject;
}

- (BOOL) propertyExists: (NSString *) key;

@end

/**
 * @tiapi(method=True,name=App.Properties.getBool,since=0.4) get value as boolean
 * @tiarg(for=App.Properties.getBool,name=name,type=string) the property name
 * @tiarg(for=App.Properties.getBool,name=name,type=boolean) a default value to return if the property doesn't exist
 * @tiresult(for=App.Properties.getBool,type=boolean) returns the value as a boolean
 *
 * @tiapi(method=True,name=App.Properties.getDouble,since=0.4) get value as double
 * @tiarg(for=App.Properties.getDouble,name=name,type=string) the property name
 * @tiarg(for=App.Properties.getDouble,name=name,type=double) a default value to return if the property doesn't exist
 * @tiresult(for=App.Properties.getDouble,type=double) returns the value as a double
 *
 * @tiapi(method=True,name=App.Properties.getInt,since=0.4) get value as integer
 * @tiarg(for=App.Properties.getInt,name=name,type=string) the property name
 * @tiarg(for=App.Properties.getInt,name=name,type=int) a default value to return if the property doesn't exist
 * @tiresult(for=App.Properties.getInt,type=integer) returns the value as an integer
 *
 * @tiapi(method=True,name=App.Properties.getString,since=0.4) get value as string
 * @tiarg(for=App.Properties.getString,name=name,type=string) the property name
 * @tiarg(for=App.Properties.getString,name=name,type=string) a default value to return if the property doesn't exist
 * @tiresult(for=App.Properties.getString,type=string) returns the value as a string
 *
 * @tiapi(method=True,name=App.Properties.getList,since=0.4) get value as a list
 * @tiarg(for=App.Properties.getList,name=name,type=string) the property name
 * @tiarg(for=App.Properties.getList,name=name,type=list) a default value to return if the property doesn't exist
 * @tiresult(for=App.Properties.getList,type=list) returns the value as a list
 *
 * @tiapi(method=True,name=App.Properties.setBool,since=0.4) set value
 * @tiarg(for=App.Properties.setBool,name=name,type=string) the property name
 * @tiarg(for=App.Properties.setBool,name=value,type=boolean) the value
 *
 * @tiapi(method=True,name=App.Properties.setDouble,since=0.4) set value
 * @tiarg(for=App.Properties.setDouble,name=name,type=string) the property name
 * @tiarg(for=App.Properties.setDouble,name=value,type=double) the value
 *
 * @tiapi(method=True,name=App.Properties.setInt,since=0.4) set value
 * @tiarg(for=App.Properties.setInt,name=name,type=string) the property name
 * @tiarg(for=App.Properties.setInt,name=value,type=integer) the value
 *
 * @tiapi(method=True,name=App.Properties.setString,since=0.4) set value
 * @tiarg(for=App.Properties.setString,name=name,type=string) the property name
 * @tiarg(for=App.Properties.setString,name=value,type=string) the value
 *
 * @tiapi(method=True,name=App.Properties.setList,since=0.4) set value
 * @tiarg(for=App.Properties.setList,name=name,type=string) the property name
 * @tiarg(for=App.Properties.setList,name=value,type=list) the value
 *
 * @tiapi(method=True,name=App.Properties.hasProperty,since=0.4) check to see if a property exists
 * @tiarg(for=App.Properties.hasProperty,name=name,type=string) the property name
 * @tiresult(for=App.Properties.hasProperty,type=boolean) returns true if the property exists
 *
 * @tiapi(method=True,name=App.Properties.listProperties,since=0.4) get a list of property values
 * @tiresult(for=App.Properties.listProperties,type=list) returns a list of property values
 *
 * @tiapi(method=True,immutable=True,name=App.getID,since=0.4) get the application id
 * @tiresult(for=App.getID,type=string) returns the id
 *
 * @tiapi(method=True,immutable=True,name=App.getName,since=0.4) get the application name
 * @tiresult(for=App.getName,type=string) returns the name
 *
 * @tiapi(method=True,immutable=True,name=App.getVersion,since=0.4) get the application version
 * @tiresult(for=App.getVersion,type=string) returns the version
 *
 * @tiapi(method=True,immutable=True,name=App.getPublisher,since=0.4) get the application publisher
 * @tiresult(for=App.getPublisher,type=string) returns the publisher
 *
 * @tiapi(method=True,immutable=True,name=App.getURL,since=0.4) get the application url
 * @tiresult(for=App.getURL,type=string) returns the url for the app
 *
 * @tiapi(method=True,immutable=True,name=App.getDescription,since=0.4) get the application description
 * @tiresult(for=App.getDescription,type=string) returns the description for the app
 *
 * @tiapi(method=True,immutable=True,name=App.getCopyright,since=0.4) get the application copyright
 * @tiresult(for=App.getCopyright,type=string) returns the copyright for the app
 *
 * @tiapi(method=True,immutable=True,name=App.getGUID,since=0.4) get the application globally unique id
 * @tiresult(for=App.getGUID,type=string) returns the unique id
 *
 * @tiapi(method=True,immutable=True,name=App.appURLToPath,since=0.4) get a full path from an application using app: URL
 * @tiarg(for=App.appURLToPath,type=string,name=url) the url, relative or absolute, to translate.
 * @tiresult(for=App.appURLToPath,type=string) returns the path
 *
 * @tiapi(method=True,name=App.getArguments,since=0.8) get a dictionary of application launch arguments or null if none
 * @tiresult(for=App.getArguments,type=object) returns an object or null if none passed
 */




#endif