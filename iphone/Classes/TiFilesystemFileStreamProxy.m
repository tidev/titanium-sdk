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

-(unsigned long long) currentFileSize;

@end


@implementation TiFilesystemFileStreamProxy

#pragma mark Internal

-(id) _initWithPageContext:(id <TiEvaluator>)context args:(NSArray *)args {
	if(self = [super _initWithPageContext:context args:args]) {
		if([args count] > 0) {
			NSString *filePath = [args objectAtIndex:0];
			NSFileHandle *handle = nil;
			
			mode = TI_READ;
			if([args count] == 2) {
				mode = [[args objectAtIndex:1] intValue];
			}
			
			@try {
				//If the mode is *not* TI_WRITE and the file path is non-existent, throw exception
				//Otherwise, create a blank file at the specified path
				
				NSFileManager *fm = [NSFileManager defaultManager];
				if([fm fileExistsAtPath:filePath] == NO) {
					if(mode != TI_WRITE) {
						[NSException raise:NSInternalInconsistencyException format:@"File does not exist at path %@", filePath, nil];
					}
					BOOL created = [fm createFileAtPath:filePath contents:[NSData data] attributes:nil];
					if(!created) {
						[NSException raise:NSInternalInconsistencyException format:@"An error occurred while trying to create the file."];
					}
				} else {
					//If the file exists and the mode is TI_WRITE, truncate the file.
					if(mode == TI_WRITE) {
						NSError *error = nil;
                        [[NSData data] writeToFile:filePath options:NSDataWritingFileProtectionComplete | NSDataWritingAtomic error:&error];
						if(error != nil) {
							[NSException raise:NSInternalInconsistencyException format:@"%@", error, nil];
						}
					}
				}
				
				if(mode == TI_WRITE || mode == TI_APPEND) {
					handle = [NSFileHandle fileHandleForUpdatingAtPath:filePath];
				} else {
					handle = [NSFileHandle fileHandleForReadingAtPath:filePath];
				}
				
				if(handle == nil) {
					//something went wrong with creating the file handle
					[NSException raise:NSInternalInconsistencyException format:@""];
				}
			}
			@catch (NSException * e) {
				[self throwException:TiExceptionOSError
						   subreason:[NSString stringWithFormat:@"Could not open file stream for file at path: %@\n%@", filePath, [e reason], nil]
							location:CODELOCATION];					
			}
			
			//we made it, retain the file handle.
			
			fileHandle = [handle retain];
			
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
	RELEASE_TO_NIL(fileHandle);
	[super dealloc];
}

#define THROW_IF_HANDLE_NIL(loc) \
if(fileHandle == nil) {\
	[self throwException:TiExceptionInternalInconsistency subreason:@"File handle has already been closed." location:loc];\
}


#pragma mark Private methods

-(unsigned long long) currentFileSize {
	unsigned long long offset = [fileHandle offsetInFile];
    unsigned long long size = [fileHandle seekToEndOfFile];
	[fileHandle seekToFileOffset:offset]; //revert to previous position
	return size;
}

#pragma mark TiStreamInternal methods

-(int) readToBuffer:(TiBuffer *)buffer offset:(int)offset length:(int)length callback:(KrollCallback *)callback {
	THROW_IF_HANDLE_NIL(CODELOCATION);
	
	if([[buffer data] length] == 0 && length != 0) {
		NSString *errorMessage = @"Buffer length is zero"; 
		if(callback != nil) {
			NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:NUMINT(0), @"bytesProcessed", errorMessage, @"errorMessage", NUMINT(0), @"errorCode", nil];
			[self _fireEventToListener:@"read" withObject:event listener:callback thisObject:nil];
		} else {
			[self throwException:TiExceptionRangeError
					   subreason:errorMessage
						location:CODELOCATION];
		}
	}
	
	NSData *fileData = nil;
	
	if([buffer data] == nil) {
		[buffer setData:[NSMutableData data]];
	}
	
	if([fileHandle offsetInFile] >= [self currentFileSize]) {
		//out of bounds
		return -1;
	}
	
	if(length == 0) {
		[buffer setData:[NSMutableData dataWithData:[fileHandle availableData]]];
		return [[buffer length] intValue];
	}
	
	fileData = [fileHandle readDataOfLength:length];
	
	if([fileData length] > 0) {
		VerboseLog(@"fileData is %@", [NSString stringWithCString:[fileData bytes] encoding:NSUTF8StringEncoding]);
		
		void* bufferBytes = [[buffer data] mutableBytes];
		const void* streamBytes = [fileData bytes];
		VerboseLog(@"bufferBytes is NULL? %@", bufferBytes == NULL ? @"YES" : @"NO");
		VerboseLog(@"streamBytes is NULL? %@", streamBytes == NULL ? @"YES" : @"NO");
		
		if(bufferBytes != NULL && streamBytes != NULL) {
			VerboseLog(@"bufferBytes: %@", [NSString stringWithCString:bufferBytes encoding:NSUTF8StringEncoding]);
			VerboseLog(@"streamBytes: %@", [NSString stringWithCString:streamBytes encoding:NSUTF8StringEncoding]);
			
			memcpy(bufferBytes + offset, streamBytes, MIN([fileData length], length));	
			return [fileData length];
		}
	}
	return -1;
}

-(int) writeFromBuffer:(TiBuffer *)buffer offset:(int)offset length:(int)length callback:(KrollCallback *)callback {
	THROW_IF_HANDLE_NIL(CODELOCATION);
	
	if (length == 0) {
		return 0; // NO-OP
	}
	
	NSData *slicedData = [[buffer data] subdataWithRange:NSMakeRange(offset, MIN([[buffer data] length] - offset, length))];	
	
	if (mode == TI_APPEND) {
		[fileHandle seekToEndOfFile];
	}
	
	if(slicedData != nil) {
		@try {
			[fileHandle writeData:slicedData];
			[fileHandle synchronizeFile]; //force immediate save to disk
			
			if(callback != nil) {
				NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:self, @"source", NUMINT([slicedData length]), @"bytesProcessed", NUMINT(0), @"errorState", @"", @"errorDescription", nil];
				[self _fireEventToListener:@"writeToStream" withObject:event listener:callback thisObject:nil];
			}
		}
		@catch (NSException * e) {
			if(callback != nil) {
				NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:self, @"source", NUMINT(0), @"bytesProcessed", [e reason], @"errorDescription", NUMINT(-1), @"errorState",nil];
                [self _fireEventToListener:@"writeToStream" withObject:event listener:callback thisObject:nil];
			} else {
				@throw e;
			}
		}
		return [slicedData length];
	}
	return -1;
}

