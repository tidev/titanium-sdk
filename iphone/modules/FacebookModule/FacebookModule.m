/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <TitaniumModule.h>
#import <TitaniumBasicModule.h>
#import "FacebookModule.h"
#import "FBConnect.h"
#import <TitaniumBlobWrapper.h>
#import "AnalyticsModule.h"


@implementation FBDialogCallback

- (id)initWithToken:(NSString*)token_ pageToken:(NSString*)pageToken_ module:(FacebookModule*)module_ prefix:(NSString*)prefix_
{
	if (self = [super init])
	{
		token = [token_ retain];
		pageToken = [pageToken_ retain];
		module = [module_ retain];
		prefix = [prefix_ retain];
	}
	return self;
}

- (void)dealloc
{
	[token release];
	[pageToken release];
	[module release];
	[dialog release];
	[prefix release];
	[super dealloc];
}

- (void)dialogDidSucceed:(FBDialog*)dialog_
{
	NSLog(@"[DEBUG] Facebook dialogDidSuccess = %@",prefix);
	NSDictionary *dictionary = [NSDictionary dictionaryWithObjectsAndKeys:[NSNull null],@"error",[NSNumber numberWithBool:true],@"success",[NSNumber numberWithBool:false],@"cancel",@"permission",@"event",nil];
	[module evaluateJavascript:[NSString stringWithFormat:@"Ti.Facebook._%@['%@'](%@); delete Ti.Facebook._%@['%@'];",prefix,token,[module toJSON:dictionary],prefix,token] token:pageToken];
	[self autorelease];
}

- (void)dialogDidCancel:(FBDialog*)dialog_
{
	NSLog(@"[DEBUG] Facebook dialogDidCancel = %@",prefix);
	NSDictionary *dictionary = [NSDictionary dictionaryWithObjectsAndKeys:[NSNull null],@"error",[NSNumber numberWithBool:false],@"success",[NSNumber numberWithBool:true],@"cancel",@"permission",@"event",nil];
	[module evaluateJavascript:[NSString stringWithFormat:@"Ti.Facebook._%@['%@'](%@); delete Ti.Facebook._%@['%@'];",prefix,token,[module toJSON:dictionary],prefix,token] token:pageToken];
	[self autorelease];
}

- (void)dialog:(FBDialog*)dialog_ didFailWithError:(NSError*)error
{
	NSLog(@"[ERROR] Facebook dialog failed with error = %@",[error description]);
	NSDictionary *dictionary = [NSDictionary dictionaryWithObjectsAndKeys:[error description],@"error",[NSNumber numberWithBool:false],@"success",[NSNumber numberWithBool:false],@"cancel",@"permission",@"event",nil];
	[module evaluateJavascript:[NSString stringWithFormat:@"Ti.Facebook._%@['%@'](%@); delete Ti.Facebook._%@['%@'];",prefix,token,[module toJSON:dictionary],prefix,token] token:pageToken];
	[self autorelease];
}

- (FBDialog*)create
{
	return nil;
}

- (void)show
{
	dialog = [self create];
	dialog.delegate = self;
	[dialog show];
}

@end

@implementation FBPermissionPrefetch

- (id)initWithModule:(FacebookModule*)module_
{
	if (self = [super init])
	{
		module = [module_ retain];
	}
	return self;
}

- (void)dealloc
{
	[module release];
	[super dealloc];
}

- (void)request:(FBRequest*)request didLoad:(id)result
{
	if ([result isKindOfClass:[NSArray class]])
	{
		NSArray *a = result;
		if ([a count] > 0)
		{
			[module setPermissions:(NSDictionary*)[a objectAtIndex:0]];
		}
		else
		{
			[module setPermissions:[NSDictionary dictionary]];
		}
	}
	[self autorelease];
}

@end

@implementation FBRequestCallback

@synthesize data;

- (id)initWithToken:(NSString*)token_ pageToken:(NSString*)pageToken_ module:(FacebookModule*)module_ prefix:(NSString*)prefix_
{
	if (self = [super init])
	{
		token = [token_ retain];
		pageToken = [pageToken_ retain];
		module = [module_ retain];
		prefix = [prefix_ retain];
	}
	return self;
}

- (void)dealloc
{
	[token release];
	[pageToken release];
	[module release];
	[prefix release];
	[data release];
	[super dealloc]; 
}

