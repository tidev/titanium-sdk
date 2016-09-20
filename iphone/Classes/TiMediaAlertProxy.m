/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiMediaAlertProxy.h"
 
@implementation TiMediaAlertProxy
 
#pragma mark Proxy Lifecycle
 
-(id)init
{
    return [super init];
}
 
-(void)_destroy
{
    if (sound) {
        AudioServicesDisposeSystemSoundID(sound);
    }
    RELEASE_TO_NIL(url);
    [super _destroy];
}
 
#pragma mark System Sound
 
-(NSURL*)url
{
    return url;
}

-(void)setUrl:(id)url_
{
    RELEASE_TO_NIL(url);
    
    if ([url_ isKindOfClass:[NSString class]]) {
        url = [[TiUtils toURL:url_ proxy:self] retain];
        
        if ([url isFileURL] == NO) {
            // we need to download it and save it off into temp file
            NSData *data = [NSData dataWithContentsOfURL:url];
            NSString *ext = [[[url path] lastPathComponent] pathExtension];
            TiFile* tempFile = [[TiFile createTempFile:ext] retain]; // file auto-deleted on release
            [data writeToFile:[tempFile path] atomically:YES];
            RELEASE_TO_NIL(url);
            url = [[NSURL fileURLWithPath:[tempFile path]] retain];
        }
    } else if ([url_ isKindOfClass:[TiBlob class]]) {
        TiBlob *blob = (TiBlob*)url_;
        if ([blob type] == TiBlobTypeFile){
            url = [[NSURL fileURLWithPath:[blob path]] retain];
        }
    } else if ([url_ isKindOfClass:[TiFile class]]) {
        url = [[NSURL fileURLWithPath:[(TiFile*)url_ path]] retain];
    }
    
    if (sound != nil) {
        AudioServicesDisposeSystemSoundID(sound);
    }

    AudioServicesCreateSystemSoundID((CFURLRef)url, &sound);
}
 
-(void)play:(id)unused
{
    if (url == nil) return;
    AudioServicesPlayAlertSound(sound);
}
 
@end