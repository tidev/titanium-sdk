/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * This class maintains a coverage map for Titanium JS
 */

#import "TiBase.h"
#import "KrollObject.h"
#import "KrollMethod.h"

#define COMPONENT_TYPE_PROXIES @"proxies"
#define COMPONENT_TYPE_MODULES @"modules"
#define COMPONENT_TYPE_OTHER @"other"

#define API_TYPE_FUNCTION @"function"
#define API_TYPE_PROPERTY @"property"

#define COVERAGE_TYPE_GET @"get"
#define COVERAGE_TYPE_SET @"set"
#define COVERAGE_TYPE_CALL @"call"

#define TOP_LEVEL @"TOP_LEVEL"

@interface KrollCoverageObject : KrollObject {
@private
	NSString *componentName, *componentType;
}

@property(nonatomic,copy) NSString *componentName;
@property(nonatomic,copy) NSString *componentType;

+(void)incrementCoverage:(NSString*)componentType_ componentName:(NSString*)componentName_ apiName:(NSString*)apiName_ coverageType:(NSString*)coverageType_ apiType:(NSString*)apiType_;
+(void)incrementTopLevelFunctionCall:(NSString*)componentName name:(NSString*)apiName;
+(NSString*)dumpCoverage;
+(void)releaseCoverage;

-(id)initWithTarget:(id)target_ context:(KrollContext*)context_;
-(id)initWithTarget:(id)target_ context:(KrollContext*)context_ componentName:(NSString*)componentName_;

-(void)increment:(NSString*)apiName coverageType:(NSString*)coverageType apiType:(NSString*)apiType;

@end

@interface KrollCoverageMethod : KrollMethod {
@private
	NSString *parentName, *parentType;
}

@property(nonatomic,copy) NSString *parentName;
@property(nonatomic,copy) NSString *parentType;

-(id)initWithTarget:(id)target_ context:(KrollContext *)context_ parent:(KrollCoverageObject*)parent_;
-(id)initWithTarget:(id)target_ selector:(SEL)selector_ argcount:(int)argcount_ type:(KrollMethodType)type_ name:(id)name_ context:(KrollContext*)context_ parent:(KrollCoverageObject*)parent_;

-(void)initParent:(KrollObject*)parent;

-(id)call:(NSArray*)args;

@end