- (void)request:(FBRequest*)request didLoad:(id)result
{
#ifdef VERBOSE_LOG
	NSLog(@"[DEBUG] Facebook result = (%@) %@",[result class],result);
#endif
	
	if (result == nil)
	{
		result = [NSNull null];
	}
	else if ([result isKindOfClass:[NSNumber class]])
	{
		result = [NSDictionary dictionaryWithObjectsAndKeys:result,@"success",nil];
	}
	else if ([result isKindOfClass:[NSString class]])
	{
		result = [module fromJSON:result];
	}
	NSDictionary *dictionary = [NSDictionary dictionaryWithObjectsAndKeys:result,@"data",[NSNumber numberWithBool:true],@"success",nil];
	NSString *json = [module toJSON:dictionary];
	[module evaluateJavascript:[NSString stringWithFormat:@"try{Ti.Facebook._%@['%@'](%@);}catch(X){Ti.API.error('Error:'+X);}; delete Ti.Facebook._%@['%@'];",prefix,token,json,prefix,token] token:pageToken];
	[self autorelease];
}

- (void)request:(FBRequest*)request didFailWithError:(NSError*)error
{
	NSLog(@"[ERROR] Facebook request failed. %@",error);
	NSDictionary *dictionary = [NSDictionary dictionaryWithObjectsAndKeys:[error description],@"error",[NSNumber numberWithBool:false],@"success",nil];
	[module evaluateJavascript:[NSString stringWithFormat:@"try{Ti.Facebook._%@['%@'](%@);}catch(X){}; delete Ti.Facebook._%@['%@'];",prefix,token,[module toJSON:dictionary],prefix,token] token:pageToken];
	[self autorelease];
}

@end

@implementation FBPermissionCallback

- (id)initWithToken:(NSString*)token_ pageToken:(NSString*)pageToken_ module:(FacebookModule*)module_ permission:(NSString*) permission_
{
	if (self = [super initWithToken:token_ pageToken:pageToken_ module:module_ prefix:@"PCB"])
	{
		permission = [permission_ retain];
	}
	return self;
}

- (void)dealloc
{
	[permission release];
	[super dealloc];
}

- (FBDialog*)create
{
	FBPermissionDialog *dialog_ = [[FBPermissionDialog alloc] init];
	dialog_.permission = permission;
	return dialog_;
}

- (void)dialogDidSucceed:(FBDialog*)dialog_
{
	NSLog(@"[DEBUG] we received a permission grant for %@",permission);
	[module addPermission:permission value:[NSNumber numberWithBool:true]];
	[super dialogDidSucceed:dialog_];
}

@end

@implementation FBFeedCallback

- (id)initWithToken:(NSString*)token_ pageToken:(NSString*)pageToken_ module:(FacebookModule*)module_ templateBundleId:(NSNumber*) templateBundleId_ templateData:(NSString*)templateData_ body:(NSString*)body_ session:(FBSession*)session_
{
	if (self = [super initWithToken:token_ pageToken:pageToken_ module:module_ prefix:@"FCB"])
	{
		templateBundleId = [templateBundleId_ copy];
		templateData = [templateData_ copy];
		body = [body_ copy];
		session = [session_ retain];
	}
	return self;
}

- (void)dealloc
{
	[templateBundleId release];
	[templateData release];
	[body release];
	[session release];
	[super dealloc];
}

- (FBDialog*)create
{
	FBFeedDialog* dialog_ = [[FBFeedDialog alloc] initWithSession:session];
	dialog_.templateBundleId = [templateBundleId longLongValue];
	dialog_.templateData = templateData;
	dialog_.bodyGeneral = body;
	return dialog_;
}

@end

@implementation FBStreamCallback

- (id)initWithToken:(NSString*)token_ pageToken:(NSString*)pageToken_ module:(FacebookModule*)module_ title:(NSString*)title_ data:(NSString*)data_ target:(NSString*)target_ session:(FBSession*)session_
{
	if (self = [super initWithToken:token_ pageToken:pageToken_ module:module_ prefix:@"STM"])
	{
		title = [title_ copy];
		if (![data_ isKindOfClass:[NSNull class]])
		{
			data = [data_ copy];
		}
		if (![target_ isKindOfClass:[NSNull class]])
		{
			targetId = [target_ copy];
		}
		session = [session_ retain];
	}
	return self;
}

