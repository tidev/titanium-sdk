/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiModule.h"

#ifdef USE_TI_FACEBOOK

#import "FBConnect.h"
#import "KrollCallback.h"

@interface FacebookModule : TiModule<FBSessionDelegate,FBDialogDelegate,FBRequestDelegate> {
@private
	FBSession *session;
	FBLoginDialog *dialog;
	NSRecursiveLock *lock;
	BOOL pendingPermissions;
	NSMutableDictionary *permissions;
	NSMutableArray *pendingPermission;
}

-(void)fetchPermissions:(id)value;
-(void)addPermission:(NSString*)permission value:(NSNumber*)value;
-(void)setPermissions:(NSDictionary*)dict;
-(NSNumber*)userId;

@property(nonatomic,readonly) NSNumber* LOGIN_BUTTON_STYLE_WIDE;
@property(nonatomic,readonly) NSNumber* LOGIN_BUTTON_STYLE_NORMAL;


@end

@interface FBRequestCallback : NSObject<FBRequestDelegate> {
	FacebookModule *module;
	KrollCallback *callback;
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
	KrollCallback *callback;
	FacebookModule *module;
	FBDialog *dialog;
}
- (void)show;
- (id) initWithCallback:(KrollCallback*)callback module:(FacebookModule*)module_;
@end


@interface FBPermissionCallback : FBDialogCallback {
	NSString *permission;
}
@end

@interface FBStreamCallback : FBDialogCallback {
	NSString *title;
	NSString *data;
	NSString *targetId;
	FBSession *session;
}
@end


#endif