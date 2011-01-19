/**
 * Appcelerator Commercial License. Copyright (c) 2010 by Appcelerator, Inc.
 *
 * Appcelerator Titanium is Copyright (c) 2009-2010 by Appcelerator, Inc.
 * and licensed under the Apache Public License (version 2)
 */
#ifdef USE_TI_FACEBOOK
#import "FacebookModule.h"
#import "TiBase.h"
#import "TiHost.h"
#import "TiBlob.h"
#import "TiUtils.h"
#import "TiApp.h"
#import "FBConnect/Facebook.h"
#import "TiFacebookRequest.h"
#import "TiFacebookDialogRequest.h"
#import "TiFacebookLoginButtonProxy.h"

/**
 * Good reference for access_tokens and what all this crap means
 * http://benbiddington.wordpress.com/2010/04/23/facebook-graph-api-getting-access-tokens/
 */

@implementation FacebookModule

@synthesize facebook;

#pragma mark Internal

// this is generated for your module, please do not change it
-(id)moduleGUID
{
	return @"3d301561-c8b7-40a4-b57e-0367d2e32691";
}

// this is generated for your module, please do not change it
-(NSString*)moduleId
{
	return @"facebook";
}

#pragma mark Sessions

-(void)_save 
{
	NSLog(@"[DEBUG] facebook _save");
	NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
	if ((uid != (NSString *) [NSNull null]) && (uid.length > 0)) {
		[defaults setObject:uid forKey:@"FBUserId"];
	} else {
		[defaults removeObjectForKey:@"FBUserId"];
	}
	
	NSString *access_token = facebook.accessToken;
	if ((access_token != (NSString *) [NSNull null]) && (access_token.length > 0)) {
		[defaults setObject:access_token forKey:@"FBAccessToken"];
	} else {
		[defaults removeObjectForKey:@"FBAccessToken"];
	}
	
	NSDate *expirationDate = facebook.expirationDate;  
	if (expirationDate) {
		[defaults setObject:expirationDate forKey:@"FBSessionExpires"];
	} else {
		[defaults removeObjectForKey:@"FBSessionExpires"];
	}
	
	if (appid) {
		[defaults setObject:appid forKey:@"FBAppId"];
	}else {
		[defaults removeObjectForKey:@"FBAppId"];
	}
	
	[defaults synchronize];
}

-(void)_unsave 
{
	NSLog(@"[DEBUG] facebook _unsave");
	NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
	[defaults removeObjectForKey:@"FBUserId"];
	[defaults removeObjectForKey:@"FBAccessToken"];
	[defaults removeObjectForKey:@"FBSessionExpires"];
	[defaults removeObjectForKey:@"FBAppId"];
	[defaults synchronize]; 
}

-(id)_restore 
{
	NSLog(@"[DEBUG] facebook _restore");
	RELEASE_TO_NIL(uid);
	RELEASE_TO_NIL(facebook);
	RELEASE_TO_NIL(appid);
	NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
	NSString *uid_ = [defaults objectForKey:@"FBUserId"];
	NSLog(@"[DEBUG] facebook _restore, uid = %@",uid_);
	facebook = [[Facebook alloc] init];
	if (uid_) 
	{
		NSDate* expirationDate = [defaults objectForKey:@"FBSessionExpires"];
		NSLog(@"[DEBUG] facebook _restore, expirationDate = %@",expirationDate);
		if (!expirationDate || [expirationDate timeIntervalSinceNow] > 0) {
			uid = [uid_ copy];
			facebook.accessToken = [defaults stringForKey:@"FBAccessToken"];
			facebook.expirationDate = expirationDate;
			loggedIn = YES;
			appid = [[defaults stringForKey:@"FBAppId"] copy];
			[self performSelector:@selector(fbDidLogin)];
		}
	}
	return facebook;
}

#pragma mark Lifecycle