- (void)dealloc
{
	[title release];
	[data release];
	[targetId release];
	[session release];
	[super dealloc];
}

- (FBDialog*)create
{
	FBStreamDialog* dialog_ = [[FBStreamDialog alloc] init];
	dialog_.userMessagePrompt = title;
	if (data != nil)
	{
		dialog_.attachment = data;
	}
	if (targetId != nil)
	{
		dialog_.targetId = targetId;
	}
	return dialog_;
}
@end

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

@implementation FacebookModule

- (void)dealloc
{
	[pendingPermission release];
	[pendingQueryId release];
	[permissions release];
	[lock release];
	[super dealloc];
}

- (void)dialogDidCancel:(FBDialog*)dialog_
{
	NSLog(@"[DEBUG] Facebook dialog did cancel");
	NSDictionary *dictionary_ = [NSDictionary dictionaryWithObjectsAndKeys:[NSNull null],@"error",[NSNumber numberWithBool:false],@"success",[NSNumber numberWithBool:true],@"cancel",@"login",@"event",nil];
	[self evaluateJavascript:[NSString stringWithFormat:@"Ti.Facebook._LSC(%@)",[self toJSON:dictionary_]] token:nil];
	[dialog release];
	dialog = nil;
}

- (void)dialog:(FBDialog*)dialog_ didFailWithError:(NSError*)error
{
	NSLog(@"[ERROR] Facebook dialog did fail with error = %@",error);
	NSDictionary *dictionary_ = [NSDictionary dictionaryWithObjectsAndKeys:[error description],@"error",[NSNumber numberWithBool:false],@"success",[NSNumber numberWithBool:false],@"cancel",@"login",@"event",nil];
	[self evaluateJavascript:[NSString stringWithFormat:@"Ti.Facebook._LSC(%@)",[self toJSON:dictionary_]] token:nil];
	[dialog release];
	dialog = nil;
}

- (void)session:(FBSession*)session didLogin:(FBUID)uid 
{
	NSLog(@"[DEBUG] Facebook session login");
	[self fetchPermissions];
	NSDictionary *dictionary_ = [NSDictionary dictionaryWithObjectsAndKeys:[NSNull null],@"error",[NSNumber numberWithBool:true],@"success",[NSNumber numberWithBool:false],@"cancel",@"login",@"event",nil];
	[self evaluateJavascript:[NSString stringWithFormat:@"Ti.Facebook._LSC(%@)",[self toJSON:dictionary_]] token:nil];
	[dialog release];
	dialog = nil;

	AnalyticsModule *module = (AnalyticsModule*)[[TitaniumHost sharedHost] moduleNamed:@"AnalyticsModule"];
	if (module!=nil){
		[module enqueuePlatformEvent:@"app.feature" evtname:@"tiSocial.Facebook.login" data:nil];
	}
}

- (void)sessionDidLogout:(FBSession*)session_ 
{
	NSLog(@"[DEBUG] Facebook session logout");
	NSDictionary *dictionary_ = [NSDictionary dictionaryWithObjectsAndKeys:[NSNull null],@"error",[NSNumber numberWithBool:true],@"success",[NSNumber numberWithBool:false],@"cancel",@"logout",@"event",nil];
	[self evaluateJavascript:[NSString stringWithFormat:@"Ti.Facebook._LSC(%@)",[self toJSON:dictionary_]] token:nil];
	[permissions release];
	permissions = nil;

	AnalyticsModule *module = (AnalyticsModule*)[[TitaniumHost sharedHost] moduleNamed:@"AnalyticsModule"];
	if (module!=nil){
		[module enqueuePlatformEvent:@"app.feature" evtname:@"tiSocial.Facebook.logout" data:nil];
	}
}

- (void)showDialog
{
   dialog = [[FBLoginDialog alloc] initWithSession:session];
   dialog.delegate = self;
   [dialog show];
}

- (void)login
{
	if (session!=nil && ([session expirationDate]==nil || [session resume]==NO))
	{
		[self performSelectorOnMainThread:@selector(showDialog) withObject:nil waitUntilDone:NO];
	}
	else if (session!=nil)
	{
		[self fetchPermissions];
	}
}

