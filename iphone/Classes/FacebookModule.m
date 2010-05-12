/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_FACEBOOK

#import "TiBase.h"
#import "TiApp.h"
#import "FacebookModule.h"
#import "TiFacebookLoginButtonProxy.h"
#import "SBJSON.h"
#import "TiBlob.h"

@implementation FBDialogCallback

- (id)initWithCallback:(KrollCallback *)callback_ module:(FacebookModule*)module_
{
	if (self = [super init])
	{
		module = [module_ retain];
		callback = [callback_ retain];
	}
	return self;
}

- (void)dealloc
{
	RELEASE_TO_NIL(module);
	RELEASE_TO_NIL(callback);
	[super dealloc];
}

- (void)dialogDidSucceed:(FBDialog*)dialog_
{
	NSLog(@"[DEBUG] Facebook dialogDidSucceed");
	NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:[NSNull null],@"error",[NSNumber numberWithBool:true],@"success",[NSNumber numberWithBool:false],@"cancel",@"permission",@"event",nil];
	[module _fireEventToListener:@"permission" withObject:event listener:callback thisObject:nil];
	[self autorelease];
}

- (void)dialogDidCancel:(FBDialog*)dialog_
{
	NSLog(@"[DEBUG] Facebook dialogDidCancel");
	NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:[NSNull null],@"error",[NSNumber numberWithBool:false],@"success",[NSNumber numberWithBool:true],@"cancel",@"permission",@"event",nil];
	[module _fireEventToListener:@"permission" withObject:event listener:callback thisObject:nil];
	[self autorelease];
}

- (void)dialog:(FBDialog*)dialog_ didFailWithError:(NSError*)error
{
	NSLog(@"[ERROR] Facebook dialog failed with error = %@",[error description]);
	NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:[error description],@"error",[NSNumber numberWithBool:false],@"success",[NSNumber numberWithBool:false],@"cancel",@"permission",@"event",nil];
	[module _fireEventToListener:@"permission" withObject:event listener:callback thisObject:nil];
	[self autorelease];
}

- (FBDialog*)newDialog
{
	return nil;
}

- (void)show
{
	RELEASE_TO_NIL(dialog);
	dialog = [self newDialog];
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

- (id)initWithCallback:(KrollCallback*)callback_ module:(FacebookModule*)module_
{
	if (self = [super init])
	{
		module = [module_ retain];
		callback = [callback_ retain];
	}
	return self;
}

- (void)dealloc
{
	RELEASE_TO_NIL(module);
	RELEASE_TO_NIL(data);
	RELEASE_TO_NIL(callback);
	[super dealloc]; 
}

- (void)requestLoading:(FBRequest*)request
{
	[[TiApp app] startNetwork];
}

- (void)requestWasCancelled:(FBRequest*)request
{
	[[TiApp app] stopNetwork];
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
	NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:result,@"data",[NSNumber numberWithBool:true],@"success",nil];
	[module _fireEventToListener:@"query" withObject:event listener:callback thisObject:nil];
	[self autorelease];
	[[TiApp app] stopNetwork];
}

- (void)request:(FBRequest*)request didFailWithError:(NSError*)error
{
	NSLog(@"[ERROR] Facebook request failed. %@",error);
	NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:[error description],@"error",[NSNumber numberWithBool:false],@"success",nil];
	[module _fireEventToListener:@"query" withObject:event listener:callback thisObject:nil];
	[self autorelease];
	[[TiApp app] stopNetwork];
}

@end

@implementation FBPermissionCallback

- (id)initWithCallback:(KrollCallback*)callback_ module:(FacebookModule*)module_ permission:(NSString*) permission_
{
	if (self = [super initWithCallback:callback_ module:module_])
	{
		permission = [permission_ retain];
	}
	return self;
}

- (void)dealloc
{
	RELEASE_TO_NIL(permission);
	[super dealloc];
}

- (FBDialog*)newDialog
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

@implementation FBStreamCallback

