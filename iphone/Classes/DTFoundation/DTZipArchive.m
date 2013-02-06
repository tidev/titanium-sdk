//
//  DTZipArchive.m
//  DTFoundation
//
//  Created by Oliver Drobnik on 12.02.12.
//  Copyright (c) 2012 Cocoanetics. All rights reserved.
//

#import "DTZipArchive.h"

#include "zip.h"
#include "unzip.h"

#define BUFFER_SIZE 4096

@interface DTZipArchive()

- (void)_enumerateGZipUsingBlock:(DTZipArchiveEnumerationResultsBlock)enumerationBlock;
- (void)_enumeratePKZipUsingBlock:(DTZipArchiveEnumerationResultsBlock)enumerationBlock;

@end


@implementation DTZipArchive
{
	NSString *_path;
	DTZipArchiveFormat _format;
	NSData *_data; 
}

- (id)initWithFileAtPath:(NSString *)path
{
	self = [super init];
	if (self)
	{
		_data = [[NSData alloc] initWithContentsOfFile:path options:NSDataReadingMapped error:NULL];
		
		if (!_data)
		{
			return nil;
		}

		// remember path for later
		_path = [path copy];

		// detect file format
		const char *bytes = [_data bytes];
		
		if (bytes[0]=='P' && bytes[1]=='K')
		{
			// first two bytes are 'PK' on .zip files
			_format = DTZipArchiveFormatPKZip;
		}
		else
		{
			// probably GZip, we'll see if we can inflate it
			_format = DTZipArchiveFormatGZip;
		}
	}
	
	return self;
}

#pragma Public Methods

- (void)enumerateUncompressedFilesAsDataUsingBlock:(DTZipArchiveEnumerationResultsBlock)enumerationBlock
{
	NSAssert(enumerationBlock, @"Must set an enumeration block");
	
	switch (_format) 
	{
		case DTZipArchiveFormatGZip:
			[self _enumerateGZipUsingBlock:enumerationBlock];
		case DTZipArchiveFormatPKZip:
			[self _enumeratePKZipUsingBlock:enumerationBlock];
	}
}

#pragma mark GZIP
- (NSString *)_inflatedFileName
{
	NSString *fileName = [_path lastPathComponent];
	NSString *extension = [fileName pathExtension];
	
	// man page mentions suffixes .gz, -gz, .z, -z, _z or .Z			
	if ([extension isEqualToString:@"gz"] || [extension isEqualToString:@"z"] || [extension isEqualToString:@"Z"])
	{
		fileName = [fileName stringByDeletingPathExtension];
	}
	else if ([fileName hasSuffix:@"-gz"])
	{
		fileName = [fileName substringToIndex:[fileName length]-3];
	}
	else if ([fileName hasSuffix:@"-z"] || [fileName hasSuffix:@"_z"])
	{
		fileName = [fileName substringToIndex:[fileName length]-2];
	}
	
	return fileName;
}

// adapted from http://www.cocoadev.com/index.pl?NSDataCategory
- (void)_enumerateGZipUsingBlock:(DTZipArchiveEnumerationResultsBlock)enumerationBlock
{
	NSUInteger dataLength = [_data length];
	NSUInteger halfLength = dataLength / 2;
	
	NSMutableData *decompressed = [NSMutableData dataWithLength: dataLength + halfLength];
	BOOL done = NO;
	int status;
	
	z_stream strm;
	strm.next_in = (Bytef *)[_data bytes];
	strm.avail_in = (uInt)dataLength;
	strm.total_out = 0;
	strm.zalloc = Z_NULL;
	strm.zfree = Z_NULL;
	
	// inflateInit2 knows how to deal with gzip format
	if (inflateInit2(&strm, (15+32)) != Z_OK)
	{
		return;
	}
	
	while (!done)
	{
		// extend decompressed if too short
		if (strm.total_out >= [decompressed length])
		{
			[decompressed increaseLengthBy: halfLength];
		}
		
		strm.next_out = [decompressed mutableBytes] + strm.total_out;
		strm.avail_out = (uInt)[decompressed length] - (uInt)strm.total_out;
		
		// Inflate another chunk.
		status = inflate (&strm, Z_SYNC_FLUSH);
		
		if (status == Z_STREAM_END)
		{
			done = YES;
		}
		else if (status != Z_OK)
		{
			break;	
		}
	}
	
	if (inflateEnd (&strm) != Z_OK || !done)
	{
		return;
	}

	// set actual length
	[decompressed setLength:strm.total_out];
	
	// call back block
	enumerationBlock([self _inflatedFileName], decompressed, NULL);
}