- (void)logout 
{
	if (session!=nil)
	{
		[session logout];
	}
	if (permissions!=nil)
	{
		[lock lock];
		[permissions release];
		permissions = nil;
		// remove the permissions from cache
		NSUserDefaults *def = [NSUserDefaults standardUserDefaults];
		[def removeObjectForKey:@"FacebookPermissions"];
		[def synchronize];
		[lock unlock];
	}
}

- (NSNumber*)loggedIn
{
	if (session!=nil)
	{
		return [NSNumber numberWithBool:[session isConnected]];
	}
	return [NSNumber numberWithBool:NO];
}

- (NSNumber*)userId
{
	if (session!=nil)
	{
		return [NSNumber numberWithLongLong:[session uid]];
	}
	return [NSNumber numberWithLong:0];
}

- (void)query:(NSString*)fql queryId:(NSString*)queryId
{
  	NSDictionary* params = [NSDictionary dictionaryWithObject:fql forKey:@"query"];
	FBRequestCallback *cb = [[FBRequestCallback alloc] initWithToken:queryId pageToken:[self getPageToken] module:self prefix:@"QCB"];
  	[[FBRequest requestWithDelegate:cb] call:@"facebook.fql.query" params:params];
}

- (void)showDialog:(FBDialogCallback*)dialog_
{
	[dialog_ show];
}

- (void)fetchPermissions
{
	[lock lock];
	// only fetch if we don't have them cached
	if (permissions==nil)
	{
		pendingPermissions = YES;
	  	NSDictionary* params = [NSDictionary dictionaryWithObject:[NSString stringWithFormat:@"select status_update,photo_upload,sms,create_listing,email,create_event,rsvp_event,publish_stream,read_stream,share_item,create_note from permissions where uid = %@",[self userId]] forKey:@"query"];
		FBPermissionPrefetch *prefetch = [[FBPermissionPrefetch alloc] initWithModule:self];
	  	[[FBRequest requestWithDelegate:prefetch] call:@"facebook.fql.query" params:params];
	}
	[lock unlock];
}

- (void)permission:(NSString*)perm queryId:(NSString*)queryId
{
	// first check to see if we already have the permission
	[lock lock];
	if (pendingPermissions==YES)
	{
		pendingPermission = [perm copy];
		pendingQueryId = [queryId copy];
		[lock unlock];
		return;
	}
	NSNumber *value = [permissions objectForKey:perm];
	if (value!=nil && [value respondsToSelector:@selector(boolValue)] && [value boolValue]==YES)
	{
		NSDictionary *dictionary_ = [NSDictionary dictionaryWithObjectsAndKeys:[NSNull null],@"error",[NSNumber numberWithBool:YES],@"success",[NSNumber numberWithBool:false],@"cancel",@"permission",@"event",perm,@"name",nil];
		[self evaluateJavascript:[NSString stringWithFormat:@"Ti.Facebook._%@['%@'](%@); delete Ti.Facebook._%@['%@'];",@"PCB",queryId,[self toJSON:dictionary_],@"PCB",queryId] token:nil];
	}
	else
	{
		FBPermissionCallback *cb = [[FBPermissionCallback alloc] initWithToken:queryId pageToken:[self getPageToken] module:self permission:perm];
		[self performSelectorOnMainThread:@selector(showDialog:) withObject:cb waitUntilDone:NO];
	}
	[lock unlock];
}

- (void)feed:(NSNumber*)templateBundleId data:(NSString*)templateData body:(NSString*)body_ queryId:(NSString*)queryId
{
	Class stringClass = [NSString class];
	if(![templateBundleId respondsToSelector:@selector(longLongValue)] || 
	      (templateData!=nil && ![templateData isKindOfClass:[NSNull class]] && ![templateData isKindOfClass:stringClass]) ||
			(body_!=nil && ![body_ isKindOfClass:[NSNull class]] && ![body_ isKindOfClass:stringClass]) || 
			![queryId isKindOfClass:stringClass])
	{
		//TODO: throw exceptions here
		NSLog(@"[ERROR] Facebook feed had invalid values. Feed: %@, data: %@, body: %@, queryId: %@",templateBundleId,templateData,body_,queryId);
		return;
	}
	
	FBFeedCallback *cb = [[FBFeedCallback alloc] initWithToken:queryId pageToken:[self getPageToken] module:self templateBundleId:templateBundleId templateData:templateData body:body_ session:session];
	[self performSelectorOnMainThread:@selector(showDialog:) withObject:cb waitUntilDone:NO];
	
	AnalyticsModule *module = (AnalyticsModule*)[[TitaniumHost sharedHost] moduleNamed:@"AnalyticsModule"];
	if (module!=nil)
	{
		[module enqueuePlatformEvent:@"app.feature" evtname:@"tiSocial.Facebook.publishFeed" data:nil];
	}
}

