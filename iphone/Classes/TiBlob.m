/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiBlob.h"
#import "Mimetypes.h"

@implementation TiBlob

-(void)dealloc
{
	RELEASE_TO_NIL(mimetype);
	RELEASE_TO_NIL(data);
	RELEASE_TO_NIL(image);
	RELEASE_TO_NIL(path);
	[super dealloc];
}

-(id)description
{
	return @"[object TiBlob]";
}

-(id)initWithImage:(UIImage*)image_
{
	if (self = [super init])
	{
		image = [image_ retain];
		type = TiBlobTypeImage;
		mimetype = [@"image/jpeg" retain];
	}
	return self;
}

-(id)initWithData:(NSData*)data_ mimetype:(NSString*)mimetype_
{
	if (self = [super init])
	{
		data = [data_ retain];
		type = TiBlobTypeData;
		mimetype = [mimetype_ retain];
	}
	return self;
}

-(id)initWithFile:(NSString*)path_
{
	if (self = [super init])
	{
		type = TiBlobTypeFile;
		path = [path_ retain];
		mimetype = [Mimetypes mimeTypeForExtension:path];
	}
	return self;
}

-(TiBlobType)type
{
	return type;
}

-(NSString*)mimeType
{
	return mimetype;
}

-(NSData*)data
{
	switch(type)
	{
		case TiBlobTypeFile:
		{
			NSError *error = nil;
			return [NSData dataWithContentsOfFile:path options:0 error:&error];
		}
		case TiBlobTypeImage:
		{
			return UIImageJPEGRepresentation(image,1.0);
		}
	}
	return data;
}

-(UIImage*)image
{
	switch(type)
	{
		case TiBlobTypeFile:
		{
			return [UIImage imageWithContentsOfFile:path];
		}
		case TiBlobTypeData:
		{
			return [UIImage imageWithData:data];
		}
	}
	return image;
}

-(void)setImage:(UIImage *)image_
{
	RELEASE_TO_NIL(image);
	type = TiBlobTypeImage;
	image = [image_ retain];
}

-(NSString*)path
{
	return path;
}

-(void)setMimeType:(NSString*)mime type:(TiBlobType)type_
{
	RELEASE_TO_NIL(mimetype);
	mimetype = [mime retain];
	type = type_;
}

-(BOOL)writeTo:(NSString*)destination error:(NSError**)error
{
	NSFileManager *fm = [NSFileManager defaultManager];
	NSData *writeData = nil;
	switch(type)
	{
		case TiBlobTypeFile:
		{
			return [fm copyItemAtPath:path toPath:destination error:error];
		}
		case TiBlobTypeImage:
		{
			writeData = [self data];
			break;
		}
		case TiBlobTypeData:
		{
			writeData = data;
			break;
		}
	}
	if (writeData!=nil)
	{
		[writeData writeToFile:destination atomically:YES];
	}
	return NO;
}

@end
