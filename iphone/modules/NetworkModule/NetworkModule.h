/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef MODULE_TI_NETWORK

#import <Foundation/Foundation.h>
#import <SystemConfiguration/SCNetworkReachability.h>
#import "TitaniumModule.h"

typedef enum {
	NetworkModuleConnectionStateNone = 0,
	NetworkModuleConnectionStateWifi = 1,
	NetworkModuleConnectionStateMobile = 2,
	NetworkModuleConnectionStateLan = 3,
	NetworkModuleConnectionStateUnknown = 4,	
} NetworkModuleConnectionState;



@interface NetworkModule : NSObject<TitaniumModule> {
	NSMutableDictionary * pendingConnnections;
	NSMutableDictionary * connectivityListeners;
	NSMutableSet * pushListeners;
	int nextToken;
	int nextConnectivityListenerToken;
	SCNetworkReachabilityRef defaultRouteReachability;
	BOOL isListening;
	NSString *remoteDeviceUUID;
	NSString *userAgent;
}

- (NSString *) networkTypeName;
- (NetworkModuleConnectionState) currentNetworkConnectionState;
- (NSString*) remoteDeviceUUID;

@end


/************ Network module functions
 * @tiapi(method=True,name=Network.createHTTPClient,since=0.4) Creates an HTTPClient object
 * @tiresult(for=Network.createHTTPClient,type=object) an HTTPClient object

 * @tiapi(method=True,name=Network.encodeURIComponent,since=0.4) Encodes a URI Component
 * @tiarg(for=Network.encodeURIComponent,name=value,type=string) value to encode
 * @tiresult(for=Network.encodeURIComponent,type=string) the encoded value

 * @tiapi(method=True,name=Network.decodeURIComponent,since=0.4) Decodes a URI component
 * @tiarg(for=Network.decodeURIComponent,name=value,type=string) value to decode
 * @tiresult(for=Network.decodeURIComponent,type=string) the decoded value

 * @tiapi(method=True,name=Network.addConnectivityListener,since=0.4) Adds a connectivity change listener that fires when the system connects or disconnects from the internet
 * @tiarg(for=Network.addConnectivityListener,type=method,name=listener) a callback method to be fired when the system connects or disconnects from the internet
 * @tiresult(for=Network.addConnectivityListener,type=integer) a callback id for the event

 * @tiapi(method=True,name=Network.removeConnectivityListener,since=0.4) Removes a connectivity change listener
 * @tiarg(for=Network.removeConnectivityListener,type=integer,name=id) the callback id of the method

 ************ Network module properties
 * @tiapi(property=True,name=Network.online,since=0.4) Whether or not the system is connected to the internet
 * @tiresult(for=Network.online,type=boolean) true if the system is connected to the internet, false if otherwise

 * @tiapi(property=True,name=Network.networkTypeName,since=0.4) The human-readable name of kind of network that the device is connected to.
 * @tiresult(for=Network.networkTypeName,type=string) Either "NONE", "WIFI","MOBILE","LAN" or "UNKNOWN". 

 * @tiapi(property=True,name=Network.networkType,since=0.4) The kind of network that the device is connected to.
 * @tiresult(for=Network.networkType,type=int) One of the upper-case constant values.

 * @tiapi(property=True,name=Network.NETWORK_NONE,since=0.4) Indicates that there is no network present.
 * @tiresult(for=Network.NETWORK_NONE,type=int) A constant value to compare to Network.networkType.

 * @tiapi(property=True,name=Network.NETWORK_WIFI,since=0.4) Indicates that there is a WiFi network present.
 * @tiresult(for=Network.NETWORK_WIFI,type=int) A constant value to compare to Network.networkType.

 * @tiapi(property=True,name=Network.NETWORK_MOBILE,since=0.4) Indicates that there is either an EDGE or 3G network present.
 * @tiresult(for=Network.NETWORK_MOBILE,type=int) A constant value to compare to Network.networkType.

 * @tiapi(property=True,name=Network.NETWORK_LAN,since=0.4) Indicates that there is an ethernet or wired network present.
 * @tiresult(for=Network.NETWORK_LAN,type=int) A constant value to compare to Network.networkType.

 * @tiapi(property=True,name=Network.NETWORK_UNKNOWN,since=0.4) Indicates that there is a network, but its nature is unknown.
 * @tiresult(for=Network.NETWORK_UNKNOWN,type=int) A constant value to compare to Network.networkType.
 
 ************ Network.HTTPClient functions
 
 * @tiapi(method=True,name=Network.HTTPClient.abort,since=0.4) Aborts an in progress connection

 * @tiapi(method=True,name=Network.HTTPClient.open,since=0.4) Opens an HTTP connection
 * @tiarg(for=Network.HTTPClient.open,name=connectionType,type=string) either "GET" or "POST"
 * @tiarg(for=Network.HTTPClient.open,name=location,type=string) URL to connect to

 * @tiapi(method=True,name=Network.HTTPClient.setRequestHeader,since=0.4) Sets a request header for the connection
 * @tiarg(for=Network.HTTPClient.setRequestHeader,name=header,type=string) request header name
 * @tiarg(for=Network.HTTPClient.setRequestHeader,name=value,type=string) request header value

 * @tiapi(method=True,name=Network.HTTPClient.send,since=0.4) Sends data through the HTTP connection
 * @tiarg(for=Network.HTTPClient.send,type=object,name=data) data to send. If string, sends as message body. If object, sets the connection type to POST and sends key/values

 * @tiapi(method=True,name=Network.HTTPClient.getResponseHeader,since=0.4) Returns the value of a response header
 * @tiarg(for=Network.HTTPClient.getResponseHeader,type=string,name=name) the response header name
 * @tiresult(for=Network.HTTPClient.getResponseHeader,type=string) the value of the response header

 * @tiapi(method=True,name=Network.HTTPClient.getResponseHeader,since=0.4) Returns all response headers
 * @tiresult(for=Network.HTTPClient.getResponseHeader,type=object) the response headers (keys and values) object
 
 * Not currently implemented: @/tiapi(method=True,name=Network.HTTPClient.setTimeout,since=0.4) Sets the timeout for the request
 * @/tiarg(for=Network.HTTPClient.setTimeout,type=integer,name=timeout) timeout value in milliseconds

 ************ Network.HTTPClient properties
 * @tiapi(property=True,type=integer,name=Network.HTTPClient.readyState,since=0.4) The ready-state status for the connection
 * @tiapi(property=True,type=integer,name=Network.HTTPClient.UNSENT,since=0.4) The UNSENT readyState property
 * @tiapi(property=True,type=integer,name=Network.HTTPClient.OPENED,since=0.4) The OPENED readyState property
 * @tiapi(property=True,type=integer,name=Network.HTTPClient.HEADERS_RECEIVED,since=0.4) The HEADERS_RECEIVED readyState property
 * @tiapi(property=True,type=integer,name=Network.HTTPClient.LOADING,since=0.4) The LOADING readyState property
 * @tiapi(property=True,type=integer,name=Network.HTTPClient.DONE,since=0.4) The DONE readyState property
 
 * @tiapi(property=True,type=string,name=Network.HTTPClient.responseText,since=0.4) The response of an HTTP request as text
 * Currently not implemented: @/tiapi(property=True,type=object,name=Network.HTTPClient.responseXML,since=0.4) The response of an HTTP request as parsable XML
 * @tiapi(property=True,type=integer,name=Network.HTTPClient.status,since=0.4) The response status code of an HTTP request
 * @tiapi(property=True,type=integer,name=Network.HTTPClient.connected,since=0.4) Whether an HTTPClient object is connected or not
 * @tiapi(property=True,type=method,name=Network.HTTPClient.onreadystatechange,since=0.4) The handler function that will be fired when the ready-state code of an HTTPClient object changes
 * @tiapi(property=True,type=method,name=Network.HTTPClient.onload,since=0.5) The handler function that will be fired when the ready-state code of an HTTPClient object changes to ready state (DONE)
 
 * @tiapi(property=True,type=method,name=Network.HTTPClient.ondatastream,since=0.4) The handler function that will be fired as stream data is received from an HTTP request
 * Currently not implemented: @/tiapi(property=True,type=method,name=Network.HTTPClient.onsendstream,since=0.4) The handler function that will be fired as the stream data is sent

 */

#endif