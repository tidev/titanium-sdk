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
    NSDictionary* statusCallbacks = nil;
    
    // Check the method arguments
    statusCallbacks = [args objectAtIndex:0];
    ENSURE_TYPE(statusCallbacks, NSDictionary);
    
    // Define the success callback
    KrollCallback* successCallback = [statusCallbacks valueForKey:@"success"];
    ENSURE_TYPE_OR_NIL(successCallback, KrollCallback);
    
    // Define the error callback
    KrollCallback* errorCallback = [statusCallbacks valueForKey:@"error"];
    ENSURE_TYPE_OR_NIL(errorCallback, KrollCallback);
   
    // Access the resources
    [resourceRequest beginAccessingResourcesWithCompletionHandler: ^(NSError * __nullable error) {
         resourcesLoaded = !error;
        
        NSDictionary* callbackBody;

        if (resourcesLoaded == YES) {
            callbackBody = [[[NSDictionary alloc] initWithObjectsAndKeys:
                          @"success", YES
                          , nil] autorelease];

            [successCallback call: [NSArray arrayWithObjects: callbackBody, nil] thisObject: nil];
        } else {
            callbackBody = [[[NSDictionary alloc] initWithObjectsAndKeys:
                          @"success", NO,
                          @"message", [error localizedDescription]
                          , nil] autorelease];

            [errorCallback call: [NSArray arrayWithObjects: callbackBody, nil] thisObject: nil];
        }
        
        [successCallback release];
        [errorCallback release];
        [callbackBody release];
    }];
}

-(void)conditionallyBeginAccessingResources:(id)args
{
    [resourceRequest conditionallyBeginAccessingResourcesWithCompletionHandler: ^(BOOL resourcesAvailable) {
            if(resourcesAvailable) {
                NSLog(@"Resource available!");
            } else {
                [self beginAccessingResources:args];
            }
        }
     ];
}


-(void)endAccessingResources
{
    [resourceRequest endAccessingResources];
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