-(void)dealloc
{
	RELEASE_TO_NIL(facebook);
	RELEASE_TO_NIL(stateListeners);
	RELEASE_TO_NIL(appid);
	RELEASE_TO_NIL(permissions);
	RELEASE_TO_NIL(uid);
	[super dealloc];
}

-(BOOL)handleRelaunch
{
	NSDictionary *launchOptions = [[TiApp app] launchOptions];
	if (launchOptions!=nil)
	{
		NSString *urlString = [launchOptions objectForKey:@"url"];
		if (urlString!=nil && [urlString hasPrefix:@"fb"])
		{
			// if we're resuming under the same URL, we need to ignore
			if (url!=nil && [urlString isEqualToString:url])
			{
				return YES;
			}
			RELEASE_TO_NIL(url);
			url = [urlString copy];
			[facebook handleOpenURL:[NSURL URLWithString:urlString]];
			return YES;
		}
	}
	return NO;
}

-(void)resumed:(id)note
{
	NSLog(@"[DEBUG] facebook resumed");
	
	[self handleRelaunch];
}

-(void)startup
{
	NSLog(@"[DEBUG] facebook startup");
	
	[super startup];
	[self _restore];
	[self handleRelaunch];
}

-(void)shutdown:(id)sender
{
	NSLog(@"[DEBUG] facebook shutdown");

	[[NSNotificationCenter defaultCenter] removeObserver:self];
	[super shutdown:sender];
}

-(BOOL)isLoggedIn
{
	return (facebook!=nil) && ([facebook isSessionValid]) && loggedIn;
}

#pragma mark Public APIs

/**
 * JS example:
 *
 * var facebook = require('facebook');
 * alert(facebook.uid);
 * 
 */
-(id)uid
{
	return uid;
}

/**
 * JS example:
 *
 * var facebook = require('facebook');
 * if (facebook.loggedIn) {
 * }
 * 
 */
-(id)loggedIn
{
	return NUMBOOL([self isLoggedIn]);
}

/**
 * JS example:
 *
 * var facebook = require('facebook');
 * facebook.appid = '1234';
 * alert(facebook.appid);
 * 
 */
-(id)appid
{
	return appid;
}

/**
 * JS example:
 *
 * var facebook = require('facebook');
 * facebook.permissions = ['publish_stream'];
 * alert(facebook.permissions);
 * 
 */
-(id)permissions
{
	return permissions;
}

/**
 * JS example:
 *
 * var facebook = require('facebook');
 * alert(facebook.accessToken);
 * 
 */
-(id)accessToken
{
	return [facebook accessToken];
}

/**
 * JS example:
 *
 * var facebook = require('facebook');
 * alert(facebook.expirationDate);
 * 
 */
-(id)expirationDate
{
	return [facebook expirationDate];
}

/**
 * JS example:
 *
 * var facebook = require('facebook');
 * facebook.appid = '1234';
 * alert(facebook.appid);
 * 
 */
-(void)setAppid:(id)arg
{
	RELEASE_TO_NIL(appid);
	appid = [arg copy];
}

/**
 * JS example:
 *
 * var facebook = require('facebook');
 * facebook.permissions = ['publish_stream'];
 * alert(facebook.permissions);
 * 
 */
-(void)setPermissions:(id)arg
{
	RELEASE_TO_NIL(permissions);
	permissions = [arg retain];
}

/**
 * JS example:
 *
 * var facebook = require('facebook');
 *
 * facebook.addEventListener('login',function(e) {
 *    if (e.success) {
 *		alert('login from uid: '+e.uid+', name: '+e.data.name);
 *    }
 *    else if (e.cancelled) {
 *      // user cancelled logout
 *    }
 *    else {
 *      alert(e.error);
 *    }
 * });
 * 
 * facebook.addEventListener('logout',function(e) {
 *    alert('logged out');
 * });
 * 
 * facebook.appid = 'my_appid';
 * facebook.permissions = ['publish_stream'];
 * facebook.authorize();
 *
 */
