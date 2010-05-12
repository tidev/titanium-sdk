/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <QuartzCore/QuartzCore.h>

#import "TiBase.h"
#import "TiUtils.h"
#import "TiHost.h"
#import "TiPoint.h"
#import "TiProxy.h"
#import "ImageLoader.h"
#import "WebFont.h"
#import "TiDimension.h"
#import "TiColor.h"
#import "TiFile.h"
#import "TiBlob.h"

#import "UIImage+Resize.h"

#ifdef TARGET_IPHONE_SIMULATOR
extern NSString * const TI_APPLICATION_RESOURCE_DIR;
#endif

@implementation TiUtils

+(BOOL)isDevice_Pre_3_2
{
	static BOOL checked = NO;
	static BOOL is_pre_3_2 = NO;
	
	if (checked==NO)
	{
		NSString *version = [UIDevice currentDevice].systemVersion;
		NSArray *tokens = [version componentsSeparatedByString:@"."];
		NSInteger major = [TiUtils intValue:[tokens objectAtIndex:0]];
		NSInteger minor = [TiUtils intValue:[tokens objectAtIndex:1]];
		is_pre_3_2 = (major==3 && minor < 2);
		checked = YES;
	}
	return is_pre_3_2;
}

+(BOOL)isIPad
{
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
	return UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad;
#else
	return NO;
#endif
}

+(void)queueAnalytics:(NSString*)type name:(NSString*)name data:(NSDictionary*)data
{
	NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:
						   VAL_OR_NSNULL(type),@"type",
						   VAL_OR_NSNULL(name),@"name",
						   VAL_OR_NSNULL(data),@"data",
						   nil];
	[[NSNotificationCenter defaultCenter] postNotificationName:kTiAnalyticsNotification object:nil userInfo:event];
}

+(NSString *)UTCDateForDate:(NSDate*)data
{
	NSDateFormatter *dateFormatter = [[[NSDateFormatter alloc] init] autorelease];
	NSTimeZone *timeZone = [NSTimeZone timeZoneWithName:@"UTC"];
	[dateFormatter setTimeZone:timeZone];

	NSLocale * USLocale = [[NSLocale alloc] initWithLocaleIdentifier:@"en_US"];
	[dateFormatter setLocale:USLocale];
	[USLocale release];


	//Example UTC full format: 2009-06-15T21:46:28.685+0000
	[dateFormatter setDateFormat:@"yyyy-MM-dd'T'HH:mm:ss'.'SSS+0000"];
	return [dateFormatter stringFromDate:data];
}

+(NSString *)UTCDate
{
	return [TiUtils UTCDateForDate:[NSDate date]];
}

+(NSString*)createUUID
{
	CFUUIDRef resultID = CFUUIDCreate(NULL);
	NSString * resultString = (NSString *) CFUUIDCreateString(NULL, resultID);
	CFRelease(resultID);
	return [resultString autorelease];
}

+(TiFile*)createTempFile:(NSString*)extension
{
	return [TiFile createTempFile:extension];
}

+(NSString *)encodeQueryPart:(NSString *)unencodedString
{
	NSString * result = (NSString *)CFURLCreateStringByAddingPercentEscapes(
															   NULL,
															   (CFStringRef)unencodedString,
															   NULL,
															   (CFStringRef)@"!*'();:@+$,/?%#[]=", 
															   kCFStringEncodingUTF8 );
	[result autorelease];
	return result;
}

+(NSString *)encodeURIParameters:(NSString *)unencodedString
{
	// NOTE: we must encode each individual part for the to successfully work
	
	NSMutableString *result = [[[NSMutableString alloc]init] autorelease];
	
	NSArray *parts = [unencodedString componentsSeparatedByString:@"&"];
	for (int c=0;c<[parts count];c++)
	{
		NSString *part = [parts objectAtIndex:c];
		NSRange range = [part rangeOfString:@"="];
		
		if (range.location != NSNotFound)
		{
			[result appendString:[TiUtils encodeQueryPart:[part substringToIndex:range.location]]];
			[result appendString:@"="];
			[result appendString:[TiUtils encodeQueryPart:[part substringFromIndex:range.location+1]]];
		}
		else 
		{
			[result appendString:[TiUtils encodeQueryPart:part]];
		}
		
		
		if (c + 1 < [parts count])
		{
			[result appendString:@"&"];
		}
	}
	
	return result;
}

