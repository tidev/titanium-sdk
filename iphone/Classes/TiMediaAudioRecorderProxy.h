/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"
#import "AQRecorder.h"
#import "TiFile.h"

@interface TiMediaAudioRecorderProxy : TiProxy {
@private
	AQRecorder *recorder;
	TiFile *file;
}

#pragma mark Public APIs

@property(nonatomic,readonly) BOOL recording;
@property(nonatomic,readonly) BOOL stopped;
@property(nonatomic,readonly) BOOL paused;

-(void)pause:(id)args;
-(void)resume:(id)args;
-(void)start:(id)args;
-(id)stop:(id)args;

@end