-(void)authorize:(id)args
{
	NSLog(@"[DEBUG] facebook authorize");

	if ([self isLoggedIn])
	{
		// if already authorized, this should do nothing
		return;
	}
	
	if (appid==nil)
	{
		[self throwException:@"missing appid" subreason:nil location:CODELOCATION];
	}
	
	// forget in case it fails
	[self _unsave];
	
	NSArray *permissions_ = permissions == nil ? [NSArray array] : permissions;
	[facebook authorize:appid permissions:permissions_ delegate:self];
}

/**
 * JS example:
 *
 * var facebook = require('facebook');
 * facebook.logout();
 *
 */
-(void)logout:(id)args
{
	NSLog(@"[DEBUG] facebook logout");
	if ([self isLoggedIn])
	{
		[facebook logout:self];
	}
}

/**
 * JS example:
 *
 * var facebook = require('facebook');
 *
 * facebook.requestWithGraphPath('me',{},function(e) {
 *    if (e.success) {
 *      alert('success! welcome userid: '+e.id);
 *    }
 *    else {
 *      alert(e.error);
 *    }
 * });
 *
 */
-(void)requestWithGraphPath:(id)args
{
	NSLog(@"[DEBUG] facebook requestWithGraphPath");

	ENSURE_ARG_COUNT(args,3);
	ENSURE_UI_THREAD_1_ARG(args);
	
	NSString* path = [args objectAtIndex:0];
	NSMutableDictionary* params = [args objectAtIndex:1];
	KrollCallback* callback = [args objectAtIndex:2];

	TiFacebookRequest* delegate = [[[TiFacebookRequest alloc] initWithPath:path callback:callback module:self graph:YES] autorelease];
	[facebook requestWithGraphPath:path andParams:params andDelegate:delegate];
}

/**
 * JS example:
 *
 * var facebook = require('facebook');
 *
 * facebook.request('photos.upload',{picture:blob},function(e) {
 *    if (e.success) {
 *      alert('success!');
 *    }
 *    else {
 *      alert(e.error);
 *    }
 * });
 *
 */
-(void)request:(id)args
{
	NSLog(@"[DEBUG] facebook request");

	ENSURE_ARG_COUNT(args,3);
	ENSURE_UI_THREAD_1_ARG(args);
	
	NSString* method = [args objectAtIndex:0];
	NSMutableDictionary* params = [args objectAtIndex:1];
	KrollCallback* callback = [args objectAtIndex:2];
	
	NSString *httpMethod = @"GET";
	
	for (NSString *key in [params allKeys])
	{
		id param = [params objectForKey:key];

		// convert to blob
		if ([param isKindOfClass:[TiFile class]])
		{
			TiFile *file = (TiFile*)param;
			if ([file size] > 0)
			{
				param = [file toBlob:nil];
			}
			else 
			{
				// empty file?
				param = [[[TiBlob alloc] initWithData:[NSData data] mimetype:@"text/plain"] autorelease];
			}
		}
		
		// this is an attachment, we need to convert to POST and switch to blob
		if ([param isKindOfClass:[TiBlob class]])
		{
			httpMethod = @"POST";
			TiBlob *blob = (TiBlob*)param;
			NSLog(@"[DEBUG] detected blob with mime: %@",[blob mimeType]);
			if ([[blob mimeType] hasPrefix:@"image/"])
			{
				UIImage *image = [blob image];
				[params setObject:image forKey:key];
			}
			else
			{
				NSData *data = [blob data];
				[params setObject:data forKey:key];
			}
		}
	}
	
	TiFacebookRequest* delegate = [[[TiFacebookRequest alloc] initWithPath:method callback:callback module:self graph:NO] autorelease];
	[facebook requestWithMethodName:method andParams:params andHttpMethod:httpMethod andDelegate:delegate];
}

/**
 * JS example:
 *
 * var facebook = require('facebook');
 * facebook.dialog('stream.publish',{'api_key':'1234'},function(e) {
 *    if (e.success) {
 *       Ti.API.info('result was = '+JSON.stringify(e.result));
 *    }
 * });
 * 
 */