-(int) writeToStream:(id <TiStreamInternal>)output chunkSize:(int)size callback:(KrollCallback *)callback {
	THROW_IF_HANDLE_NIL(CODELOCATION);
	
    NSUInteger totalBytes = 0;
	NSUInteger position = [fileHandle offsetInFile];
	NSUInteger remaining = [self currentFileSize] - position;
	
    while (position < [self currentFileSize]) {
		VerboseLog(@"position is %d, size is %d", position, [self currentFileSize]);
		
        TiBuffer* tempBuffer = [[[TiBuffer alloc] _initWithPageContext:[self executionContext]] autorelease];
        NSRange subdataRange = NSMakeRange(position, MIN(size, [self currentFileSize] - position));
        
        int bytesWritten = 0;
        @try {
			NSData *data = [fileHandle readDataOfLength:subdataRange.length];
			if([data length] > 0) {
				void* bytes = malloc(subdataRange.length);
				[data getBytes:bytes length:subdataRange.length];
				[tempBuffer setData:[NSMutableData dataWithBytesNoCopy:bytes length:subdataRange.length freeWhenDone:YES]];
				bytesWritten = [output writeFromBuffer:tempBuffer offset:0 length:subdataRange.length callback:nil];
				
				//call callback
				if(callback != nil) {
					NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:self, @"fromStream", output, @"toStream", NUMINT(bytesWritten), @"bytesProcessed", NUMINT(0), @"errorState", @"", @"errorDescription", nil];
					[self _fireEventToListener:@"writeToStream" withObject:event listener:callback thisObject:nil];
				}
			} else {
				//EOF
				return totalBytes;
			}
        }
        @catch (NSException* e) {
            if (callback != nil) {
                NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"fromStream",output,@"toStream", [e reason],@"errorDescription", NUMINT(-1),@"errorState",nil];
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
		remaining = [self currentFileSize] - [fileHandle offsetInFile];
		if(remaining < size) {
			remaining = size;
		}
	}	
    
    if (callback != nil) {
        NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"fromStream",output,@"toStream",NUMINT(totalBytes),@"bytesProcessed",NUMINT(0),@"errorState",@"",@"errorDescription",nil];
        [self _fireEventToListener:@"writeToStream" withObject:event listener:callback thisObject:nil];
    }
    
    return totalBytes;
}

-(void) pumpToCallback:(KrollCallback *)callback chunkSize:(int)maxSize asynch:(BOOL)asynch {
	THROW_IF_HANDLE_NIL(CODELOCATION);
	
	if(callback == nil) {
		[self throwException:TiExceptionNotEnoughArguments
				   subreason:@"No callback provided to Ti.Stream.pump"
					location:CODELOCATION];
	}
	unsigned long long remaining = [self currentFileSize] - [fileHandle offsetInFile];
	unsigned long long totalBytes = 0;
	
	if(maxSize > remaining) {
		//truncate to avoid buffer overruns
		maxSize = remaining;
	}
	
	while([fileHandle offsetInFile] < [self currentFileSize]) {
		//create temporary buffer
		NSData *chunkedData = [fileHandle readDataOfLength:MIN(maxSize, [self currentFileSize] - [fileHandle offsetInFile])];
		TiBuffer *buffer = [[[TiBuffer alloc] _initWithPageContext:[self executionContext]] autorelease];
		
		[buffer setData:[NSMutableData dataWithData:chunkedData]];
		
		totalBytes += [chunkedData length];
		
		VerboseLog(@"pumping data: %@", buffer);
		
		//invoke callback, passing the chunked data
		NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"source", buffer, @"buffer", NUMINT([chunkedData length]), @"bytesProcessed", NUMINT(totalBytes),@"totalBytesProcessed", nil];
		[self _fireEventToListener:@"pump" withObject:event listener:callback thisObject:nil];
		
		remaining = [self currentFileSize] - [fileHandle offsetInFile];
		if(maxSize > remaining) {
			maxSize = remaining;
		}
		
		//are we going to hit EOF? if so, invoke the callback with a -1 bytesProcessed event dict
		if(remaining == 0) {
			NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"source", buffer, @"buffer", NUMINT(-1), @"bytesProcessed", NUMINT(totalBytes),@"totalBytesProcessed", nil];
			[self _fireEventToListener:@"pump" withObject:event listener:callback thisObject:nil];
			break;
		}
	}
}

-(void) close:(id) args {
	@try {
		[fileHandle closeFile];	
	} @finally {
        RELEASE_TO_NIL(fileHandle);
    }
}

-(NSNumber*)isReadable:(id)_void {
	return NUMBOOL(mode == TI_READ);
}

-(NSNumber*)isWritable:(id)_void {
	return NUMBOOL(mode == TI_WRITE || mode == TI_APPEND);
}

@end

#endif