+(NSString*)stringValue:(id)value
{
	if ([value isKindOfClass:[NSString class]])
	{
		return (NSString*)value;
	}
	else if ([value isKindOfClass:[NSNull class]])
	{
		return nil;
	}
	else if ([value respondsToSelector:@selector(stringValue)])
	{
		return [value stringValue];
	}
	return [value description];
}

+(BOOL)boolValue:(id)value def:(BOOL)def;
{
	if ([value respondsToSelector:@selector(boolValue)])
	{
		return [value boolValue];
	}
	return def;
}

+(BOOL)boolValue:(id)value
{
	return [self boolValue:value def:NO];
}

+(double)doubleValue:(id)value
{
	if ([value respondsToSelector:@selector(doubleValue)])
	{
		return [value doubleValue];
	}
	return 0;
}

+(CGRect)rectValue:(id)value
{
	if ([value isKindOfClass:[NSDictionary class]])
	{
		NSDictionary *dict = (NSDictionary*)value;
		CGFloat x = [TiUtils floatValue:@"x" properties:dict def:0];
		CGFloat y = [TiUtils floatValue:@"y" properties:dict def:0];
		CGFloat w = [TiUtils floatValue:@"width" properties:dict def:0];
		CGFloat h = [TiUtils floatValue:@"height" properties:dict def:0];
		return CGRectMake(x, y, w, h);
	}
	return CGRectMake(0, 0, 0, 0);
}

+(CGPoint)pointValue:(id)value
{
	if ([value isKindOfClass:[TiPoint class]])
	{
		return [value point];
	}
	if ([value isKindOfClass:[NSDictionary class]])
	{
		return CGPointMake([[value objectForKey:@"x"] floatValue],[[value objectForKey:@"y"] floatValue]);
	}
	return CGPointMake(0,0);
}

+(CGPoint)pointValue:(id)value bounds:(CGRect)bounds defaultOffset:(CGPoint)defaultOffset;
{
	TiDimension xDimension;
	TiDimension yDimension;
	CGPoint result;

	if ([value isKindOfClass:[TiPoint class]])
	{
		xDimension = [value xDimension];
		yDimension = [value yDimension];
	}
	else if ([value isKindOfClass:[NSDictionary class]])
	{
		xDimension = [self dimensionValue:@"x" properties:value];
		yDimension = [self dimensionValue:@"x" properties:value];
	}
	else
	{
		xDimension = TiDimensionUndefined;
		yDimension = TiDimensionUndefined;
	}

	if (!TiDimensionDidCalculateValue(xDimension, bounds.size.width, &result.x))
	{
		result.x = defaultOffset.x * bounds.size.width;
	}
	if (!TiDimensionDidCalculateValue(yDimension, bounds.size.height, &result.y))
	{
		result.y = defaultOffset.y * bounds.size.height;
	}

	return CGPointMake(result.x + bounds.origin.x,result.y + bounds.origin.y);
}



+(CGFloat)floatValue:(id)value def:(CGFloat) def
{
	if ([value respondsToSelector:@selector(floatValue)])
	{
		return [value floatValue];
	}
	return def;
}

+(CGFloat)floatValue:(id)value
{
	return [self floatValue:value def:0];
}

+(int)intValue:(id)value def:(int)def
{
	if ([value respondsToSelector:@selector(intValue)])
	{
		return [value intValue];
	}
	return def;
}

+(int)intValue:(id)value
{
	return [self intValue:value def:0];
}

+(TiColor*)colorValue:(id)value
{
	if ([value isKindOfClass:[TiColor class]])
	{
		return (TiColor*)value;
	}
	if ([value respondsToSelector:@selector(stringValue)])
	{
		value = [value stringValue];
	}
	if ([value isKindOfClass:[NSString class]])
	{
		return [TiColor colorNamed:value]; 
	}
	return nil;
}

+(TiDimension)dimensionValue:(id)value
{
	return TiDimensionFromObject(value);
}

+(id)valueFromDimension:(TiDimension)dimension
{
	switch (dimension.type)
	{
		case TiDimensionTypeUndefined:
			return [NSNull null];
		case TiDimensionTypeAuto:
			return @"auto";
		case TiDimensionTypePixels:
			return [NSNumber numberWithFloat:dimension.value];
	}
	return nil;
}