- (id)initWithCallback:(KrollCallback *)callback_ module:(FacebookModule*)module_ title:(NSString*)title_ data:(NSString*)data_ target:(NSString*)target_ session:(FBSession*)session_
{
	if (self = [super initWithCallback:callback_ module:module_])
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
	RELEASE_TO_NIL(title);
	RELEASE_TO_NIL(data);
	RELEASE_TO_NIL(targetId);
	RELEASE_TO_NIL(session);
	[super dealloc];
}

- (FBDialog*)newDialog
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

#pragma mark Internal

- (void)dealloc
{
	RELEASE_TO_NIL(pendingPermission);
	RELEASE_TO_NIL(permissions);
	RELEASE_TO_NIL(lock);
	[super dealloc];
}

- (void)dialogDidCancel:(FBDialog*)dialog_
{
	NSLog(@"[DEBUG] Facebook dialog did cancel");
	if ([self _hasListeners:@"login"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:[NSNull null],@"error",[NSNumber numberWithBool:false],@"success",[NSNumber numberWithBool:true],@"cancel",@"login",@"event",nil];
		[self fireEvent:@"login" withObject:event];
	}
	RELEASE_TO_NIL(dialog);
}

- (void)dialog:(FBDialog*)dialog_ didFailWithError:(NSError*)error
{
	NSLog(@"[ERROR] Facebook dialog did fail with error = %@",error);
	if ([self _hasListeners:@"login"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:[error description],@"error",[NSNumber numberWithBool:false],@"success",[NSNumber numberWithBool:false],@"cancel",@"login",@"event",nil];
		[self fireEvent:@"login" withObject:event];
	}
	RELEASE_TO_NIL(dialog);
}

- (void)session:(FBSession*)session didLogin:(FBUID)uid 
{
	NSLog(@"[DEBUG] Facebook session login");
	[self fetchPermissions:nil];
	
	if ([self _hasListeners:@"login"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:[NSNull null],@"error",[NSNumber numberWithBool:true],@"success",[NSNumber numberWithBool:false],@"cancel",@"login",@"event",nil];
		[self fireEvent:@"login" withObject:event];
	}
	RELEASE_TO_NIL(dialog);
}

- (void)sessionDidLogout:(FBSession*)session_ 
{
	NSLog(@"[DEBUG] Facebook session logout");
	if ([self _hasListeners:@"logout"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:[NSNull null],@"error",[NSNumber numberWithBool:true],@"success",[NSNumber numberWithBool:false],@"cancel",@"logout",@"event",nil];
		[self fireEvent:@"logout" withObject:event];
	}
	RELEASE_TO_NIL(dialog);
}

- (void)showDialog
{
	RELEASE_TO_NIL(dialog);
	dialog = [[FBLoginDialog alloc] initWithSession:session];
	dialog.delegate = self;
	[dialog show];
}

- (void)showDialog:(FBDialogCallback*)dialog_
{
	[dialog_ show];
}

