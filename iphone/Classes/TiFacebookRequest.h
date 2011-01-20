/**
 * Appcelerator Commercial License. Copyright (c) 2010 by Appcelerator, Inc.
 *
 * Appcelerator Titanium is Copyright (c) 2009-2010 by Appcelerator, Inc.
 * and licensed under the Apache Public License (version 2)
 */

#import "FacebookModule.h"
#import "KrollCallback.h"
#import "FBConnect/Facebook.h"

@interface TiFacebookRequest : NSObject<FBRequestDelegate2> {
	NSString *path;
	KrollCallback *callback;
	FacebookModule *module;
	BOOL graph;
}

-(id)initWithPath:(NSString*)path_ callback:(KrollCallback*)callback_ module:(FacebookModule*)module_ graph:(BOOL)graph_;

@end