-(void)dialog:(id)args
{
	ENSURE_ARG_COUNT(args,3);
	ENSURE_UI_THREAD_1_ARG(args);

	NSLog(@"[DEBUG] facebook dialog");

	NSString* action = [args objectAtIndex:0];
	NSMutableDictionary* params = [args objectAtIndex:1];
	KrollCallback* callback = [args objectAtIndex:2];
	
	TiFacebookDialogRequest *delegate = [[[TiFacebookDialogRequest alloc] initWithCallback:callback module:self] autorelease];
	[facebook dialog:action andParams:params andDelegate:delegate];
}

/**
 * JS example:
 *
 * var facebook = require('facebook');
 * var button = facebook.createLoginButton({bottom:10});
 * window.add(button);
 * 
 */
-(id)createLoginButton:(id)args
{
	return [[[TiFacebookLoginButtonProxy alloc] initWithModule:self] autorelease];
}

#pragma mark Listener work

-(void)fireLoginChange
{
	if (stateListeners!=nil)
	{
		for (id<TiFacebookStateListener> listener in [NSArray arrayWithArray:stateListeners])
		{
			if (loggedIn)
			{
				[listener login];
			}
			else 
			{
				[listener logout];
			}
		}
	}
}


#pragma mark Delegate

/**
 * Called when the user successfully logged in.
 */
- (void)fbDidLogin
{
	NSLog(@"[DEBUG] facebook fbDidLogin");

	[facebook requestWithGraphPath:@"me" andDelegate:self];
}

/**
 * Called when the user dismissed the dialog without logging in.
 */
- (void)fbDidNotLogin:(BOOL)cancelled
{
	NSLog(@"[DEBUG] facebook fbDidNotLogin: cancelled=%d",cancelled);
	loggedIn = NO;
	[self fireLoginChange];
	NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(cancelled),@"cancelled",NUMBOOL(NO),@"success",nil];
	[self fireEvent:@"login" withObject:event];
}

/**
 * Called when the user logged out.
 */
- (void)fbDidLogout
{
	NSLog(@"[DEBUG] facebook fbDidLogout");
	
	loggedIn = NO;
	[self _unsave];
	[self fireLoginChange];
	[self fireEvent:@"logout"];
}

//----------- these are only used when the login is successful to grab UID

/**
 * FBRequestDelegate
 */
- (void)request:(FBRequest2*)request didLoad:(id)result
{
	NSLog(@"[DEBUG] facebook didLoad");
	
	RELEASE_TO_NIL(uid);
	uid = [[result objectForKey:@"id"] copy]; 
	[self _save];
	loggedIn = YES;
	[self fireLoginChange];
	NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(NO),@"cancelled",NUMBOOL(YES),@"success",uid,@"uid",result,@"data",nil];
	[self fireEvent:@"login" withObject:event];
}


- (void)request:(FBRequest2*)request didFailWithError:(NSError*)error 
{
	NSLog(@"[DEBUG] facebook didFailWithError: %@",error);
	
	RELEASE_TO_NIL(uid);
	loggedIn = NO;
	[self fireLoginChange];
	NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(NO),@"cancelled",NUMBOOL(NO),@"success",error,@"error",nil];
	[self fireEvent:@"login" withObject:event];
}

#pragma mark Listeners

-(void)addListener:(id<TiFacebookStateListener>)listener
{
	if (stateListeners==nil)
	{
		stateListeners = [[NSMutableArray alloc]init];
	}
	[stateListeners addObject:listener];
}

-(void)removeListener:(id<TiFacebookStateListener>)listener
{
	if (stateListeners!=nil)
	{
		[stateListeners removeObject:listener];
		if ([stateListeners count]==0)
		{
			RELEASE_TO_NIL(stateListeners);
		}
	}
}

@end
#endif