#pragma mark PKZIP


// adapted from: http://code.google.com/p/ziparchive
- (void)_enumeratePKZipUsingBlock:(DTZipArchiveEnumerationResultsBlock)enumerationBlock
{
	unsigned char buffer[BUFFER_SIZE] = {0};
	
	// open the file for unzipping
	unzFile _unzFile = unzOpen((const char *)[_path UTF8String]);
	
	// return if failed
	if (!_unzFile)
	{
		return;
	}
	
	// get file info
	unz_global_info  globalInfo = {0};
	
	if (!unzGetGlobalInfo(_unzFile, &globalInfo )==UNZ_OK )
	{
		// there's a problem
		return;
	}
	
	if (unzGoToFirstFile(_unzFile)!=UNZ_OK)
	{
		// unable to go to first file
		return;
	}
	
	// enum block can stop loop
	BOOL shouldStop = NO;
	
	// iterate through all files
	do 
	{
		unz_file_info zipInfo ={0};
		
		if (unzOpenCurrentFile(_unzFile) != UNZ_OK)
		{
			// error uncompressing this file
			return;
		}
		
		// first call for file info so that we know length of file name
		if (unzGetCurrentFileInfo(_unzFile, &zipInfo, NULL, 0, NULL, 0, NULL, 0) != UNZ_OK)
		{
			// cannot get file info
			unzCloseCurrentFile(_unzFile);
			return;
		}
		
		// reserve space for file name
		char *fileNameC = (char *)malloc(zipInfo.size_filename+1);
		
		// second call to get actual file name	
		unzGetCurrentFileInfo(_unzFile, &zipInfo, fileNameC, zipInfo.size_filename + 1, NULL, 0, NULL, 0);
		fileNameC[zipInfo.size_filename] = '\0';
		NSString *fileName = [NSString stringWithUTF8String:fileNameC];
		free(fileNameC);

		/*
		// get the file date
		NSDateComponents *comps = [[NSDateComponents alloc] init];
		
		// NOTE: zips have no time zone
		if (zipInfo.dosDate)
		{
			// dosdate spec: http://msdn.microsoft.com/en-us/library/windows/desktop/ms724247(v=vs.85).aspx
			
			comps.year = ((zipInfo.dosDate>>25)&127) + 1980;  // 7 bits
			comps.month = (zipInfo.dosDate>>21)&15;  // 4 bits
			comps.day = (zipInfo.dosDate>>16)&31; // 5 bits
			comps.hour = (zipInfo.dosDate>>11)&31; // 5 bits
			comps.minute = (zipInfo.dosDate>>5)&63;	// 6 bits	
			comps.second = (zipInfo.dosDate&31) * 2;  // 5 bits
		}
		else
		{
			comps.day = zipInfo.tmu_date.tm_mday;
			comps.month = zipInfo.tmu_date.tm_mon + 1;
			comps.year = zipInfo.tmu_date.tm_year;
			comps.hour = zipInfo.tmu_date.tm_hour;
			comps.minute = zipInfo.tmu_date.tm_min;
			comps.second = zipInfo.tmu_date.tm_sec;
		}
		NSDate *fileDate = [[NSCalendar currentCalendar] dateFromComponents:comps];
		*/
		
		// determine if this is a file or directory
		BOOL isDirectory = NO;
		
		if ([fileName hasSuffix:@"/"] || [fileName hasSuffix:@"\\"])
		{
			isDirectory = YES;
		}
		
		// change to only use forward slashes
		fileName = [fileName stringByReplacingOccurrencesOfString:@"\\" withString:@"/"];

		if (isDirectory)
		{
			// call the enum block
			enumerationBlock(fileName, nil, &shouldStop);
		}
		else 
		{
			NSMutableData *tmpData = [[NSMutableData alloc] init];
			
			int readBytes;
			while((readBytes = unzReadCurrentFile(_unzFile, buffer, BUFFER_SIZE)) > 0)
			{
				[tmpData appendBytes:buffer length:readBytes];
			}
			
			// call the enum block
			enumerationBlock(fileName, tmpData, &shouldStop);
		}
		
		// close the current file
		unzCloseCurrentFile(_unzFile);
	}
	while (!shouldStop && unzGoToNextFile(_unzFile )==UNZ_OK);
}

@end