+(UIImage*)scaleImage:(UIImage *)image toSize:(CGSize)newSize
{
	if (!CGSizeEqualToSize(newSize, CGSizeZero))
	{
		CGSize imageSize = [image size];
		if (newSize.width==0)
		{
			newSize.width = imageSize.width;
		}
		if (newSize.height==0)
		{
			newSize.height = imageSize.height;
		}
		if (!CGSizeEqualToSize(newSize, imageSize))
		{
			image = [UIImageResize resizedImage:newSize interpolationQuality:kCGInterpolationDefault image:image];
		}
	}
	return image;
}

+(UIImage*)toImage:(id)object proxy:(TiProxy*)proxy size:(CGSize)imageSize
{
	if ([object isKindOfClass:[TiBlob class]])
	{
		return [self scaleImage:[(TiBlob *)object image] toSize:imageSize];
	}

	if ([object isKindOfClass:[TiFile class]])
	{
		TiFile *file = (TiFile*)object;
		UIImage *image = [UIImage imageWithContentsOfFile:[file path]];
		return [self scaleImage:image toSize:imageSize];
	}

	NSURL * urlAttempt = [self toURL:object proxy:proxy];
	UIImage * image = [[ImageLoader sharedLoader] loadImmediateImage:urlAttempt withSize:imageSize];
	return image;
	//Note: If url is a nonimmediate image, this returns nil.
}

+(UIImage*)toImage:(id)object proxy:(TiProxy*)proxy
{
	if ([object isKindOfClass:[TiBlob class]])
	{
		return [(TiBlob *)object image];
	}

	if ([object isKindOfClass:[TiFile class]])
	{
		TiFile *file = (TiFile*)object;
		UIImage *image = [UIImage imageWithContentsOfFile:[file path]];
		return image;
	}

	NSURL * urlAttempt = [self toURL:object proxy:proxy];
	UIImage * image = [[ImageLoader sharedLoader] loadImmediateImage:urlAttempt];
	return image;
	//Note: If url is a nonimmediate image, this returns nil.
}

+(NSURL*)toURL:(id)object proxy:(TiProxy*)proxy
{
	NSURL *url = nil;
	
	if ([object isKindOfClass:[NSString class]])
	{
		if ([object hasPrefix:@"/"])
		{
			return [NSURL fileURLWithPath:object];
		}
		if ([object hasPrefix:@"sms:"] || 
			[object hasPrefix:@"tel:"] ||
			[object hasPrefix:@"mailto:"])
		{
			return [NSURL URLWithString:object];
		}
		url = [NSURL URLWithString:object relativeToURL:[proxy _baseURL]];
		if (url==nil)
		{
			//encoding problem - fail fast and make sure we re-escape
			NSRange range = [object rangeOfString:@"?"];
			if (range.location != NSNotFound)
			{
				NSString *qs = [TiUtils encodeURIParameters:[object substringFromIndex:range.location+1]];
				NSString *newurl = [NSString stringWithFormat:@"%@?%@",[object substringToIndex:range.location],qs];
				return [NSURL URLWithString:newurl];
			}
		}
	}
	else if ([object isKindOfClass:[NSURL class]])
	{
		return [NSURL URLWithString:[object absoluteString] relativeToURL:[proxy _baseURL]];
	}
	return url;			  
}

+(UIImage *)stretchableImage:(id)object proxy:(TiProxy*)proxy
{
	return [[ImageLoader sharedLoader] loadImmediateStretchableImage:[self toURL:object proxy:proxy]];
}

+(UIImage *)image:(id)object proxy:(TiProxy*)proxy
{
	return [[ImageLoader sharedLoader] loadImmediateImage:[self toURL:object proxy:proxy]];
}


+(int)intValue:(NSString*)name properties:(NSDictionary*)properties def:(int)def exists:(BOOL*) exists
{
	if (properties != nil)
	{
		id value = [properties objectForKey:name];
		if ([value respondsToSelector:@selector(intValue)])
		{
			if (exists != NULL) *exists = YES;
			return [value intValue];
		}
	}
	if (exists != NULL) *exists = NO;
	return def;
}

+(double)doubleValue:(NSString*)name properties:(NSDictionary*)properties def:(double)def exists:(BOOL*) exists
{
	if (properties != nil)
	{
		id value = [properties objectForKey:name];
		if ([value respondsToSelector:@selector(doubleValue)])
		{
			if (exists != NULL) *exists = YES;
			return [value doubleValue];
		}
	}
	if (exists != NULL) *exists = NO;
	return def;
}