- (void)stream:(NSString*)title data:(NSString*)data target:(NSString*)target queryId:(NSString*)queryId
{
	FBStreamCallback *cb = [[FBStreamCallback alloc] initWithToken:queryId pageToken:[self getPageToken] module:self title:title data:data target:target session:session];
	[self performSelectorOnMainThread:@selector(showDialog:) withObject:cb waitUntilDone:NO];
	
	AnalyticsModule *module = (AnalyticsModule*)[[TitaniumHost sharedHost] moduleNamed:@"AnalyticsModule"];
	if (module!=nil)
	{
		[module enqueuePlatformEvent:@"app.feature" evtname:@"tiSocial.Facebook.publishStream" data:nil];
	}
}

- (void)setup:(NSString*)key secret:(NSString*)secret proxy:(NSString*)proxy
{
	Class stringClass = [NSString class];
	if(![key isKindOfClass:stringClass]){
		//TODO: throw exceptions here
		NSLog(@"[ERROR] Facebook setup had invalid values. Key: %@ secret: %@ proxy: %@",key,secret,proxy);
		return;
	}
	
	[permissions release];
	permissions = nil;

	// grab cached copy
	NSDictionary *dict = [[NSUserDefaults standardUserDefaults] dictionaryForKey:@"FacebookPermissions"];
	if (dict!=nil)
	{
		permissions = [dict retain];
	}

	[dialog release];
	dialog = nil;
	[session release];
	
	if ([proxy isKindOfClass:[NSString class]])
	{
		session = [[FBSession sessionForApplication:key getSessionProxy:proxy delegate:self] retain];
	}
	else 
	{
		session = [[FBSession sessionForApplication:key secret:secret delegate:self] retain];
	}
	
	if ([session resume]==NO)
	{
		[self logout];
	}
}

- (void)execute:(NSString*)method params:(NSDictionary*)params data:(id)data queryId:(NSString*)queryId
{
	NSData *dataParam = nil;
	NSString *filename = nil;
	
	if ([data isKindOfClass:[NSString class]])
	{
		NSURL *url = [[NSURL alloc] initWithString:data relativeToURL:[[TitaniumHost sharedHost] appBaseUrl]];
		dataParam = [NSData dataWithContentsOfURL:url];
		filename = [[url absoluteString] lastPathComponent];
		[url release];
	}
	else if ([data isKindOfClass:[TitaniumBlobWrapper class]])
	{
		dataParam = [(TitaniumBlobWrapper*)data dataBlob];
	}
	else if ([data isKindOfClass:[NSDictionary class]])
	{
		NSDictionary *d = (NSDictionary*)data;
		NSString *f = [d objectForKey:@"path"];
		if (f!=nil)
		{
			filename = [f lastPathComponent];
			NSError *error = nil;
			dataParam = [NSData dataWithContentsOfFile:f options:0 error:&error];
			if (error!=nil)
			{
				NSLog(@"error = %@",error);
			}
		}
	}
	
	FBRequestCallback *cb = [[FBRequestCallback alloc] initWithToken:queryId pageToken:[self getPageToken] module:self prefix:@"ECB"];
	cb.data = dataParam;
  	[[FBRequest requestWithDelegate:cb] call:method params:params dataParam:dataParam filename:filename];

	AnalyticsModule *module = (AnalyticsModule*)[[TitaniumHost sharedHost] moduleNamed:@"AnalyticsModule"];
	if (module!=nil)
	{
		if ([method isEqualToString:@"comments.add"])
		{[module enqueuePlatformEvent:@"app.feature" evtname:@"tiSocial.Facebook.commentsAdd" data:nil];}
		else if ([method isEqualToString:@"links.post"])
		{[module enqueuePlatformEvent:@"app.feature" evtname:@"tiSocial.Facebook.linksPost" data:nil];}
		else if ([method isEqualToString:@"notes.create"])
		{[module enqueuePlatformEvent:@"app.feature" evtname:@"tiSocial.Facebook.notesCreate" data:nil];}
		else if ([method isEqualToString:@"status.set"])
		{[module enqueuePlatformEvent:@"app.feature" evtname:@"tiSocial.Facebook.setStatus" data:nil];}
		else if ([method isEqualToString:@"users.setStatus"])
		{[module enqueuePlatformEvent:@"app.feature" evtname:@"tiSocial.Facebook.setStatus" data:nil];}
		else if ([method isEqualToString:@"stream.publish"])
		{[module enqueuePlatformEvent:@"app.feature" evtname:@"tiSocial.Facebook.streamPublish" data:nil];}
		else if ([method isEqualToString:@"video.upload"])
		{[module enqueuePlatformEvent:@"app.feature" evtname:@"tiSocial.Facebook.videoUpload" data:nil];}
		else if ([method isEqualToString:@"sms.send"])
		{[module enqueuePlatformEvent:@"app.feature" evtname:@"tiSocial.Facebook.smsSend" data:nil];}
		else if ([method isEqualToString:@"photos.addTag"])
		{[module enqueuePlatformEvent:@"app.feature" evtname:@"tiSocial.Facebook.photosAddTag" data:nil];}
		else if ([method isEqualToString:@"photos.createAlbum"])
		{[module enqueuePlatformEvent:@"app.feature" evtname:@"tiSocial.Facebook.photosCreateAlbum" data:nil];}
		else if ([method isEqualToString:@"photos.upload"])
		{[module enqueuePlatformEvent:@"app.feature" evtname:@"tiSocial.Facebook.photosUpload" data:nil];}
	}
}

