/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_FILESYSTEM

#import "TiStreamProxy.h"
#import "TiFilesystemFileStreamProxy.h"
#import "TiFilesystemFileProxy.h"

@interface TiFilesystemFileStreamProxy (Private)

-(BOOL) modeExists:(int) mode;
-(unsigned long long) currentFileSize;

@end


@implementation TiFilesystemFileStreamProxy

@synthesize modes;

#pragma mark Internal

-(id) _initWithPageContext:(id <TiEvaluator>)context args:(NSArray *)args {
	if(self = [super _initWithPageContext:context args:args]) {
		if([args count] > 0) {
			NSString *filePath = [args objectAtIndex:0];
			NSFileHandle *handle = nil;
			
			if([args count] > 1 && [[args objectAtIndex:1] isKindOfClass:[NSArray class]]) {
				modes = [[args objectAtIndex:1] retain];
			} else {
				modes = [[NSArray alloc] initWithObjects:NUMINT(TI_READ), NUMINT(TI_WRITE), NUMINT(TI_APPEND), nil];
			}
			handle = [NSFileHandle fileHandleForUpdatingAtPath:filePath];
			
			if(handle == nil) {
//				[self throwException:TiExceptionOSError
//						   subreason:[NSString stringWithFormat:@"Could not open file stream for file at URL: %@ - error: %@", filePath, [err localizedDescription], nil]
//							location:CODELOCATION];
				NSLog(@"[WARN] Could not open file stream for file at path: %@", filePath);
			} else {
				fileHandle = [handle retain];
			}
		} else {
			NSString *reason = [NSString stringWithFormat:@"Invalid arguments passed to -[TiFilesystemFileStreamProxy _initWithPageContext:args:] (%@)", args];
			[self throwException:TiExceptionNotEnoughArguments
					   subreason:reason
						location:CODELOCATION];
		}
	}
	return self;
}

-(void) dealloc {
	RELEASE_TO_NIL(modes);
	RELEASE_TO_NIL(fileHandle);
	[super dealloc];
}

#pragma mark Private methods

-(BOOL) modeExists:(int)mode {
	return [modes containsObject:NUMINT(mode)];
}

-(unsigned long long) currentFileSize {
	unsigned long long offset = [fileHandle offsetInFile],
						 size = [fileHandle seekToEndOfFile];
	[fileHandle seekToFileOffset:offset]; //revert to previous position
	return size;
}

#pragma mark TiStreamInternal methods
				
-(int) readToBuffer:(TiBuffer *)buffer offset:(int)offset length:(int)length callback:(KrollCallback *)callback {
	NSLog(@"readToBuffer: called");
	if(![self modeExists:TI_READ]) {
		[self throwException:TiExceptionInternalInconsistency
				   subreason:@"You cannot read from a write-only FileStream"
					location:CODELOCATION];
		return -1;
	}

	if([[buffer data] length] == 0 && length != 0) {
		if(callback != nil) {
			NSDictionary *event = [NSDictionary dictionaryWithObject:NUMINT(0) forKey:@"bytesProcessed"];
			[self _fireEventToListener:@"read" withObject:event listener:callback thisObject:nil];
		}
		return -1;
	}

	NSData *fileData = nil;

	if([buffer data] == nil) {
		[buffer setData:[NSMutableData data]];
	}

	if([fileHandle offsetInFile] >= [self currentFileSize]) {
		//out of bounds
		//TODO: Throw exception or something
		return -1;
	}
	
	if(length == 0) {
		//if length is 0, read until EOF
		fileData = [fileHandle readDataToEndOfFile];
		
		[[buffer data] appendData:fileData];
		return [fileData length];
	}
	
	fileData = [fileHandle readDataOfLength:length];
	
	if([fileData length] > 0) {
		NSLog(@"fileData is %@", [NSString stringWithCString:[fileData bytes] encoding:NSUTF8StringEncoding]);

		void* bufferBytes = [[buffer data] mutableBytes];
		const void* streamBytes = [fileData bytes];
		NSLog(@"bufferBytes is NULL? %@", bufferBytes == NULL ? @"YES" : @"NO");
		NSLog(@"streamBytes is NULL? %@", streamBytes == NULL ? @"YES" : @"NO");

		if(bufferBytes != NULL && streamBytes != NULL && (void*) (bufferBytes + offset) != NULL) {
			NSLog(@"bufferBytes: %@", [NSString stringWithCString:bufferBytes encoding:NSUTF8StringEncoding]);
			NSLog(@"streamBytes: %@", [NSString stringWithCString:streamBytes encoding:NSUTF8StringEncoding]);

			memcpy(bufferBytes + offset, streamBytes, MIN([fileData length], length));	
			return [fileData length];
		}
	}
	return -1;
}

-(int) writeFromBuffer:(TiBuffer *)buffer offset:(int)offset length:(int)length callback:(KrollCallback *)callback {
	if(![self modeExists:TI_WRITE] && ![self modeExists:TI_APPEND]) {
		[self throwException:TiExceptionInternalInconsistency
				   subreason:@"You cannot write from a read-only FileStream"
					location:CODELOCATION];
	}
	NSLog(@"writeFromBuffer: called");
	
	NSData *slicedData = [[buffer data] subdataWithRange:NSMakeRange(offset, length)];
	NSData *newData = slicedData;

	if([self modeExists:TI_APPEND] && offset != 0) {
		NSMutableData *realigned = [NSMutableData data];
		[realigned appendData:[[buffer data] subdataWithRange:NSMakeRange(0, offset)]];
		[realigned appendData:slicedData];
		newData = realigned;
	}

	if(newData != nil) {
		@try {
			[fileHandle writeData:newData];
			[fileHandle synchronizeFile]; //force immediate save to disk
			
			return [slicedData length];
		} @catch (NSException *e) {
			return -1;
		}
	}
	return -1;
}