+(float)floatValue:(NSString*)name properties:(NSDictionary*)properties def:(float)def exists:(BOOL*) exists
{
	if (properties != nil)
	{
		id value = [properties objectForKey:name];
		if ([value respondsToSelector:@selector(floatValue)])
		{
			if (exists != NULL) *exists = YES;
			return [value floatValue];
		}		
	}
	if (exists != NULL) *exists = NO;
	return def;
}

+(BOOL)boolValue:(NSString*)name properties:(NSDictionary*)properties def:(BOOL)def exists:(BOOL*) exists
{
	if (properties != nil)
	{
		id value = [properties objectForKey:name];
		if ([value respondsToSelector:@selector(boolValue)])
		{
			if (exists != NULL) *exists = YES;
			return [value boolValue];
		}
	}
	if (exists != NULL) *exists = NO;
	return def;
}

+(NSString*)stringValue:(NSString*)name properties:(NSDictionary*)properties def:(NSString*)def exists:(BOOL*) exists
{
	if (properties != nil)
	{
		id value = [properties objectForKey:name];
		if ([value isKindOfClass:[NSString class]])
		{
			if (exists != NULL) *exists = YES;
			return value;
		}
		else if (value == [NSNull null])
		{
			if (exists != NULL) *exists = YES;
			return nil;
		}
		else if ([value respondsToSelector:@selector(stringValue)])
		{
			if (exists != NULL) *exists = YES;
			return [value stringValue];
		}
	}
	if (exists != NULL) *exists = NO;
	return def;
}

+(CGPoint)pointValue:(NSString*)name properties:(NSDictionary*)properties def:(CGPoint)def exists:(BOOL*) exists
{
	if (properties != nil)
	{
		id value = [properties objectForKey:name];
		if ([value isKindOfClass:[NSDictionary class]])
		{
			NSDictionary *dict = (NSDictionary*)value;
			CGPoint point;
			point.x = [self doubleValue:@"x" properties:dict def:def.x];
			point.y = [self doubleValue:@"y" properties:dict def:def.y];
			if (exists != NULL) *exists = YES;
			return point;
		}
	}

	if (exists != NULL) *exists = NO;
	return def;
}

+(TiColor*)colorValue:(NSString*)name properties:(NSDictionary*)properties def:(TiColor*)def exists:(BOOL*) exists
{
	TiColor * result = nil;
	if (properties != nil)
	{
		id value = [properties objectForKey:name];
		if (value == [NSNull null])
		{
			if (exists != NULL) *exists = YES;
			return nil;
		}
		if ([value respondsToSelector:@selector(stringValue)])
		{
			value = [value stringValue];
		}
		if ([value isKindOfClass:[NSString class]])
		{
			// need to retain here since we autorelease below and since colorName also autoreleases
			result = [[TiColor colorNamed:value] retain]; 
		}
	}
	if (result != nil)
	{
		if (exists != NULL) *exists = YES;
		return [result autorelease];
	}
	
	if (exists != NULL) *exists = NO;
	return def;
}

+(TiDimension)dimensionValue:(NSString*)name properties:(NSDictionary*)properties def:(TiDimension)def exists:(BOOL*) exists
{
	if (properties != nil)
	{
		id value = [properties objectForKey:name];
		if (value != nil)
		{
			if (exists != NULL)
			{
				*exists = YES;
			}
			return [self dimensionValue:value];
		}
	}
	if (exists != NULL)
	{
		*exists = NO;
	}
	return def;
	
}


+(int)intValue:(NSString*)name properties:(NSDictionary*)props def:(int)def;
{
	return [self intValue:name properties:props def:def exists:NULL];
}

+(double)doubleValue:(NSString*)name properties:(NSDictionary*)props def:(double)def;
{
	return [self doubleValue:name properties:props def:def exists:NULL];
}

+(float)floatValue:(NSString*)name properties:(NSDictionary*)props def:(float)def;
{
	return [self floatValue:name properties:props def:def exists:NULL];
}

+(BOOL)boolValue:(NSString*)name properties:(NSDictionary*)props def:(BOOL)def;
{
	return [self boolValue:name properties:props def:def exists:NULL];
}

