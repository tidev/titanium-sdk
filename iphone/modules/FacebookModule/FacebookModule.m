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


@implementation FBDialogCallback
- (id) initWithToken:(NSString*)token_ pageToken:(NSString*)pageToken_ module:(FacebookModule*)module_ prefix:(NSString*)prefix_
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
	NSDictionary *dictionary = [NSDictionary dictionaryWithObjectsAndKeys:[NSNull null],@"error",[NSNumber numberWithBool:true],@"success",[NSNumber numberWithBool:false],@"cancel",@"permission",@"event",nil];
	[module evaluateJavascript:[NSString stringWithFormat:@"Ti.Facebook._%@['%@'](%@); delete Ti.Facebook._%@['%@'];",prefix,token,[module toJSON:dictionary],prefix,token] token:pageToken];
	[self autorelease];
}

- (void)dialogDidCancel:(FBDialog*)dialog_
{
	NSDictionary *dictionary = [NSDictionary dictionaryWithObjectsAndKeys:[NSNull null],@"error",[NSNumber numberWithBool:false],@"success",[NSNumber numberWithBool:true],@"cancel",@"permission",@"event",nil];
	[module evaluateJavascript:[NSString stringWithFormat:@"Ti.Facebook._%@['%@'](%@); delete Ti.Facebook._%@['%@'];",prefix,token,[module toJSON:dictionary],prefix,token] token:pageToken];
	[self autorelease];
}

