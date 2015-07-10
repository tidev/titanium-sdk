/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_UIIOSONDEMANDRESOURCESMANAGER
#import "TiUIiOSOnDemandResourcesManagerProxy.h"
#import "TiUtils.h"
#import "TiFile.h"

@implementation TiUIiOSOnDemandResourcesManagerProxy

-(void)_destroy
{
    [super _destroy];
}

-(void)_initWithProperties:(NSDictionary *)properties
{
    ENSURE_ARRAY([properties valueForKey:@"tags"]);
    
    tags = [properties valueForKey:@"tags"];
    resourceRequest = [[NSBundleResourceRequest alloc] initWithTags:tags];
    
    [super _initWithProperties:properties];
}

-(NSString*)apiName
{
    return @"Ti.UI.iOS.OnDemandResourcesManager";
}

#pragma mark Public API's

-(void)beginAccessingResources:(id)args
{
    ENSURE_ARG_COUNT(args, 1);
    ENSURE_UI_THREAD_1_ARG(args);
    
    KrollCallback *callback = [args objectAtIndex:0];

    [resourceRequest beginAccessingResourcesWithCompletionHandler: ^(NSError * __nullable error)
     {
         resourcesLoaded = !error;
         
         if(callback){

             NSDictionary* callbackBody;

             if (resourcesLoaded == YES) {
                 callbackBody = [[[NSDictionary alloc] initWithObjectsAndKeys:
                                  @"status", @"Ti.UI.iOS.ON_DEMAND_RESOURCE_SUCCESS"
                                  , nil] autorelease];
             } else {
                 callbackBody = [[[NSDictionary alloc] initWithObjectsAndKeys:
                                  @"status", @"Ti.UI.iOS.ON_DEMAND_RESOURCE_ERROR"
                                  , nil] autorelease];
             }
             
             [callback call: [NSArray arrayWithObjects: callbackBody, nil] thisObject: nil];
         }

      }
     ];
}

-(void)conditionallyBeginAccessingResources:(id)args
{
    [resourceRequest conditionallyBeginAccessingResourcesWithCompletionHandler: ^(BOOL resourcesAvailable)
        {
            if(resourcesAvailable) {
                NSLog(@"Resource available");
            } else {
                NSLog(@"Resource not available");
            }
        }
     ];
}

-(void)endAccessingResources
{
    [resourceRequest endAccessingResources];
    NSLog(@"Resource access finished");
}

-(double)priority
{
    return [resourceRequest loadingPriority];
}

-(void)setPriority:(id)_priority
{
    ENSURE_UI_THREAD_1_ARG(_priority);
    [resourceRequest setLoadingPriority:[TiUtils doubleValue:_priority]];
}

@end

#endif