+(NSString*)stringValue:(NSString*)name properties:(NSDictionary*)properties def:(NSString*)def;
{
	return [self stringValue:name properties:properties def:def exists:NULL];
}

+(CGPoint)pointValue:(NSString*)name properties:(NSDictionary*)properties def:(CGPoint)def;
{
	return [self pointValue:name properties:properties def:def exists:NULL];
}

+(TiColor*)colorValue:(NSString*)name properties:(NSDictionary*)properties def:(TiColor*)def;
{
	return [self colorValue:name properties:properties def:def exists:NULL];
}

+(TiDimension)dimensionValue:(NSString*)name properties:(NSDictionary*)properties def:(TiDimension)def
{
	return [self dimensionValue:name properties:properties def:def exists:NULL];
}



+(int)intValue:(NSString*)name properties:(NSDictionary*)props;
{
	return [self intValue:name properties:props def:0 exists:NULL];
}

+(double)doubleValue:(NSString*)name properties:(NSDictionary*)props;
{
	return [self doubleValue:name properties:props def:0.0 exists:NULL];
}

+(float)floatValue:(NSString*)name properties:(NSDictionary*)props;
{
	return [self floatValue:name properties:props def:0.0 exists:NULL];
}

+(BOOL)boolValue:(NSString*)name properties:(NSDictionary*)props;
{
	return [self boolValue:name properties:props def:NO exists:NULL];
}

+(NSString*)stringValue:(NSString*)name properties:(NSDictionary*)properties;
{
	return [self stringValue:name properties:properties def:nil exists:NULL];
}

+(CGPoint)pointValue:(NSString*)name properties:(NSDictionary*)properties;
{
	return [self pointValue:name properties:properties def:CGPointZero exists:NULL];
}

+(TiColor*)colorValue:(NSString*)name properties:(NSDictionary*)properties;
{
	return [self colorValue:name properties:properties def:nil exists:NULL];
}

+(TiDimension)dimensionValue:(NSString*)name properties:(NSDictionary*)properties
{
	return [self dimensionValue:name properties:properties def:TiDimensionUndefined exists:NULL];
}

+(NSDictionary*)pointToDictionary:(CGPoint)point
{
	return [NSDictionary dictionaryWithObjectsAndKeys:
			[NSNumber numberWithDouble:point.x],@"x",
			[NSNumber numberWithDouble:point.y],@"y",
			nil];
}

+(NSDictionary*)rectToDictionary:(CGRect)rect
{
	return [NSDictionary dictionaryWithObjectsAndKeys:
			[NSNumber numberWithDouble:rect.origin.x],@"x",
			[NSNumber numberWithDouble:rect.origin.y],@"y",
			[NSNumber numberWithDouble:rect.size.width],@"width",
			[NSNumber numberWithDouble:rect.size.height],@"height",
			nil];
}

+(CGRect)contentFrame:(BOOL)window
{
	double height = 0;
	if (window && ![[UIApplication sharedApplication] isStatusBarHidden])
	{
		CGRect statusFrame = [[UIApplication sharedApplication] statusBarFrame];
		height = statusFrame.size.height;
	}
	
	CGRect f = [[UIScreen mainScreen] applicationFrame];
	return CGRectMake(f.origin.x, height, f.size.width, f.size.height);
}

+(CGFloat)sizeValue:(id)value
{
	if ([value isKindOfClass:[NSString class]])
	{
		NSString *s = [(NSString*) value stringByReplacingOccurrencesOfString:@"px" withString:@""];
		return [[s stringByReplacingOccurrencesOfString:@" " withString:@""] floatValue];
	}
	return [value floatValue];
}

+(WebFont*)fontValue:(id)value def:(WebFont *)def
{
	if ([value isKindOfClass:[NSDictionary class]])
	{
		WebFont *font = [[WebFont alloc] init];
		[font updateWithDict:value inherits:nil];
		return [font autorelease];
	}
	if ([value isKindOfClass:[NSString class]])
	{
		WebFont *font = [[WebFont alloc] init];
		font.family = value;
		font.size = 14;
		return [font autorelease];
	}
	return def;
}


+(WebFont*)fontValue:(id)value
{
	WebFont * result = [self fontValue:value def:nil];
	if (result == nil) {
		result = [WebFont defaultFont];
	}
	return result;
}