- (void)dialog:(FBDialog*)dialog_ didFailWithError:(NSError*)error
{
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


@implementation FBRequestCallback
- (id) initWithToken:(NSString*)token_ pageToken:(NSString*)pageToken_ module:(FacebookModule*)module_
{
	if (self = [super init])
	{
		token = [token_ retain];
		pageToken = [pageToken_ retain];
		module = [module_ retain];
	}
	return self;
}
- (void)dealloc
{
	[token release];
	[pageToken release];
	[module release];
	[super dealloc];
}
- (void)request:(FBRequest*)request didLoad:(id)result
{
	NSDictionary *dictionary = [NSDictionary dictionaryWithObjectsAndKeys:[module toJSON:result],@"data",[NSNumber numberWithBool:true],@"success",nil];
	[module evaluateJavascript:[NSString stringWithFormat:@"Ti.Facebook._QCB['%@'](%@); delete Ti.Facebook._QCB['%@'];",token,[module toJSON:dictionary],token] token:pageToken];
	[self autorelease];
}
- (void)request:(FBRequest*)request didFailWithError:(NSError*)error
{
	NSDictionary *dictionary = [NSDictionary dictionaryWithObjectsAndKeys:[error description],@"error",[NSNumber numberWithBool:false],@"success",nil];
	[module evaluateJavascript:[NSString stringWithFormat:@"Ti.Facebook._QCB['%@'](%@); delete Ti.Facebook._QCB['%@'];",token,[module toJSON:dictionary],token] token:pageToken];
	[self autorelease];
}
@end

@implementation FBPermissionCallback
- (id) initWithToken:(NSString*)token_ pageToken:(NSString*)pageToken_ module:(FacebookModule*)module_ permission:(NSString*) permission_
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
@end

@implementation FBFeedCallback
- (id) initWithToken:(NSString*)token_ pageToken:(NSString*)pageToken_ module:(FacebookModule*)module_ templateBundleId:(NSNumber*) templateBundleId_ templateData:(NSString*)templateData_ body:(NSString*)body_
{
	if (self = [super initWithToken:token_ pageToken:pageToken_ module:module_ prefix:@"FCB"])
	{
		templateBundleId = [templateBundleId_ retain];
		templateData = [templateData retain];
		body = [body_ retain];
	}
	return self;
}
- (void)dealloc
{
	[templateBundleId release];
	[templateData release];
	[body release];
	[super dealloc];
}
- (FBDialog*)create
{
	FBFeedDialog* dialog_ = [[FBFeedDialog alloc] init];
	dialog_.templateBundleId = [templateBundleId longLongValue];
	dialog_.templateData = templateData;
	dialog_.bodyGeneral = body;
	return dialog_;
}
@end

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

@implementation FacebookModule

- (void)dialogDidCancel:(FBDialog*)dialog_
{
	NSDictionary *dictionary_ = [NSDictionary dictionaryWithObjectsAndKeys:[NSNull null],@"error",[NSNumber numberWithBool:false],@"success",[NSNumber numberWithBool:true],@"cancel",@"login",@"event",nil];
	[self evaluateJavascript:[NSString stringWithFormat:@"Ti.Facebook._LSC(%@)",[self toJSON:dictionary_]] token:nil];
	[dialog release];
	dialog = nil;
}

- (void)dialog:(FBDialog*)dialog_ didFailWithError:(NSError*)error
{
	NSDictionary *dictionary_ = [NSDictionary dictionaryWithObjectsAndKeys:[error description],@"error",[NSNumber numberWithBool:false],@"success",[NSNumber numberWithBool:false],@"cancel",@"login",@"event",nil];
	[self evaluateJavascript:[NSString stringWithFormat:@"Ti.Facebook._LSC(%@)",[self toJSON:dictionary_]] token:nil];
	[dialog release];
	dialog = nil;
}

- (void)session:(FBSession*)session didLogin:(FBUID)uid 
{
	NSDictionary *dictionary_ = [NSDictionary dictionaryWithObjectsAndKeys:[NSNull null],@"error",[NSNumber numberWithBool:true],@"success",[NSNumber numberWithBool:false],@"cancel",@"login",@"event",nil];
	[self evaluateJavascript:[NSString stringWithFormat:@"Ti.Facebook._LSC(%@)",[self toJSON:dictionary_]] token:nil];
	[dialog release];
	dialog = nil;
}

- (void)sessionDidLogout:(FBSession*)session_ 
{
	NSDictionary *dictionary_ = [NSDictionary dictionaryWithObjectsAndKeys:[NSNull null],@"error",[NSNumber numberWithBool:true],@"success",[NSNumber numberWithBool:false],@"cancel",@"logout",@"event",nil];
	[self evaluateJavascript:[NSString stringWithFormat:@"Ti.Facebook._LSC(%@)",[self toJSON:dictionary_]] token:nil];
}

- (void)showDialog
{
   dialog = [[FBLoginDialog alloc] initWithSession:session];
	dialog.delegate = self;
	[dialog show];
}

- (void)login
{
	if (session && [session resume]==NO)
	{
		[self performSelectorOnMainThread:@selector(showDialog) withObject:nil waitUntilDone:NO];
	}
}

- (void)logout 
{
	if (session)
	{
		[session logout];
	}
}

- (NSNumber*) loggedIn
{
	if (session)
	{
		return [NSNumber numberWithBool:[session isConnected]];
	}
	return [NSNumber numberWithBool:NO];;
}

- (NSNumber*) userId
{
	if (session)
	{
		return [NSNumber numberWithLongLong:[session uid]];
	}
	return [NSNumber numberWithLong:0];
}

- (void) query:(NSString*)fql queryId:(NSString*)queryId
{
  	NSDictionary* params = [NSDictionary dictionaryWithObject:fql forKey:@"query"];
	FBRequestCallback *cb = [[FBRequestCallback alloc] initWithToken:queryId pageToken:[self getPageToken] module:self];
  	[[FBRequest requestWithDelegate:cb] call:@"facebook.fql.query" params:params];
}

- (void) showDialog:(FBDialogCallback*)dialog_
{
	[dialog_ show];
}

- (void) permission:(NSString*)perm queryId:(NSString*)queryId
{
	FBPermissionCallback *cb = [[FBPermissionCallback alloc] initWithToken:queryId pageToken:[self getPageToken] module:self permission:perm];
	[self performSelectorOnMainThread:@selector(showDialog:) withObject:cb waitUntilDone:NO];
}

- (void) feed:(NSNumber*)templateBundleId data:(NSString*)templateData body:(NSString*)body_ queryId:(NSString*)queryId
{
	FBFeedCallback *cb = [[FBFeedCallback alloc] initWithToken:queryId pageToken:[self getPageToken] module:self templateBundleId:templateBundleId templateData:templateData body:body_];
	[self performSelectorOnMainThread:@selector(showDialog:) withObject:cb waitUntilDone:NO];
}

- (void) setup:(NSString*)key secret:(NSString*)secret
{
	[dialog release];
	[session release];
	session = [[FBSession sessionForApplication:key secret:secret delegate:self] retain];
	[session resume];
}

- (NSString*) makeDialogJS:(NSString*)prefix
{
	return [NSString stringWithFormat:@"if(typeof(Ti.Facebook._%@)=='undefined'){Ti.Facebook._%@={};Ti.Facebook._%@I=0;};var i=String(Ti.Facebook._%@I++);Ti.Facebook._%@[i]=c;",prefix,prefix,prefix,prefix,prefix];
}	

- (void)configure
{
	NSString *initJS = @"Ti.Facebook._LSC=function(a){if(Ti.Facebook._LIS){for(var c=0;c<Ti.Facebook._LIS.length;c++){try{Ti.Facebook._LIS[c](a)}catch(X){Titanium.API.error('error: '+X)}}}if(Ti.Facebook._CB){Ti.Facebook._CB(s);Ti.Facebook._CB=null}};Ti.Facebook._AL=function(l){if(typeof(Ti.Facebook._LIS)=='undefined'){Ti.Facebook._LIS=[]}Ti.Facebook._LIS.push(l)};";
	[self bindInitializer:initJS];
	
	[self bindFunction:@"_LOGIN" method:@selector(login)];
	[self bindFunction:@"_LOGOUT" method:@selector(logout)];
	[self bindFunction:@"_QRY" method:@selector(query:queryId:)];
	[self bindFunction:@"_PERM" method:@selector(permission:queryId:)];
	[self bindFunction:@"_FEED" method:@selector(feed:data:body:queryId:)];
	
	[self bindFunction:@"isLoggedIn" method:@selector(loggedIn)];
	[self bindFunction:@"getUserId" method:@selector(userId)];
	[self bindFunction:@"setup" method:@selector(setup:secret:)];
	
	[self bindCode:@"login" code:@"function(c){ Ti.Facebook._CB = c; Ti.Facebook._LOGIN(); }"];
	[self bindCode:@"logout" code:@"function(c){ Ti.Facebook._CB = c; Ti.Facebook._LOGOUT(); }"];
	[self bindCode:@"query" code:[NSString stringWithFormat:@"function(q,c){ %@;Ti.Facebook._QRY(q,i); }",[self makeDialogJS:@"QCB"]]];
	[self bindCode:@"createLoginButton" code:@"function(p){var t=document.getElementById(p.id);var s=p.style||'normal';var b=(s=='normal')?'':'2';var l=(Ti.Facebook.isLoggedIn()?'logout':'login');var d=document.createElement('button');d.style.border='none';var i=document.createElement('image');d.appendChild(i);i.src='app://modules/facebook/images/'+l+b+'.png';t.appendChild(d);var c=this;this._EVT={};d.onclick=function(){if(Ti.Facebook.isLoggedIn()){Ti.Facebook.logout(function(){Ti._ONEVT.apply(c,[{type:'logout'}])})}else{Ti.Facebook.login(function(a){Ti._ONEVT.apply(c,[{type:'login',success:a}])})}};if(typeof(Ti.Facebook._LIS)=='undefined'){Ti.Facebook._LIS=[]}Ti.Facebook._LIS.push(function(a){if((a.event=='logout'||!a.success)&&!Ti.Facebook.isLoggedIn()){i.src='app://modules/facebook/images/login'+b+'.png'}else{i.src='app://modules/facebook/images/logout.png'}});Ti.Facebook.setup(p.apikey,p.secret);return{addEventListener:function(a,b){Ti._ADDEVT.apply(c,[a,b])},removeEventListener:function(a,b){Ti._REMEVT.apply(c,[a,b])}}}"];
	[self bindCode:@"requestPermission" code:[NSString stringWithFormat:@"function(p,c){ %@;Ti.Facebook._PERM(p,i); }",[self makeDialogJS:@"PCB"]]];
	[self bindCode:@"publishFeed" code:[NSString stringWithFormat:@"function(id,data,body,c){ %@;Ti.Facebook._FEED(id,data?Ti._JSON(data):null,body,i); }",[self makeDialogJS:@"FCB"]]];
}


@end
