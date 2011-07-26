/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * This class maintains a coverage map for test_harness JS
 */

#ifdef KROLL_COVERAGE

#import "TiBase.h"
#import "KrollObject.h"
#import "KrollMethod.h"

#define COMPONENT_TYPE_PROXIES @"proxies"
#define COMPONENT_TYPE_MODULES @"modules"
#define COMPONENT_TYPE_OTHER @"other"

#define API_TYPE_FUNCTION @"function"
#define API_TYPE_PROPERTY @"property"

#define COVERAGE_TYPE_GET @"propertyGet"
#define COVERAGE_TYPE_SET @"propertySet"
#define COVERAGE_TYPE_CALL @"functionCall"

#define TOP_LEVEL @"TOP_LEVEL"

@protocol KrollCoverage <NSObject>
-(void)increment:(NSString*)apiName coverageType:(NSString*)coverageType apiType:(NSString*)apiType;
-(NSString*)coverageName;
-(NSString*)coverageType;
@end

@interface KrollCoverageObject : KrollObject <KrollCoverage> {
@private
	NSString *componentName, *componentType;
}

@property(nonatomic,copy) NSString *componentName;
@property(nonatomic,copy) NSString *componentType;

+(void)incrementCoverage:(NSString*)componentType_ componentName:(NSString*)componentName_ apiName:(NSString*)apiName_ coverageType:(NSString*)coverageType_ apiType:(NSString*)apiType_;
+(void)incrementTopLevelFunctionCall:(NSString*)componentName name:(NSString*)apiName;
+(NSDictionary*)dumpCoverage;
+(void)releaseCoverage;

-(id)initWithTarget:(id)target_ context:(KrollContext*)context_;
-(id)initWithTarget:(id)target_ context:(KrollContext*)context_ componentName:(NSString*)componentName_;

@end

@interface KrollCoverageMethod : KrollMethod <KrollCoverage> {
@private
	NSString *parentName, *parentType;
    id<KrollCoverage> parent;
}

@property(nonatomic,copy) NSString *parentName;
@property(nonatomic,copy) NSString *parentType;

-(id)initWithTarget:(id)target_ context:(KrollContext *)context_ parent:(id<KrollCoverage>)parent_;
-(id)initWithTarget:(id)target_ selector:(SEL)selector_ argcount:(int)argcount_ type:(KrollMethodType)type_ name:(id)name_ context:(KrollContext*)context_ parent:(id)parent_;

-(id)call:(NSArray*)args;

@end

#endif