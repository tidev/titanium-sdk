/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_APPIOS
#import "TiAppiOSOnDemandResourcesManagerProxy.h"
#import "TiUtils.h"
#import "TiFile.h"

@implementation TiAppiOSOnDemandResourcesManagerProxy

-(void)_destroy
{
    [super _destroy];
}

-(void)_initWithProperties:(NSDictionary *)properties
{
    ENSURE_ARRAY([properties valueForKey:@"tags"]);
    
    tags = [properties valueForKey:@"tags"];
    resourceRequest = [[NSBundleResourceRequest alloc] initWithTags:tags];
    
    [resourceRequest.progress addObserver:self
                              forKeyPath:@"fractionCompleted"
                              options:NSKeyValueObservingOptionNew
                              context:NULL
     ];
    
    [super _initWithProperties:properties];
}

-(NSString*)apiName
{
    return @"Ti.App.iOS.OnDemandResourcesManager";
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
    
    // Add a listener to the current download progress
    [resourceRequest.progress addObserver:self forKeyPath:@"fractionCompleted" options:NSKeyValueObservingOptionNew context:NULL];
   
    // Access the resources
    [resourceRequest beginAccessingResourcesWithCompletionHandler: ^(NSError * __nullable error) {
         resourcesLoaded = !error;
        
        if (resourcesLoaded == YES) {
            [successCallback call: [NSArray arrayWithObjects: @{ @"success" : @YES }, nil] thisObject: nil];
        } else {
            [errorCallback call: [NSArray arrayWithObjects: @{ @"success" : @NO, @"message": [error localizedDescription] }, nil] thisObject: nil];
        }
        
        // Add the listener of the current download progress
        [resourceRequest.progress removeObserver:self forKeyPath:@"fractionCompleted"];
        
        [successCallback release];
        [errorCallback release];
    }];
}

-(void)conditionallyBeginAccessingResources:(id)args
{
    [resourceRequest conditionallyBeginAccessingResourcesWithCompletionHandler: ^(BOOL resourcesAvailable) {
            if(resourcesAvailable) {
                resourcesLoaded = NO;
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

-(void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context
{
    if ((object == resourceRequest.progress) &&([keyPath isEqualToString:@"fractionCompleted"])) {
        if ([self _hasListeners:@"progress"])
        {
            double progressSoFar = resourceRequest.progress.fractionCompleted;
            DebugLog(@"Download progress: %@", progressSoFar);

            NSDictionary *event = [NSDictionary dictionaryWithObject:NUMDOUBLE(progressSoFar) forKey:@"value"];
            [self fireEvent:@"progress" withObject:event];
        }
    }
}

@end

#endif