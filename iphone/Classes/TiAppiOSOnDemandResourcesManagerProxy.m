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


-(void)_initWithProperties:(NSDictionary *)properties
{
    [super _initWithProperties:properties];
}

-(void)dealloc
{
    [super dealloc];
}

-(NSString*)apiName
{
    return @"Ti.App.iOS.OnDemandResourcesManager";
}

#pragma mark Public API's

-(void)conditionallyBeginAccessingResources:(id)args
{
    ENSURE_SINGLE_ARG(args, NSDictionary)

    // Define the tags
    NSSet<NSString*> *tags = [[NSSet alloc] initWithArray:[args valueForKey:@"tags"]];
    
    // Define the success callback
    KrollCallback* successCallback = [args valueForKey:@"success"];
    ENSURE_TYPE_OR_NIL(successCallback, KrollCallback);
    
    // Define the error callback
    KrollCallback* errorCallback = [args valueForKey:@"error"];
    ENSURE_TYPE_OR_NIL(errorCallback, KrollCallback);
    
    [self setResourceRequest:[[NSBundleResourceRequest alloc] initWithTags:tags]];

    [_resourceRequest.progress addObserver:self forKeyPath:@"fractionCompleted" options:NSKeyValueObservingOptionNew context:NULL];
    
    [_resourceRequest conditionallyBeginAccessingResourcesWithCompletionHandler: ^(BOOL resourcesAvailable) {
            if(resourcesAvailable) {
                [self executeCallback:successCallback withCode:0 andMessage:@"Resources already available."];
                
                NSDictionary *event = [NSDictionary dictionaryWithObject:NUMDOUBLE(1.0) forKey:@"value"];
                [self fireEvent:@"progress" withObject:event];
                
                // Data available and already downloaded, go to success callback.
                [self endAccessingResources];
            } else {
                // Data available, but not downloaded, begin downloading them.
                NSLog(@"Resources not available, yet. Downloading ...");
                
                [_resourceRequest beginAccessingResourcesWithCompletionHandler: ^(NSError * __nullable error) {
                    
                    [[NSOperationQueue mainQueue] addOperationWithBlock:^(void) {
                        
                        if (error == nil) {
                            [self executeCallback:successCallback
                                         withCode:0
                                       andMessage:@"Resources downloaded successfully."];
                        } else {
                            [self executeCallback:errorCallback
                                         withCode:1
                                       andMessage:[NSString stringWithFormat:@"Resources cound not be downloaded: %@", [error localizedDescription]]];
                        }
                        
                        // Add the listener of the current download progress
                        [_resourceRequest.progress removeObserver:self forKeyPath:@"fractionCompleted"];
                        [self endAccessingResources];
                        
                    }];
                }];
            }
        }
     ];
}

-(void)executeCallback:(KrollCallback*)callback withCode:(NSInteger)code andMessage:(NSString*)message
{
    NSDictionary * propertiesDict = [TiUtils dictionaryWithCode:code message:message];
    NSArray * invocationArray = [[NSArray alloc] initWithObjects:&propertiesDict count:1];
    [callback call:invocationArray thisObject:self];
    [invocationArray release];
}

-(void)endAccessingResources
{
    [_resourceRequest endAccessingResources];
}

-(double)priority
{
    return [_resourceRequest loadingPriority];
}

-(void)setPriority:(id)_priority
{
    ENSURE_UI_THREAD_1_ARG(_priority);
    [_resourceRequest setLoadingPriority:[TiUtils doubleValue:_priority]];
}

#pragma mark Key-Value observer

-(void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context
{
    if ((object == _resourceRequest.progress) &&([keyPath isEqualToString:@"fractionCompleted"])) {
        if ([self _hasListeners:@"progress"])
        {
            double progressSoFar = _resourceRequest.progress.fractionCompleted;

            NSDictionary *event = [NSDictionary dictionaryWithObject:NUMDOUBLE(progressSoFar) forKey:@"value"];
            [self fireEvent:@"progress" withObject:event];
        }
    }
}

@end

#endif