- (void)fetchPermissions:(id)arg
{
	ENSURE_UI_THREAD(fetchPermissions,nil);
	
	[lock lock];
	// only fetch if we don't have them cached
	if (permissions==nil)
	{
		pendingPermissions = YES;
	  	NSDictionary* params = [NSDictionary dictionaryWithObject:[NSString stringWithFormat:@"select status_update,photo_upload,sms,email,create_event,rsvp_event,publish_stream,read_stream,share_item,create_note from permissions where uid = %@",[self userId]] forKey:@"query"];
		FBPermissionPrefetch *prefetch = [[FBPermissionPrefetch alloc] initWithModule:self];
	  	[[FBRequest requestWithDelegate:prefetch] call:@"facebook.fql.query" params:params];
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

#pragma mark Public APIs

- (void)logout
{
	if (session!=nil)
	{
		[session logout];
	}
	if (permissions!=nil)
	{
		[lock lock];
		RELEASE_TO_NIL(permissions);
		RELEASE_TO_NIL(pendingPermission);
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
		return NUMBOOL([session isConnected]);
	}
	return NUMBOOL(NO);
}

- (NSNumber*)isLoggedIn:(id)args
{
	return [self loggedIn];
}

- (NSNumber*)userId
{
	if (session!=nil)
	{
		return [NSNumber numberWithUnsignedLongLong:[session uid]];
	}
	return NUMLONG(0);
}

- (void)query:(id)args
{
	ENSURE_ARG_COUNT(args,2);
	ENSURE_UI_THREAD(query,args);
	
	NSString *fql = [args objectAtIndex:0];
	KrollCallback *callback = [args objectAtIndex:1];
	
	ENSURE_TYPE(fql,NSString);
	ENSURE_TYPE(callback,KrollCallback);
	
  	NSDictionary* params = [NSDictionary dictionaryWithObject:fql forKey:@"query"];
	FBRequestCallback *cb = [[FBRequestCallback alloc] initWithCallback:callback module:self];
  	[[FBRequest requestWithDelegate:cb] call:@"facebook.fql.query" params:params];
}

- (void)publishStream:(id)args
{
	ENSURE_ARG_COUNT(args,4);
	
	NSString *title = [args objectAtIndex:0];
	NSString *data = [SBJSON stringify:[args objectAtIndex:1]];
	NSString *target = [TiUtils stringValue:[args objectAtIndex:2]];
	KrollCallback *callback = [args objectAtIndex:3];

	FBStreamCallback *cb = [[FBStreamCallback alloc] initWithCallback:callback module:self title:title data:data target:target session:session];
	[self performSelectorOnMainThread:@selector(showDialog:) withObject:cb waitUntilDone:NO];
}

- (void)execute:(id)args
{
	ENSURE_ARG_COUNT(args,4);
	ENSURE_UI_THREAD(execute,args);
	
	NSString *method = [args objectAtIndex:0];
	NSDictionary *params = [args objectAtIndex:1];
	KrollCallback *callback = [args objectAtIndex:2];
	id data = [args objectAtIndex:3];
	
	ENSURE_DICT(params);
	ENSURE_TYPE(callback,KrollCallback);
	
	NSData *dataParam = nil;
	NSString *filename = nil;
	
	if ([data isKindOfClass:[NSString class]])
	{
		NSURL *url = [TiUtils toURL:data proxy:self];
		dataParam = [NSData dataWithContentsOfURL:url];
		filename = [[url absoluteString] lastPathComponent];
	}
	else if ([data isKindOfClass:[TiBlob class]])
	{
		dataParam = [(TiBlob*)data data];
	}
	else if (data != nil && ![data isKindOfClass:[NSNull class]])
	{
		NSString *msg = [NSString stringWithFormat:@"data should either be a path, blob or null, was: %@",[data class]];
		THROW_INVALID_ARG(msg);
	}
	
	FBRequestCallback *cb = [[FBRequestCallback alloc] initWithCallback:callback module:self];
	cb.data = dataParam;
  	[[FBRequest requestWithDelegate:cb] call:method params:params dataParam:dataParam filename:filename];
}

- (void)setup:(NSString*)key secret:(NSString*)secret proxy:(NSString*)proxy
{
	RELEASE_TO_NIL(permissions);
	RELEASE_TO_NIL(dialog);
	RELEASE_TO_NIL(session);
	
	// grab cached copy
	NSDictionary *dict = [[NSUserDefaults standardUserDefaults] dictionaryForKey:@"FacebookPermissions"];
	if (dict!=nil)
	{
		permissions = [dict retain];
	}
	
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

- (void)setup:(id)args
{
	ENSURE_ARRAY(args);
	NSString *apikey = [args objectAtIndex:0];
	NSString *secret = [args objectAtIndex:1];
	NSString *sessionProxy = [args count] > 2 ? [args objectAtIndex:2] : nil;
	[self setup:apikey secret:secret proxy:sessionProxy];
}

- (id)createLoginButton:(id)args
{
	ENSURE_SINGLE_ARG_OR_NIL(args,NSDictionary);
			
	if (session==nil)
	{
		NSString *apikey = [args objectForKey:@"apikey"];	
		NSString *secret = [args objectForKey:@"secret"];	
		NSString *sessionProxy = [args objectForKey:@"sessionProxy"];	
		
		[self setup:apikey secret:secret proxy:sessionProxy];
	}	
	
	NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithDictionary:(args==nil?[NSDictionary dictionary]:args)];
	[dict setObject:session forKey:@"session"];
	
	return [[[TiFacebookLoginButtonProxy alloc] _initWithPageContext:[self pageContext] args:[NSArray arrayWithObject:dict]] autorelease];
}

-(void)requestPermission:(id)args
{
	ENSURE_ARG_COUNT(args,2);
	NSString *permission = [args objectAtIndex:0];
	KrollCallback *callback = [args objectAtIndex:1];
	ENSURE_TYPE(permission,NSString);
	ENSURE_TYPE(callback,KrollCallback);

	[lock lock];
	if (pendingPermissions==YES)
	{
		if (pendingPermission==nil)
		{
			pendingPermission = [[NSMutableArray array] retain];
		}
		[pendingPermission addObject:[NSArray arrayWithObjects:permission,callback,nil]];
		[lock unlock];
		return;
	}
	else
	{
		[lock unlock];
		NSNumber *value = [permissions objectForKey:permission];
		if ([TiUtils boolValue:value])
		{
			NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:[NSNull null],@"error",[NSNumber numberWithBool:YES],@"success",[NSNumber numberWithBool:false],@"cancel",@"permission",@"event",permission,@"name",nil];
			[self _fireEventToListener:@"permission" withObject:event listener:callback thisObject:nil];
		}
		else 
		{
			FBPermissionCallback *cb = [[FBPermissionCallback alloc] initWithCallback:callback module:self permission:permission];
			[self performSelectorOnMainThread:@selector(showDialog:) withObject:cb waitUntilDone:NO];
		}
		if ([self _hasListeners:@"permission"])
		{
			NSDictionary *event = [NSDictionary dictionaryWithObject:permissions forKey:@"permissions"];
			[self fireEvent:@"permission" withObject:event];
		}
	}
}

- (void)setPermissions:(NSDictionary *)dict
{
	[lock lock];
	[permissions release];
	
	permissions = [[NSMutableDictionary dictionaryWithDictionary:dict] retain];
	pendingPermissions = NO;
	
	// cache the permissions
	[[NSUserDefaults standardUserDefaults] setObject:dict forKey:@"FacebookPermissions"];
	
	// if we have a pending permission, go ahead and re-invoke
	if (pendingPermission!=nil && [pendingPermission count]>0)
	{
		for (NSArray *entry in pendingPermission)
		{
			[self requestPermission:entry];
		}
		
		RELEASE_TO_NIL(pendingPermission);
	}
	[lock unlock];
	
	if ([self _hasListeners:@"permission"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObject:permissions forKey:@"permissions"];
		[self fireEvent:@"permission" withObject:event];
	}
}

- (NSNumber*)hasPermission:(id)permission
{
	ENSURE_SINGLE_ARG(permission,NSString);
	
	[lock lock];
	BOOL result = NO;
	if (permissions!=nil)
	{
		NSNumber *value = [permissions objectForKey:permission];
		if (value!=nil && [value respondsToSelector:@selector(boolValue)] && [value boolValue])
		{
			result = YES;
		}
	}
	[lock unlock];
	return NUMBOOL(result);
}

- (NSDictionary*)permissions
{
	return permissions;
}

- (NSDictionary*)session
{
	if (session == nil)
	{
		return [NSDictionary dictionary];
	}
	return [NSDictionary dictionaryWithObjectsAndKeys:NUMLONGLONG([session uid]),@"user",
							[session sessionKey],@"session_key",
							NUMLONG([[session expirationDate] timeIntervalSince1970]),@"expires",
							[session sessionSecret],@"ss",
			nil];
}

- (void)startup
{
	lock = [[NSRecursiveLock alloc] init];
	pendingPermissions = NO;
	[super startup];
}

MAKE_SYSTEM_PROP(LOGIN_BUTTON_STYLE_WIDE,FBLoginButtonStyleWide);
MAKE_SYSTEM_PROP(LOGIN_BUTTON_STYLE_NORMAL,FBLoginButtonStyleNormal);
				 


@end

#endif