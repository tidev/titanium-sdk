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

// TODO: Default mode should be TI_READ
// TODO: TI_WRITE and TI_APPEND are mutually exclusive.
// TODO: Throw exception on bad creation; don't just log a message
// TODO: Find out if filestreams can only have one mode for now (probably!)

-(id) _initWithPageContext:(id <TiEvaluator>)context args:(NSArray *)args {
	if(self = [super _initWithPageContext:context args:args]) {
		if([args count] > 0) {
			NSString *filePath = [args objectAtIndex:0];
			NSFileHandle *handle = nil;
			
			mode = TI_READ;
			if([args count] == 2) {
				mode = [[args objectAtIndex:1] intValue];
			}

			handle = [NSFileHandle fileHandleForUpdatingAtPath:filePath];
			if(handle == nil) {
				[self throwException:TiExceptionOSError
						   subreason:[NSString stringWithFormat:@"Could not open file stream for file at path: %@", filePath, nil]
							location:CODELOCATION];
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
	RELEASE_TO_NIL(fileHandle);
	[super dealloc];
}

#define THROW_IF_HANDLE_NIL(loc) \
if(fileHandle == nil) {\
  [self throwException:TiExceptionInternalInconsistency\
		 	 subreason:@"File handle has already been closed."\
			  location:loc];\
}


#pragma mark Private methods

-(unsigned long long) currentFileSize {
	unsigned long long offset = [fileHandle offsetInFile];
    unsigned long long size = [fileHandle seekToEndOfFile];
	[fileHandle seekToFileOffset:offset]; //revert to previous position
	return size;
}

#pragma mark TiStreamInternal methods

// TODO: Remember to remove debug NSLog
// TODO: Length == 0 does not indicate read to EOF; only to create the buffer.
// TODO: bufferBytes+offset!=NULL check is not necessary; this address will only be null if bufferBytes==NULL,offset==0
// TODO: Should throw exceptions/call callback on error; -1 indicates EOF only.
-(int) readToBuffer:(TiBuffer *)buffer offset:(int)offset length:(int)length callback:(KrollCallback *)callback {
	THROW_IF_HANDLE_NIL(CODELOCATION);
	
	if(mode != TI_READ) {
		[self throwException:TiExceptionInternalInconsistency
				   subreason:@"You cannot read from a write-only FileStream"
					location:CODELOCATION];
		return -1;
	}

	if([[buffer data] length] == 0 && length != 0) {
		NSString *errorMessage = @"Buffer length is zero"; 
		if(callback != nil) {
			NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:NUMINT(0), @"bytesProcessed", errorMessage, @"errorMessage", NUMINT(0), @"errorCode"];
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
	
	fileData = [fileHandle readDataOfLength:length];

	if(length == 0) {
		[[buffer data] appendData:fileData];
		return [fileData length];
	}
		
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

// TODO: Your NSRange may be out of range of the buffer (offset+length may extend past the buffer bounds) - use MIN([[buffer data] length]-offset,length)
// TODO: Should throw exceptions/call callback on error; -1 indicates EOF only.
-(int) writeFromBuffer:(TiBuffer *)buffer offset:(int)offset length:(int)length callback:(KrollCallback *)callback {
	THROW_IF_HANDLE_NIL(CODELOCATION);

	if(mode != TI_WRITE && mode != TI_APPEND) {
		[self throwException:TiExceptionInternalInconsistency
				   subreason:@"You cannot write from a read-only FileStream"
					location:CODELOCATION];
	}
	NSLog(@"writeFromBuffer: called");
	
	NSData *slicedData = [[buffer data] subdataWithRange:NSMakeRange(offset, length)];
	NSData *newData = slicedData;

	if(mode == TI_APPEND && offset != 0) {
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
	THROW_IF_HANDLE_NIL(CODELOCATION);
	
	if(mode != TI_WRITE || mode != TI_APPEND) {
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

// TODO: chunkedData needs to be NSMutableData - buffers require that.
-(void) pumpToCallback:(KrollCallback *)callback chunkSize:(int)size asynch:(BOOL)asynch {
	THROW_IF_HANDLE_NIL(CODELOCATION);

	if(mode != TI_READ) {
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
		[buffer setData:[NSMutableData dataWithData:chunkedData]];
		
		totalBytes += [chunkedData length];
		chunkedData = [fileHandle readDataOfLength:size];
		
		//invoke callback, passing the chunked data
		NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"source",buffer,@"data",NUMINT(size),@"bytesProcessed",NUMINT(totalBytes),@"totalBytesProcessed", nil];
        [self _fireEventToListener:@"pump" withObject:event listener:callback thisObject:nil];
	}
}

// TODO: Remove these; see comments in code
#pragma mark Public API

// TODO: REMOVE THESE.  pump and writeStream are methods on Ti.Stream, NOT on stream objects.

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

// TODO: When closing the fileHandle, RELEASE_TO_NIL and then check for this in all operations on the stream to ensure that nothing is being done with a closed stream.
-(id) close:(id) args {
	BOOL closed = YES;
	@try {
		[fileHandle closeFile];	
		RELEASE_TO_NIL(fileHandle);
	} @catch (NSException *e) {
		closed = NO;
	}
	return NUMBOOL(closed);
}

-(NSNumber*)isReadable:(id)_void {
	return NUMBOOL(mode == TI_READ);
}

-(NSNumber*)isWritable:(id)_void {
	return NUMBOOL(mode == TI_WRITE || mode == TI_APPEND);
}

@end

#endif