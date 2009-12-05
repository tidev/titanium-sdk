/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <TitaniumModule.h>
#import <TitaniumBasicModule.h>
#import "FBConnect.h"

@interface FacebookModule : TitaniumBasicModule<FBSessionDelegate,FBDialogDelegate,FBRequestDelegate> {
	FBSession *session;
	FBLoginDialog *dialog;
	NSRecursiveLock *lock;
	BOOL pendingPermissions;
	NSMutableDictionary *permissions;
	NSString *pendingPermission;
	NSString *pendingQueryId;
}
-(void)fetchPermissions;
-(void)addPermission:(NSString*)permission value:(NSNumber*)value;
-(void)setPermissions:(NSDictionary*)dict;
@end

@interface FBRequestCallback : NSObject<FBRequestDelegate> {
	NSString *token;
	NSString *pageToken;
	FacebookModule *module;
	NSString *prefix;
	NSData *data;
}
@property (nonatomic,retain) NSData *data;
@end

@interface FBPermissionPrefetch : NSObject<FBRequestDelegate>{
	FacebookModule *module;
}
@end

@interface FBDialogCallback : NSObject<FBDialogDelegate> 
{
	NSString *token;
	NSString *pageToken;
	FacebookModule *module;
	FBDialog *dialog;
	NSString *prefix;
}
- (void)show;
- (id) initWithToken:(NSString*)token_ pageToken:(NSString*)pageToken_ module:(FacebookModule*)module_ prefix:(NSString*)prefix_;
@end


@interface FBPermissionCallback : FBDialogCallback {
	NSString *permission;
}
@end

@interface FBFeedCallback : FBDialogCallback {
	NSNumber *templateBundleId;
	NSString *templateData;
	NSString *body;
	FBSession *session;
}
@end

@interface FBStreamCallback : FBDialogCallback {
	NSString *title;
	NSString *data;
	NSString *targetId;
	FBSession *session;
}
@end

/**
 * @tiapi(method=True,name=Facebook.isLoggedIn,since=0.7) returns true if the user is logged in
 * @tiresult(for=Facebook.isLoggedIn,type=boolean) returns true if logged in, false if not
 */

/**
 * @tiapi(method=True,name=Facebook.getUserId,since=0.7) returns the unique user id for the logged in user or null if not logged in
 * @tiresult(for=Facebook.getUserId,type=integer) returns the unique user id for the logged in user or null if not logged in
 */

/**
 * @tiapi(method=True,name=Facebook.setup,since=0.7) initialize the facebook connection session
 * @tiarg(for=Facebook.setup,type=string,name=apikey) facebook application api key
 * @tiarg(for=Facebook.setup,type=string,name=secret) facebook application secret
 */

/**
 * @tiapi(method=True,name=Facebook.login,since=0.7) login to facebook - which will cause login dialog to show if necessary
 * @tiarg(for=Facebook.login,type=function,name=callback) callback function to be invoked when completed with result object
 */

/**
 * @tiapi(method=True,name=Facebook.logout,since=0.7) logout of facebook and remove any session data
 * @tiarg(for=Facebook.logout,type=function,name=callback) callback function to be invoked when completed
 */

/**
 * @tiapi(method=True,name=Facebook.query,since=0.7) invoke facebook FQL query (must be logged in)
 * @tiarg(for=Facebook.query,type=string,name=fql) fql
 * @tiarg(for=Facebook.query,type=function,name=callback) callback function to be invoked with result of query
 */

/**
 * @tiapi(method=True,name=Facebook.hasPermission,since=0.7) returns true if user has permission (must be logged in)
 * @tiarg(for=Facebook.hasPermission,type=string,name=permission) permission name
 * @tiresult(for=Facebook.hasPermission,type=boolean) returns true if user has permission, false if not
 */

/**
 * @tiapi(method=True,name=Facebook.getPermissions,since=0.7) get all the user permissions (must be logged in)
 * @tiresult(for=Facebook.getPermissions,type=object) returns hash contains key/value pairs for each permission or null if no permissions
 */

/**
 * @tiapi(method=True,name=Facebook.requestPermission,since=0.7) invoke facebook FQL query (must be logged in)
 * @tiarg(for=Facebook.requestPermission,type=string,name=permission) permission requesting
 * @tiarg(for=Facebook.requestPermission,type=function,name=callback) callback function to be invoked with result of permission request
 */

/**
 * @tiapi(method=True,name=Facebook.publishFeed,since=0.7) publish feed to users wall invoking feed dialog
 * @tiarg(for=Facebook.publishFeed,type=integer,name=templateId) application template id
 * @tiarg(for=Facebook.publishFeed,type=object,name=templateData,optional=True) template data as json object
 * @tiarg(for=Facebook.publishFeed,type=string,name=body,optional=True) body of feed
 * @tiarg(for=Facebook.publishFeed,type=function,name=callback) callback function to be invoked with result of publish
 */

/**
 * @tiapi(method=True,name=Facebook.createLoginButton,since=0.7) create facebook login/logout button (will auto login)
 * @tiarg(for=Facebook.createLoginButton,type=object,name=properties) properties such as id (required), style (optional), apikey (optional), secret (optional)
 * @tiresult(for=Facebook.createLoginButton,type=object) returns button instance
 */

/**
 * @tiapi(method=True,name=Facebook.publishStream,since=0.8) publish stream dialog for publishing data to wall
 * @tiarg(for=Facebook.publishStream,type=string,name=title) title of publish stream dialog
 * @tiarg(for=Facebook.publishStream,type=object,name=data,optional=True) publish data as json object
 * @tiarg(for=Facebook.publishStream,type=string,name=targetId,optional=True) targetId if related to a specific user
 * @tiarg(for=Facebook.publishStream,type=function,name=callback) callback function to be invoked with result
 */
