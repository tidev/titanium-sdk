/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiColor.h"
#import "TiDimension.h"
#import "WebFont.h"
#import "TiFile.h"

@interface TiUtils : NSObject {

}

+(NSString *)UTCDateForDate:(NSDate*)data;
+(NSDate *)dateForUTCDate:(NSString*)date;

+(NSString *)UTCDate;

+(NSString*)createUUID;

+(TiFile*)createTempFile:(NSString*)extension;

+(NSData *)loadAppResource:(NSURL*)url;

+(NSString *)encodeQueryPart:(NSString *)unencodedString;

+(NSString *)encodeURIParameters:(NSString *)unencodedString;


+(UIImage*)toImage:(id)object proxy:(TiProxy*)proxy size:(CGSize)imageSize;
+(UIImage*)toImage:(id)object proxy:(TiProxy*)proxy;

+(NSURL*)toURL:(id)object proxy:(TiProxy*)proxy;

+(UIImage *)image:(id)object proxy:(TiProxy*)proxy;

+(UIImage *)stretchableImage:(id)object proxy:(TiProxy*)proxy;

+(NSString*)stringValue:(id)value;

+(BOOL)boolValue:(id)value;

+(BOOL)boolValue:(id)value def:(BOOL)def;

+(CGPoint)pointValue:(id)value;
+(CGPoint)pointValue:(id)value bounds:(CGRect)bounds defaultOffset:(CGPoint)defaultOffset;

+(CGRect)rectValue:(id)value;

+(CGFloat)floatValue:(id)value;

+(CGFloat)floatValue:(id)value def:(CGFloat) def;

+(double)doubleValue:(id)value;

+(int)intValue:(id)value;

+(int)intValue:(id)value def:(int)def;

+(TiColor*)colorValue:(id)value;

+(TiDimension)dimensionValue:(id)value;

+(id)valueFromDimension:(TiDimension)dimension;


+(int)intValue:(NSString*)name properties:(NSDictionary*)props def:(int)def exists:(BOOL*) exists;

+(double)doubleValue:(NSString*)name properties:(NSDictionary*)props def:(double)def exists:(BOOL*) exists;

+(float)floatValue:(NSString*)name properties:(NSDictionary*)props def:(float)def exists:(BOOL*) exists;

+(BOOL)boolValue:(NSString*)name properties:(NSDictionary*)props def:(BOOL)def exists:(BOOL*) exists;

+(NSString*)stringValue:(NSString*)name properties:(NSDictionary*)properties def:(NSString*)def exists:(BOOL*) exists;

+(CGPoint)pointValue:(NSString*)name properties:(NSDictionary*)properties def:(CGPoint)def exists:(BOOL*) exists;

+(TiColor*)colorValue:(NSString*)name properties:(NSDictionary*)properties def:(TiColor*)def exists:(BOOL*) exists;

+(TiDimension)dimensionValue:(NSString*)name properties:(NSDictionary*)properties def:(TiDimension)def exists:(BOOL*) exists;


+(int)intValue:(NSString*)name properties:(NSDictionary*)props def:(int)def;

+(double)doubleValue:(NSString*)name properties:(NSDictionary*)props def:(double)def;

+(float)floatValue:(NSString*)name properties:(NSDictionary*)props def:(float)def;

+(BOOL)boolValue:(NSString*)name properties:(NSDictionary*)props def:(BOOL)def;

+(NSString*)stringValue:(NSString*)name properties:(NSDictionary*)properties def:(NSString*)def;

+(CGPoint)pointValue:(NSString*)name properties:(NSDictionary*)properties def:(CGPoint)def;

+(TiColor*)colorValue:(NSString*)name properties:(NSDictionary*)properties def:(TiColor*)def;

+(TiDimension)dimensionValue:(NSString*)name properties:(NSDictionary*)properties def:(TiDimension)def;


+(WebFont*)fontValue:(NSDictionary*)properties def:(WebFont*)def;

+(int)intValue:(id)value def:(int)def;

+(UIDeviceOrientation)orientationValue:(id)value def:(UIDeviceOrientation)def;

+(int)intValue:(NSString*)name properties:(NSDictionary*)props;

+(double)doubleValue:(NSString*)name properties:(NSDictionary*)props;

+(float)floatValue:(NSString*)name properties:(NSDictionary*)props;

+(BOOL)boolValue:(NSString*)name properties:(NSDictionary*)props;

+(NSString*)stringValue:(NSString*)name properties:(NSDictionary*)properties;

+(CGPoint)pointValue:(NSString*)name properties:(NSDictionary*)properties;

+(TiColor*)colorValue:(NSString*)name properties:(NSDictionary*)properties;

+(TiDimension)dimensionValue:(NSString*)name properties:(NSDictionary*)properties;

+(NSDictionary*)pointToDictionary:(CGPoint)point;

+(NSDictionary*)rectToDictionary:(CGRect)rect;

+(NSDictionary*)sizeToDictionary:(CGSize)size;

+(UIEdgeInsets)contentInsets:(id)value;

+(CGRect)contentFrame:(BOOL)window;

+(CGFloat)sizeValue:(id)value;

+(WebFont*)fontValue:(id)value;

+(UITextAlignment)textAlignmentValue:(id)alignment;

+(NSString*)exceptionMessage:(id)arg;

+(BOOL)isOrientationPortait;

+(BOOL)isOrientationLandscape;

+(UIInterfaceOrientation)orientation;

+(CGRect)navBarRect;

+(CGSize)navBarTitleViewSize;

+(CGRect)navBarTitleViewRect;

+(CGRect)screenRect;

+(CGPoint)centerSize:(CGSize)smallerSize inRect:(CGRect)largerRect;

+(CGRect)centerRect:(CGRect)smallerRect inRect:(CGRect)largerRect;

+(void)setView:(UIView *)view positionRect:(CGRect)frameRect;

+(CGRect)viewPositionRect:(UIView *)view;

+(BOOL)barTranslucencyForColor:(TiColor *)color;
+(UIColor *)barColorForColor:(TiColor *)color;
+(UIBarStyle)barStyleForColor:(TiColor *)color;

+(void)applyColor:(TiColor *)color toNavigationController:(UINavigationController *)navController;

+(void)queueAnalytics:(NSString*)type name:(NSString*)name data:(NSDictionary*)data;

+(BOOL)isIPad;

+(BOOL)isiPhoneOS3_2OrGreater;
+(BOOL)isIOS4OrGreater;

+(BOOL)isIPhone4;

@end
