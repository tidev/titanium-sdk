/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef KROLL_COVERAGE

#import "KrollCoverage.h"
#import "TiUtils.h"
#import "TiModule.h"
#import "SBJSON.h"

@implementation KrollCoverageObject

@synthesize componentType, componentName;

static NSMutableDictionary *coverageCount = nil;
static NSArray* submodules = nil;

+(void)incrementCoverage:(NSString*)componentType_ componentName:(NSString*)componentName_
	apiName:(NSString*)apiName_ coverageType:(NSString*)coverageType_ apiType:(NSString*)apiType_
{
    if (coverageCount == nil)
    {
        coverageCount = [[NSMutableDictionary alloc] init];
    }

	NSMutableDictionary *components = [coverageCount objectForKey:componentType_];
	if (components == nil)
	{
		components = [[NSMutableDictionary alloc] init];
		[coverageCount setObject:components forKey:componentType_];
	}

	NSMutableDictionary *component = [components objectForKey:componentName_];
	if (component == nil)
	{
		component = [[NSMutableDictionary alloc] init];
		[components setObject:component forKey:componentName_];
	}

	NSMutableDictionary *coverage = [component objectForKey:apiName_];
	if (coverage == nil)
	{
		coverage = [[NSMutableDictionary alloc] init];
		[component setObject:coverage forKey:apiName_];
	}

	[coverage setObject:apiType_ forKey:@"_type"];

	int count = [TiUtils intValue:coverageType_ properties:coverage def:0];
	count++;

	[coverage setObject:[NSNumber numberWithInt:count] forKey:coverageType_];
}

+(void)incrementTopLevelFunctionCall:(NSString*)componentName_ name:(NSString*)apiName
{
	[KrollCoverageObject incrementCoverage:COMPONENT_TYPE_OTHER componentName:componentName_ apiName:apiName
		coverageType:COVERAGE_TYPE_CALL apiType:API_TYPE_FUNCTION];
}

+(NSDictionary*)dumpCoverage
{
	return coverageCount;
}

+(void)releaseCoverage
{
    [coverageCount removeAllObjects];
    [coverageCount release];
    coverageCount = nil;
}

-(id)initWithTarget:(id)target_ context:(KrollContext*)context_
{	
	if (self = [super initWithTarget:target_ context:context_])
	{
		componentType = COMPONENT_TYPE_PROXIES;
		NSString *className = [NSString stringWithCString:class_getName([target_ class]) encoding:NSUTF8StringEncoding];

		if ([target_ isKindOfClass:[TiModule class]])
		{
			componentType = COMPONENT_TYPE_MODULES;
			[self setComponentName:[[NSString stringWithFormat:@"Ti%@.",@"tanium"] stringByAppendingString:[className stringByReplacingOccurrencesOfString:@"Module" withString:@""]]];
		}
		else
		{
			NSString *apiName = [className stringByReplacingOccurrencesOfString:@"Proxy" withString:@""];
            // Because of the substitution performed as part of the build, have to split 'Ti''tanium' into two strings
			NSString *parentName = [NSString stringWithFormat:@"Ti%@",@"tanium"];

			if ([apiName hasPrefix:@"Ti"])
			{
				apiName = [apiName substringFromIndex:2];
			}

			// Slight hack.. we can guess the module by hard coding any all-caps module (UI/API/XML)
			// Otherwise, split on the next capital letter (is there a better way?)
			if ([apiName hasPrefix:@"UI"])
			{
				parentName = @"UI";
				apiName = [apiName substringFromIndex:2];
			}
			else if ([apiName hasPrefix:@"API"])
			{
				parentName = @"API";
				apiName = [apiName substringFromIndex:3];
			}
			else if ([apiName hasPrefix:@"XML"])
			{
				parentName = @"XML";
				apiName = [apiName substringFromIndex:3];
			}
			else if ([apiName isEqual:@"TopTiModule"])
			{
				apiName = @"";
			}
			else if ([apiName length] > 1)
			{
				NSCharacterSet *upperChars = [NSCharacterSet uppercaseLetterCharacterSet];
				int i = 1, length = [apiName length];

				// Find the first upper case char after the first char
				for (; i < length; i++)
				{
					if ([upperChars characterIsMember:[apiName characterAtIndex:i]])
					{
						break;
					}
				}
				if (i < length - 1)
				{
					parentName = [apiName substringToIndex:i];
					apiName = [apiName substringFromIndex:i];
				}
                
                // Determine if we're in a submodule
                if (submodules == nil) {
                    submodules = [[NSArray alloc] initWithObjects:@"iOS",@"iPhone",@"iPad",@"Socket",@"Properties",nil];
                }
                for (NSString* submodule in submodules) {
                    if ([apiName isEqualToString:submodule]) {
                        break;
                    }
                    NSRange pos = [apiName rangeOfString:submodule];
                    if (pos.location != NSNotFound) {
                        apiName = [NSString stringWithFormat:@"%@.%@",submodule,[apiName substringFromIndex:(pos.location+pos.length)]];
                        break;
                    }
                }
			}

            // Note: This doesn't properly detect things like submodules right now
			if ([apiName length] > 0)
			{
                [self setComponentName:[NSString stringWithFormat:@"%@.%@", parentName, apiName]];
			}
			else
			{
				[self setComponentName:parentName];
			}
		}
	}
	return self;
}

