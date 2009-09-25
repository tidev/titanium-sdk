/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TitaniumBlobWrapper.h"
#import "TitaniumHost.h"
#import "TitaniumAppProtocol.h"

NSDictionary * namesFromMimeTypeDict = nil;

@implementation TitaniumBlobWrapper
@synthesize dataBlob, token, filePath, mimeType, imageBlob, url;

- (NSData *) dataBlob;
{
	if (dataBlob == nil){
		if (imageBlob != nil){
			dataBlob = UIImagePNGRepresentation(imageBlob);
			[dataBlob retain];
		}
		if ((dataBlob == nil) && (filePath != nil)){
			dataBlob = [[NSData alloc] initWithContentsOfFile:filePath options:NSMappedRead error:nil];
		}
	}
	return dataBlob;
}

- (UIImage *) imageBlob;
{
	if ((imageBlob == nil) && !failedImage){
		if (dataBlob != nil) {
			imageBlob = [[UIImage alloc] initWithData:dataBlob];
		}
		if ((imageBlob == nil) && (filePath != nil)) {
			imageBlob = [[UIImage alloc] initWithContentsOfFile:filePath];
		}
		if (imageBlob == nil) failedImage = YES;
	}
	return imageBlob;
}

- (NSString *) mimeType;
{
	if (mimeType == nil){
		if (filePath != nil){
			mimeType = [[TitaniumAppProtocol mimeTypeFromExtension:[filePath pathExtension]] retain];
		}
		if ((mimeType == nil) && (dataBlob == nil) && (imageBlob != nil)) {
			mimeType = @"image/png";
		}
	}
	return mimeType;
}

- (NSURL *) url;
{
	if (url == nil) {
		if(filePath != nil){
//			url = [[TitaniumHost sharedHost] 
		}
	}

	return url;
}

- (NSString *) virtualUrl;
{
	return [NSString stringWithFormat:@"app://%@/_TIBLOB/%@",[[TitaniumHost sharedHost] appID],token];
}


- (NSString *) stringValue;
{
	NSMutableString * result = [NSMutableString stringWithFormat:@"{_TOKEN:'%@',url:'%@'",token,[self virtualUrl]];
	if (filePath != nil) [result appendFormat:@",filePath:'%@'",filePath];
	if ([self imageBlob] != nil) {
		CGSize ourSize = [imageBlob size];
		[result appendFormat:@",width:%f,height:%f",ourSize.width,ourSize.height];
	} else {
		[result appendString:@",width:-1,height:-1"];
	}
	if ([self mimeType] != nil) [result appendFormat:@",mimeType:'%@'",mimeType];
	[result appendString:@"}"];
	return result;
}

- (NSString *) virtualFileName;
{
	if(filePath != nil) return [filePath lastPathComponent];
	if(imageBlob != nil) return @"image.png";

	if (mimeType != nil){
		if(namesFromMimeTypeDict == nil) {
			namesFromMimeTypeDict = [[NSDictionary alloc] initWithObjectsAndKeys:
					@"image.png",@"image/png",@"image.gif",@"image/gif",@"image.jpg",jpegMimeType,
					@"page.html",htmlMimeType,@"text.txt",textMimeType,@"file.xml",@"text/xml",
					nil];
		}
		NSString * resultName = [namesFromMimeTypeDict objectForKey:mimeType];
		if (resultName != nil) return resultName;
	}
	return @"binary.bin";
}

- (void) compress;
{
	if (filePath != nil){
		if ([imageBlob retainCount] == 1)[self setImageBlob:nil];
		if ([dataBlob retainCount] == 1)[self setDataBlob:nil];
	}
	if (dataBlob != nil){
		if ([imageBlob retainCount] == 1)[self setImageBlob:nil];
	}
	if (imageBlob != nil){
		if ([dataBlob retainCount] == 1)[self setDataBlob:nil];
	}
}

- (void) dealloc
{
	[dataBlob release];
	[mimeType release];
	[imageBlob release];
	[filePath release];
	[token release];
	[url release];
	[super dealloc];
}


@end