+(UITextAlignment)textAlignmentValue:(id)alignment
{
	UITextAlignment align = UITextAlignmentLeft;

	if ([alignment isKindOfClass:[NSString class]])
	{
		if ([alignment isEqualToString:@"left"])
		{
			align = UITextAlignmentLeft;
		}
		else if ([alignment isEqualToString:@"center"])
		{
			align = UITextAlignmentCenter;
		}
		else if ([alignment isEqualToString:@"right"])
		{
			align = UITextAlignmentRight;
		}
	}
	else if ([alignment isKindOfClass:[NSNumber class]])
	{
		align = [alignment intValue];
	}
	return align;
}

+(NSString*)exceptionMessage:(id)arg
{
	if ([arg isKindOfClass:[NSDictionary class]])
	{
		// check to see if the object past is a JS Error object and if so attempt
		// to construct a string that is more readable to the developer
		id message = [arg objectForKey:@"message"];
		if (message!=nil)
		{
			id source = [arg objectForKey:@"sourceURL"];
			if (source!=nil)
			{
				id lineNumber = [arg objectForKey:@"line"];
				return [NSString stringWithFormat:@"%@ at %@ (line %@)",message,[source lastPathComponent],lineNumber];
			}
		}
	}
	return arg;
}

+(UIDeviceOrientation)orientationValue:(id)value def:(UIDeviceOrientation)def
{
	if ([value isKindOfClass:[NSString class]])
	{
		if ([value isEqualToString:@"portrait"])
		{
			return UIDeviceOrientationPortrait;
		}
		if ([value isEqualToString:@"landscape"])
		{
			return UIInterfaceOrientationLandscapeRight;
		}
	}

	if ([value respondsToSelector:@selector(intValue)])
	{
		return [value intValue];
	}
	return def;
}

+(BOOL)isOrientationPortait
{
	return UIInterfaceOrientationIsPortrait([self orientation]);
}

+(BOOL)isOrientationLandscape
{
	return UIInterfaceOrientationIsLandscape([self orientation]);
}

+(UIInterfaceOrientation)orientation 
{
	UIDeviceOrientation orient = [UIDevice currentDevice].orientation;
	if (UIDeviceOrientationUnknown == 0) 
	{
		return UIDeviceOrientationPortrait;
	} 
	else 
	{
		return orient;
	}
}

+(CGRect)screenRect
{
	return [UIScreen mainScreen].bounds;
}

//TODO: rework these to be more accurate and multi-device

+(CGRect)navBarRect
{
	CGRect rect = [self screenRect];
	rect.size.height = TI_NAVBAR_HEIGHT;
	return rect;
}

+(CGSize)navBarTitleViewSize
{
	CGRect rect = [self screenRect];
	return CGSizeMake(rect.size.width-TI_NAVBAR_BUTTON_WIDTH, TI_NAVBAR_HEIGHT);
}

+(CGRect)navBarTitleViewRect
{
	CGRect rect = [self screenRect];
	rect.size.height = TI_NAVBAR_HEIGHT;
	rect.size.width-=TI_NAVBAR_BUTTON_WIDTH; // offset for padding on both sides
	return rect;
}

+(CGPoint)centerSize:(CGSize)smallerSize inRect:(CGRect)largerRect
{
	return CGPointMake(
		largerRect.origin.x + (largerRect.size.width - smallerSize.width)/2,
		largerRect.origin.y + (largerRect.size.height - smallerSize.height)/2);
}

+(CGRect)centerRect:(CGRect)smallerRect inRect:(CGRect)largerRect
{
	smallerRect.origin = [self centerSize:smallerRect.size inRect:largerRect];

	return smallerRect;
}

#define USEFRAME	0

+(void)setView:(UIView *)view positionRect:(CGRect)frameRect
{
#if	USEFRAME
	[view setFrame:frameRect];
	return;
#endif
	
	CGPoint anchorPoint = [[view layer] anchorPoint];
	CGPoint newCenter;
	newCenter.x = frameRect.origin.x + (anchorPoint.x * frameRect.size.width);
	newCenter.y = frameRect.origin.y + (anchorPoint.y * frameRect.size.height);
	CGRect newBounds = CGRectMake(0, 0, frameRect.size.width, frameRect.size.height);

	[view setBounds:newBounds];
	[view setCenter:newCenter];
}