-(id)initWithTarget:(id)target_ context:(KrollContext*)context_ componentName:(NSString*)componentName_
{
	if (self = [super initWithTarget:target_ context:context_])
	{
		componentType = COMPONENT_TYPE_PROXIES;
		if ([target_ isKindOfClass:[TiModule class]])
		{
			componentType = COMPONENT_TYPE_MODULES;
		}
		[self setComponentName:componentName_];
	}
	return self;
}

-(void)increment:(NSString*)apiName coverageType:(NSString*)coverageType apiType:(NSString*)apiType;
{
	[KrollCoverageObject incrementCoverage:componentType componentName:componentName
		apiName:apiName coverageType:coverageType apiType:apiType];
}

-(NSString*)coverageName
{
    return componentName;
}

-(NSString*)coverageType
{
    return componentType;
}

@end

@implementation KrollCoverageMethod
@synthesize parentType, parentName;

-(id)initWithTarget:(id)target_ context:(KrollContext *)context_ parent:(id)parent_
{
	if (self = [super initWithTarget:target_ context:context_])
	{
        parent = [parent_ retain];
	}
	return self;
}

-(id)initWithTarget:(id)target_ selector:(SEL)selector_
	argcount:(int)argcount_ type:(KrollMethodType)type_ name:(id)name_
	context:(KrollContext*)context_ parent:(id<KrollCoverage>)parent_
{
	if (self = [super initWithTarget:target_ selector:selector_ argcount:argcount_ type:type_ name:name_ context:context_])
	{
        parent = [parent_ retain];
	}
	return self;
}

-(void)dealloc
{
    RELEASE_TO_NIL(parent);
    [super dealloc];
}

-(id)call:(NSArray*)args
{
	NSString *coverageType;
	NSString *apiType;
    NSString *apiName = [super name];

    switch ([super type])
    {
        //case KrollMethodGetter:
        case KrollMethodPropertyGetter:
        {
            coverageType = COVERAGE_TYPE_GET;
            apiType = API_TYPE_PROPERTY;
            NSString *propertyKey = [super propertyKey];
            NSString *upperProperty = [[[propertyKey substringToIndex:1] uppercaseString] stringByAppendingString:[propertyKey substringFromIndex:1]];
            apiName = [NSString stringWithFormat:@"get%@",upperProperty];
        } break;

        //case KrollMethodSetter:
        case KrollMethodPropertySetter:
        {
            coverageType = COVERAGE_TYPE_SET;
            apiType = API_TYPE_PROPERTY;
            NSString *propertyKey = [super propertyKey];
            NSString *upperProperty = [[[propertyKey substringToIndex:1] uppercaseString] stringByAppendingString:[propertyKey substringFromIndex:1]];
            apiName = [NSString stringWithFormat:@"set%@",upperProperty];
        } break;
        default:
        {
            coverageType = COVERAGE_TYPE_CALL;
            apiType = API_TYPE_FUNCTION;
            if (apiName == nil)
            {
                apiName = [NSString stringWithCString:sel_getName([self selector]) encoding:NSUTF8StringEncoding];
                apiName = [apiName substringToIndex:[apiName length]-1];
            }
        }
    }

	[KrollCoverageObject incrementCoverage:[self coverageType] componentName:[self coverageName]
		apiName:apiName coverageType:coverageType apiType:apiType];

	return [super call:args];
}

-(void)increment:(NSString*)apiName coverageType:(NSString*)coverageType apiType:(NSString*)apiType
{
    [parent increment:apiName coverageType:coverageType apiType:apiType];
}

-(NSString*)coverageName
{
    return [parent coverageName];
}

-(NSString*)coverageType
{
    return [parent coverageType];
}

@end
#endif