- (NSString*)makeDialogJS:(NSString*)prefix
{
	return [NSString stringWithFormat:@"if(typeof(Ti.Facebook._%@)=='undefined'){Ti.Facebook._%@={};Ti.Facebook._%@I=0;};var i=String(Ti.Facebook._%@I++);Ti.Facebook._%@[i]=c;",prefix,prefix,prefix,prefix,prefix];
}

- (void)setPermissions:(NSDictionary *)dict
{
	[lock lock];
	[permissions release];

	permissions = [[NSMutableDictionary dictionaryWithDictionary:dict] retain];
	pendingPermissions = NO;
	
	// cache the permissions
	[[NSUserDefaults standardUserDefaults] setObject:dict forKey:@"FacebookPermissions"];
	
	NSLog(@"[DEBUG] setPermissions, pendingPermission: %@",pendingPermission);
	
	// if we have a pending permission, go ahead and re-invoke
	if (pendingPermission!=nil)
	{
		[self permission:pendingPermission queryId:pendingQueryId];
		[pendingPermission release];
		[pendingQueryId release];
		pendingPermission = nil;
		pendingQueryId = nil;
	}
	
	[lock unlock];
}

- (void)addPermission:(NSString*)permission value:(NSNumber*)value
{
	[lock lock];
	if (permission==nil)
	{
		permissions = [[NSMutableDictionary dictionaryWithCapacity:6] retain];
	}
	[permissions setValue:value forKey:permission];
	[[NSUserDefaults standardUserDefaults] setObject:permissions forKey:@"FacebookPermissions"];
	[lock unlock];
}	

- (NSNumber*)hasPermission:(NSString*)permission
{
	[lock lock];
	NSNumber *result = [NSNumber numberWithBool:NO];
	if (permissions!=nil)
	{
		NSNumber *value = [permissions objectForKey:permission];
		if (value!=nil && [value respondsToSelector:@selector(boolValue)] && [value boolValue])
		{
			result = [NSNumber numberWithBool:YES];
		}
	}
	[lock unlock];
	return result;
}

- (NSDictionary*)getPermissions
{
	return permissions;
}

- (NSArray*) moduleDependencies
{
	return [NSArray arrayWithObject:@"ui"];
}

