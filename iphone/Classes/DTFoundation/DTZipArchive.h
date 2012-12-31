//
//  DTZipArchive.h
//  DTFoundation
//
//  Created by Oliver Drobnik on 12.02.12.
//  Copyright (c) 2012 Cocoanetics. All rights reserved.
//

/** This is how the enumeration block needs to look like. Setting *stop to YES will stop the enumeration.
 */
typedef void (^DTZipArchiveEnumerationResultsBlock)(NSString *fileName, NSData *data, BOOL *stop);
typedef void (^DTZipArchiveUncompressionCompletionBlock)();

/** Supported compression schemes
 */
typedef enum
{
	DTZipArchiveFormatPKZip = 0,
	DTZipArchiveFormatGZip
} DTZipArchiveFormat;

/** This class represents a compressed file in GZIP or PKZIP format. The used format is auto-detected. 
 
 Dependencies: minizip (in Core/Source/Externals), libz.dylib
 */

@interface DTZipArchive : NSObject

/**-------------------------------------------------------------------------------------
 @name Creating A Zip Archive
 ---------------------------------------------------------------------------------------
 */

/** Creates an instance of DTZipArchive in preparation for enumerating its contents.
 
 Uses the [minizip](http://www.winimage.com/zLibDll/minizip.html) wrapper for zlib to deal with PKZip-format files.
 
 @param path A Path to a compressed file
 @returns An instance of DTZipArchive or `nil` if an error occured
 */
- (id)initWithFileAtPath:(NSString *)path;

/** Enumerates through the files contained in the archive.
 
 If stop is set to `YES` in the enumeration block then the enumeration stops. Note that this parameter is ignored for GZip files since those only contain a single file.
 
 @param enumerationBlock An enumeration block that gets executed for each found and decompressed file
 */
- (void)enumerateUncompressedFilesAsDataUsingBlock:(DTZipArchiveEnumerationResultsBlock)enumerationBlock;

@end
