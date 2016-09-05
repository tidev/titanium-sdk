/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiResourceUtils.h"
#import "TiApp.h"
#import "AppModule.h"

@implementation TiResourceUtils

extern NSString * const TI_APPLICATION_DEPLOYTYPE;
extern NSString * const TI_APPLICATION_ID;
extern NSString * const TI_APPLICATION_PUBLISHER;
extern NSString * const TI_APPLICATION_URL;
extern NSString * const TI_APPLICATION_NAME;
extern NSString * const TI_APPLICATION_VERSION;
extern NSString * const TI_APPLICATION_DESCRIPTION;
extern NSString * const TI_APPLICATION_COPYRIGHT;
extern NSString * const TI_APPLICATION_GUID;

static bool useCustomDir = false;
static NSString* sourcePathString;
static NSString* baseDirectory;
static NSString* pathString;

+(void) initialize
{
    sourcePathString = [[TiApp tiAppProperties] objectForKey:@"dataDirectory"];
    if(sourcePathString != nil){
        useCustomDir = true;
        baseDirectory = [[self getBaseDirectory:sourcePathString] retain];
        pathString = [[self parsePathString:sourcePathString] retain];
    }
}

+(NSDictionary*) getValues
{
    NSString* familyTarget = UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad ? @"ipad" : @"iphone";
    NSDictionary* values = [NSDictionary dictionaryWithObjectsAndKeys:
              TI_APPLICATION_DEPLOYTYPE, @"deploytype",
              TI_APPLICATION_ID, @"id",
              TI_APPLICATION_PUBLISHER, @"publisher",
              TI_APPLICATION_URL, @"url",
              TI_APPLICATION_NAME, @"name",
              TI_APPLICATION_VERSION, @"version",
              TI_APPLICATION_DESCRIPTION, @"description",
              TI_APPLICATION_COPYRIGHT, @"copyright",
              TI_APPLICATION_GUID, @"guid",
              familyTarget, @"familyTarget",
              @"ios", @"platform",
              @"iphone", @"family",
              [ TI_APPLICATION_NAME stringByReplacingOccurrencesOfString:@" " withString:@"_"], @"undName", nil];
    return values;
}

+(NSString*) parsePathString:(NSString*) path
{
    NSString* pattern = @"\\{ *(.*?) *\\}";
    NSString* patternDir = @".*Directory:/(.*)";
    NSDictionary* values = [self getValues];

    NSRegularExpression* regexDir = [NSRegularExpression regularExpressionWithPattern: patternDir options:0 error:nil];
    NSTextCheckingResult* matchDir = [[regexDir matchesInString:path options:0 range: NSMakeRange(0, [path length])] firstObject];
    if(matchDir != nil){
        path = [path substringWithRange:[matchDir rangeAtIndex:1]];
    }
    if(![path isEqualToString:@""]){
        NSRegularExpression* regex = [NSRegularExpression regularExpressionWithPattern: pattern options:0 error:nil];
        NSArray* matches = [[[regex matchesInString:path options:0 range: NSMakeRange(0, [path length])] reverseObjectEnumerator] allObjects];
        for (NSTextCheckingResult* match in matches) {
            NSString* matchValue = [path substringWithRange:[match rangeAtIndex:1]];
            NSString* value = values[matchValue];
            if(value != nil){
                path = [path stringByReplacingCharactersInRange:[match range] withString:value];
            }
        }
        if(![path hasSuffix:@"/"]){
            path = [path stringByAppendingString:@"/"];
        }
    }
    return path;
}

+(NSString*) getBaseDirectory:(NSString*) path
{
    NSString* matchText = nil;
    NSRange   searchedRange = NSMakeRange(0, [path length]);
    NSString *pattern = @"(.*Directory):/";
    NSError  *error = nil;
    
    NSRegularExpression* regex = [NSRegularExpression regularExpressionWithPattern: pattern options:0 error:&error];
    NSTextCheckingResult* match = [[regex matchesInString:path options:0 range: searchedRange] firstObject];
    
    NSString* basePath = [[NSBundle mainBundle] resourcePath];
    if(match){
        matchText = [path substringWithRange:[match rangeAtIndex:1]];
        if([matchText isEqualToString:@"resourcesDirectory"]){
            //Use default path
        }else if([matchText isEqualToString:@"applicationDataDirectory"]){
            basePath = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) firstObject];
        }else if([matchText isEqualToString:@"tempDirectory"]){
            basePath = NSTemporaryDirectory();
        }else if([matchText isEqualToString:@"applicationCacheDirectory"]){
            basePath = [NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES) firstObject];
        }else if([matchText isEqualToString:@"externalStorageDirectory"]){
            DebugLog(@"[ERROR] 'externalStorageDirectory' supports only android device");
            //Use default path
        }
    }
    if(![basePath hasSuffix:@"/"]){
        basePath = [basePath stringByAppendingString:@"/"];
    }
    return basePath;
}

+(BOOL) useCustomResourceDirectory
{
    return useCustomDir;
}

+(NSString*) getBaseDir
{
    return baseDirectory;
}

+(NSString*) getBasePath
{
    return [baseDirectory stringByAppendingString:pathString];
}

+(NSString*) getPath:(NSString*) path
{
    if(!useCustomDir){
        return nil;
    }
    if([path hasPrefix:@"/"]){
        path = [path substringFromIndex:1];
    }
    NSString* fullPath = [[baseDirectory stringByAppendingString:pathString] stringByAppendingString:path];
    return fullPath;
}

@end