-(int) writeToStream:(id <TiStreamInternal>)output chunkSize:(int)size callback:(KrollCallback *)callback {
	if(![self modeExists:TI_WRITE] && ![self modeExists:TI_APPEND]) {
		[self throwException:TiExceptionInternalInconsistency
				   subreason:@"You cannot write from a read-only FileStream"
					location:CODELOCATION];
	}
    NSUInteger totalBytes = 0;
	NSUInteger position = [fileHandle offsetInFile];
    while (position < [self currentFileSize]) {
        TiBuffer* tempBuffer = [[[TiBuffer alloc] _initWithPageContext:[self executionContext]] autorelease];
        NSRange subdataRange = NSMakeRange(position,MIN(size, [self currentFileSize] - position));
        
        void* bytes = malloc(subdataRange.length);
        [[fileHandle readDataOfLength:subdataRange.length] getBytes:bytes range:subdataRange];
        [tempBuffer setData:[NSMutableData dataWithBytesNoCopy:bytes length:subdataRange.length freeWhenDone:YES]];
        
        int bytesWritten = 0;
        @try {
            bytesWritten = [output writeFromBuffer:tempBuffer offset:0 length:subdataRange.length callback:nil];
        }
        @catch (NSException* e) {
            // TODO: We'll need some kind of information about:
            // 1. Error Code
            // 2. # bytes produced as part of the write
            // In the exception.
            if (callback != nil) {
                NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"fromStream",output,@"toStream",NUMINT(totalBytes),@"bytesWritten",[e reason],@"errorDescription", NUMINT(-1),@"errorState",nil];
                [self _fireEventToListener:@"writeToStream" withObject:event listener:callback thisObject:nil];
            }
            else {
                @throw e;
            }
        }
        if (bytesWritten == 0) {
            break;
        }
        
        totalBytes += bytesWritten;
        position += subdataRange.length;
    }
    
    if (callback != nil) {
        NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"fromStream",output,@"toStream",NUMINT(totalBytes),@"bytesProcessed",NUMINT(0),@"errorState",@"",@"errorDescription",nil];
        [self _fireEventToListener:@"writeToStream" withObject:event listener:callback thisObject:nil];
    }
    
    return totalBytes;
}

-(void) pumpToCallback:(KrollCallback *)callback chunkSize:(int)size asynch:(BOOL)asynch {
	if(![self modeExists:TI_READ]) {
		[self throwException:TiExceptionInternalInconsistency
				   subreason:@"You cannot read from a write-only FileStream"
					location:CODELOCATION];
	}
	
	if(callback == nil) {
		[self throwException:TiExceptionNotEnoughArguments
				   subreason:@"No callback provided to pumpToCallback"
					location:CODELOCATION];
	}
	
	NSData *chunkedData = [fileHandle readDataOfLength:size];
	int totalBytes = 0;

	while([chunkedData length] > 0) {
		//create temporary buffer
		TiBuffer *buffer = [[[TiBuffer alloc] _initWithPageContext:[self executionContext]] autorelease];
		[buffer setData:chunkedData];
		
		totalBytes += [chunkedData length];
		chunkedData = [fileHandle readDataOfLength:size];
		
		//invoke callback, passing the chunked data
		NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"source",buffer,@"data",NUMINT(size),@"bytesProcessed",NUMINT(totalBytes),@"totalBytesProcessed", nil];
        [self _fireEventToListener:@"pump" withObject:event listener:callback thisObject:nil];
	}
}

#pragma mark Public API

//Wrapper for TiStreamInternal's pumpToCallback: method
-(id) pump:(id) args {
	KrollCallback *callback;
	NSNumber *chunkSize;

	ENSURE_ARG_AT_INDEX(callback, args, 0, KrollCallback);
	ENSURE_ARG_AT_INDEX(chunkSize, args, 1, NSNumber);
	
	[self pumpToCallback:callback chunkSize:[chunkSize intValue] asynch:NO];
	return NUMBOOL(YES);
}

-(id) writeStream:(id) args {
	//TODO: Why do we need this?
	
	NSNumber *chunkSize;
	KrollCallback *callback = nil;
	
	id stream = [args objectAtIndex:0];
	if(![stream conformsToProtocol:@protocol(TiStreamInternal)]) {
		[self throwException:TiExceptionInvalidType
				   subreason:@"You have provided an invalid Ti.Stream object"
					location:CODELOCATION];
	}
	
	ENSURE_ARG_AT_INDEX(chunkSize, args, 1, NSNumber); 
	
	if([args count] == 3) {
		if([[args objectAtIndex:2] isKindOfClass:[KrollCallback class]]) {
			//optional KrollCallback was supplied

			callback = [args objectAtIndex:2];
		}
	}
	
	return NUMINT([self writeToStream:stream chunkSize:[chunkSize intValue] callback:callback]);
}

-(id) close:(id) args {
	BOOL closed = YES;
	@try {
		[fileHandle closeFile];	
	} @catch (NSException *e) {
		closed = NO;
	}
	return NUMBOOL(closed);
}

-(NSNumber*)isReadable:(id)_void {
	return NUMBOOL([self modeExists:TI_READ]);
}

-(NSNumber*)isWritable:(id)_void {
	return NUMBOOL([self modeExists:TI_WRITE] || [self modeExists:TI_APPEND]);
}

@end

#endif