+(CGRect)viewPositionRect:(UIView *)view
{
#if	USEFRAME
	return [view frame];
#endif

	CGPoint anchorPoint = [[view layer] anchorPoint];
	CGRect bounds = [view bounds];
	CGPoint center = [view center];
	
	return CGRectMake(center.x - (anchorPoint.x * bounds.size.width),
			center.y - (anchorPoint.y * bounds.size.height),
			bounds.size.width, bounds.size.height);
}

+(NSData *)loadAppResource:(NSURL*)url
{
	BOOL app = [[url scheme] hasPrefix:@"app"];
	if ([url isFileURL] || app)
	{
		BOOL had_splash_removed = NO;
		NSString *urlstring = [[url standardizedURL] path];
		NSString *resourceurl = [[NSBundle mainBundle] resourcePath];
		NSRange range = [urlstring rangeOfString:resourceurl];
		NSString *appurlstr = urlstring;
		if (range.location!=NSNotFound)
		{
			appurlstr = [urlstring substringFromIndex:range.location + range.length + 1];
		}
		if ([appurlstr hasPrefix:@"/"])
		{
			had_splash_removed = YES;
			appurlstr = [appurlstr substringFromIndex:1];
		}
#ifdef TARGET_IPHONE_SIMULATOR
		if (app==YES && had_splash_removed)
		{
			// on simulator we want to keep slash since it's coming from file
			appurlstr = [@"/" stringByAppendingString:appurlstr];
		}
		if (TI_APPLICATION_RESOURCE_DIR!=nil && [TI_APPLICATION_RESOURCE_DIR isEqualToString:@""]==NO)
		{
			if ([appurlstr hasPrefix:TI_APPLICATION_RESOURCE_DIR])
			{
				if ([[NSFileManager defaultManager] fileExistsAtPath:appurlstr])
				{
					return [NSData dataWithContentsOfFile:appurlstr];
				}
			}
			// this path is only taken during a simulator build
			// in this path, we will attempt to load resources directly from the
			// app's Resources directory to speed up round-trips
			NSString *filepath = [TI_APPLICATION_RESOURCE_DIR stringByAppendingPathComponent:appurlstr];
			if ([[NSFileManager defaultManager] fileExistsAtPath:filepath])
			{
				return [NSData dataWithContentsOfFile:filepath];
			}
		}
#endif
		static id AppRouter;
		if (AppRouter==nil)
		{
			AppRouter = NSClassFromString(@"ApplicationRouting");
		}
		if (AppRouter!=nil)
		{
			appurlstr = [appurlstr stringByReplacingOccurrencesOfString:@"." withString:@"_"];
			if ([appurlstr characterAtIndex:0]=='/')
			{
				appurlstr = [appurlstr substringFromIndex:1];
			}
#ifdef DEBUG			
			NSLog(@"[DEBUG] loading: %@, resource: %@",urlstring,appurlstr);
#endif			
			return [AppRouter performSelector:@selector(resolveAppAsset:) withObject:appurlstr];
		}
	}
	return nil;
}

+(BOOL)barTranslucencyForColor:(TiColor *)color
{
	return [color _color]==[UIColor clearColor];
}

+(UIColor *)barColorForColor:(TiColor *)color
{
	UIColor * result = [color _color];
	if ((result == [UIColor clearColor]) || (result == [UIColor blackColor]))
	{
		return nil;
	}
	return result;
}

+(UIBarStyle)barStyleForColor:(TiColor *)color
{
	UIColor * result = [color _color];
	if ((result == [UIColor clearColor]) || (result == [UIColor blackColor]))
	{
		return UIBarStyleBlack;
	}
	return UIBarStyleDefault;
}


+(void)applyColor:(TiColor *)color toNavigationController:(UINavigationController *)navController
{
	UIColor * barColor = [self barColorForColor:color];
	UIBarStyle barStyle = [self barStyleForColor:color];
	BOOL isTranslucent = [self barTranslucencyForColor:color];

	UINavigationBar * navBar = [navController navigationBar];
	[navBar setBarStyle:barStyle];
	[navBar setTranslucent:isTranslucent];
	[navBar setTintColor:barColor];

	UIToolbar * toolBar = [navController toolbar];
	[toolBar setBarStyle:barStyle];
	[toolBar setTranslucent:isTranslucent];
	[toolBar setTintColor:barColor];
}

@end