- (void)configure
{
	lock = [[NSRecursiveLock alloc] init];
	pendingPermissions = NO;
	
	NSString *initJS = @"Ti.Facebook._LSC=function(a){if(Ti.Facebook._LIS){for(var c=0;c<Ti.Facebook._LIS.length;c++){try{Ti.Facebook._LIS[c](a)}catch(X){Titanium.API.error('error: '+X)}}}if(Ti.Facebook._CB){Ti.Facebook._CB(s);Ti.Facebook._CB=null}};Ti.Facebook._AL=function(l){if(typeof(Ti.Facebook._LIS)=='undefined'){Ti.Facebook._LIS=[]}Ti.Facebook._LIS.push(l)};";
	[self bindInitializer:initJS];
	
	// internal only methods (private)
	[self bindFunction:@"_LOGIN" method:@selector(login)];
	[self bindFunction:@"_LOGOUT" method:@selector(logout)];
	[self bindFunction:@"_QRY" method:@selector(query:queryId:)];
	[self bindFunction:@"_PERM" method:@selector(permission:queryId:)];
	[self bindFunction:@"_FEED" method:@selector(feed:data:body:queryId:)];
	[self bindFunction:@"_EXEC" method:@selector(execute:params:data:queryId:)];
	[self bindFunction:@"_STREAM" method:@selector(stream:data:target:queryId:)];
	
	// external methods (public)
	[self bindFunction:@"isLoggedIn" method:@selector(loggedIn)];
	[self bindFunction:@"getUserId" method:@selector(userId)];
	[self bindFunction:@"setup" method:@selector(setup:secret:proxy:)];
	[self bindFunction:@"hasPermission" method:@selector(hasPermission:)];
	[self bindFunction:@"getPermissions" method:@selector(getPermissions)];
		
	[self bindCode:@"login" code:@"function(c){ Ti.Facebook._CB = c; Ti.Facebook._LOGIN(); }"];
	[self bindCode:@"logout" code:@"function(c){ Ti.Facebook._CB = c; Ti.Facebook._LOGOUT(); }"];
	[self bindCode:@"query" code:[NSString stringWithFormat:@"function(q,c){ %@;Ti.Facebook._QRY(q,i); }",[self makeDialogJS:@"QCB"]]];
	[self bindCode:@"execute" code:[NSString stringWithFormat:@"function(m,d,c,data){ %@;Ti.Facebook._EXEC(m,d||{},data,i); }",[self makeDialogJS:@"ECB"]]];
	[self bindCode:@"createLoginButton" code:@"function(p){var t=document.getElementById(p.id);var s=p.style||'normal';var b=(s=='normal')?'':'2';var l=(Ti.Facebook.isLoggedIn()?'logout':'login');var d=document.createElement('button');d.style.border='none';var i=document.createElement('image');d.appendChild(i);i.src='app://modules/facebook/images/'+l+b+'.png';t.appendChild(d);var c=this;this._EVT={};d.onclick=function(){if(Ti.Facebook.isLoggedIn()){Ti.Facebook.logout(function(){Ti._ONEVT.apply(c,['logout'])})}else{Ti.Facebook.login(function(a){Ti._ONEVT.apply(c,['login',{success:a}])})}};if(typeof(Ti.Facebook._LIS)=='undefined'){Ti.Facebook._LIS=[]}Ti.Facebook._LIS.push(function(a){Ti._ONEVT.apply(c,[a.event,{success:true}]);Ti.API.debug('facebook js state changed -- event = '+a.event);if((a.event=='logout'||!a.success)&&!Ti.Facebook.isLoggedIn()){i.src='app://modules/facebook/images/login'+b+'.png'}else{i.src='app://modules/facebook/images/logout.png'}});Ti.Facebook.setup(p.apikey,p.secret,p.sessionProxy);return{addEventListener:function(a,b){Ti._ADDEVT.apply(c,[a,b])},removeEventListener:function(a,b){Ti._REMEVT.apply(c,[a,b])}}}"];
	[self bindCode:@"requestPermission" code:[NSString stringWithFormat:@"function(p,c){ %@;Ti.Facebook._PERM(p,i); }",[self makeDialogJS:@"PCB"]]];
	[self bindCode:@"publishFeed" code:[NSString stringWithFormat:@"function(id,data,body,c){ %@;Ti.Facebook._FEED(id,data?Ti._JSON(data):null,body,i); }",[self makeDialogJS:@"FCB"]]];
	[self bindCode:@"publishStream" code:[NSString stringWithFormat:@"function(title,data,target,c){ %@;Ti.Facebook._STREAM(title,Ti._JSON(data),target,i); }",[self makeDialogJS:@"STM"]]];
}

@end
