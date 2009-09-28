/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef MODULE_TI_PLATFORM

#import <Foundation/Foundation.h>
#import "TitaniumBasicModule.h"

@interface PlatformModule : TitaniumBasicModule {
}

- (NSString *) createUUID;

@end

/****** Platform functions
 * @tiapi(method=True,returns=string,name=Platform.createUUID,since=0.4) Creates a globally unique id
 * @tiresult(for=Platform.createUUID,type=string) a uuid

 * @tiapi(method=True,name=Platform.openURL,since=0.4) Opens a URL in the default system browser
 * @tiarg(for=Platform.openURL,name=url,type=string) the url

 ****** Platform properties
 * @tiapi(property=True,type=string,name=Platform.model,since=0.4) The model name of the device.
 * @tiapi(property=True,type=string,name=Platform.phoneNumber,since=0.4) The phone number of the device. Null if not a phone
 * @tiapi(property=True,type=float,name=Platform.availableMemory,since=0.4) Memory availible on the system.
 * @tiapi(property=True,type=string,name=Platform.ostype,since=0.4) The architecture type of the system (either 32 bit or 64 bit)
 * @tiapi(property=True,type=string,name=Platform.name,since=0.4) The operating system name
 * @tiapi(property=True,type=string,name=Platform.version,since=0.4) The operating system version
 * @tiapi(property=True,type=string,name=Platform.architecture,since=0.4) The operating system architecture
 * @tiapi(property=True,type=string,name=Platform.address,since=0.4) The primary IP address of the system
 * @tiapi(property=True,type=string,name=Platform.id,since=0.4) The unique machine id of the system
 * @tiapi(property=True,type=string,name=Platform.macaddress,since=0.4) The primary MAC address of the system
 * @tiapi(property=True,type=integer,name=Platform.processorCount,since=0.4) The number of processors for the machine
 * @tiapi(property=True,type=string,name=Platform.username,since=0.4) The platform's user name

 */
 
#endif