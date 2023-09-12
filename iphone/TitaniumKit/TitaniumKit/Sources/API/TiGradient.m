/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiGradient.h"

#import "TiUtils.h"

@implementation TiGradientLayer
@synthesize gradient;

- (void)dealloc
{
  [gradient release];
  [super dealloc];
}

- (void)drawInContext:(CGContextRef)ctx
{
  [gradient paintContext:ctx bounds:[self bounds]];
}

@end

@implementation TiGradient
@synthesize backfillStart, backfillEnd;

- (void)ensureOffsetArraySize:(NSUInteger)newSize
{
  if (newSize <= arraySize) {
    return;
  }
  colorOffsets = realloc(colorOffsets, (sizeof(CGFloat) * newSize));
  for (NSUInteger i = arraySize; i < newSize; i++) {
    colorOffsets[i] = -1;
  }
  arraySize = newSize;
}

- (CGGradientRef)cachedGradient
{
  if ((cachedGradient == NULL) && (colorValues != NULL)) {
    CGColorSpaceRef rgb = CGColorSpaceCreateDeviceRGB();
    BOOL needsFreeing = NO;

    CGFloat *tempOffsets;
    if (offsetsDefined == CFArrayGetCount(colorValues)) {
      tempOffsets = colorOffsets;
    } else {
      tempOffsets = NULL;
    }
    //TODO: Between these extremes, we should do intelligent gradient computation.

    cachedGradient = CGGradientCreateWithColors(rgb, colorValues, tempOffsets);

    if (needsFreeing) {
      free(tempOffsets);
    }
    CGColorSpaceRelease(rgb);
  }
  return cachedGradient;
}

- (void)clearCache
{
  if (cachedGradient != NULL) {
    CGGradientRelease(cachedGradient);
    cachedGradient = NULL;
  }
}

- (void)dealloc
{
  if (colorValues != NULL) {
    CFRelease(colorValues);
  }
  [endPoint release];
  [startPoint release];
  [self clearCache];
  free(colorOffsets);
  [super dealloc];
}

- (id)type
{
  switch (type) {
  case TiGradientTypeRadial:
    return @"radial";
  default: {
    break;
  }
  }
  return @"linear";
}

- (void)setType:(id)newType
{
  ENSURE_TYPE(newType, NSString);

  [self clearCache];
  [self replaceValue:newType forKey:@"type" notification:NO];

  if ([newType compare:@"linear" options:NSCaseInsensitiveSearch] == NSOrderedSame) {
    type = TiGradientTypeLinear;
    return;
  }

  if ([newType compare:@"radial" options:NSCaseInsensitiveSearch] == NSOrderedSame) {
    type = TiGradientTypeRadial;
    return;
  }

  [self throwException:TiExceptionInvalidType subreason:@"Must be either 'linear' or 'radial'" location:CODELOCATION];
}

- (void)setStartPoint:(id)newStart
{
  if (startPoint == nil) {
    startPoint = [[TiPoint alloc] initWithObject:newStart];
  } else {
    [startPoint setValues:newStart];
  }
  [self replaceValue:newStart forKey:@"startPoint" notification:NO];
}

- (void)setEndPoint:(id)newEnd
{
  if (endPoint == nil) {
    endPoint = [[TiPoint alloc] initWithObject:newEnd];
  } else {
    [endPoint setValues:newEnd];
  }
  [self replaceValue:newEnd forKey:@"endPoint" notification:NO];
}

- (void)setStartRadius:(id)newRadius
{
  startRadius = [TiUtils dimensionValue:newRadius];
  [self replaceValue:newRadius forKey:@"startRadius" notification:NO];
}

- (void)setEndRadius:(id)newRadius
{
  endRadius = [TiUtils dimensionValue:newRadius];
  [self replaceValue:newRadius forKey:@"endRadius" notification:NO];
}

- (id)endRadius
{
  return [self valueForUndefinedKey:@"endRadius"];
}

- (id)startRadius
{
  return [self valueForUndefinedKey:@"startRadius"];
}

- (void)setColors:(NSArray *)newColors;
{
  ENSURE_TYPE(newColors, NSArray);
  if (colorValues == NULL) {
    colorValues = CFArrayCreateMutable(NULL, [newColors count], &kCFTypeArrayCallBacks);
  } else {
    CFArrayRemoveAllValues(colorValues);
  }

  [self ensureOffsetArraySize:[newColors count]];
  int currentIndex = 0;
  offsetsDefined = 0;

  Class dictClass = [NSDictionary class];
  for (id thisEntry in newColors) {
    CGFloat thisOffset = -1;
    if ([thisEntry isKindOfClass:dictClass]) {
      thisOffset = [TiUtils floatValue:@"offset" properties:thisEntry def:-1];
      thisEntry = [thisEntry objectForKey:@"color"];
    }

    UIColor *thisColor = [[TiUtils colorValue:thisEntry] _color];

    if (thisColor == nil) {
      [self throwException:TiExceptionInvalidType
                 subreason:
                     @"Colors must be an array of colors or objects with a color property"
                  location:CODELOCATION];
    }

    CGColorSpaceRef colorspace = CGColorGetColorSpace([thisColor CGColor]);
    if (CGColorSpaceGetModel(colorspace) == kCGColorSpaceModelMonochrome) //Colorize this! Where's Ted Turner?
    {
      const CGFloat *components = CGColorGetComponents([thisColor CGColor]);
      thisColor = [UIColor colorWithRed:components[0]
                                  green:components[0]
                                   blue:components[0]
                                  alpha:components[1]];
    }

    colorOffsets[currentIndex] = thisOffset;
    if (thisOffset != -1) {
      offsetsDefined++;
    }

    CFArrayAppendValue(colorValues, [thisColor CGColor]);
    currentIndex++;
  }
  [self clearCache];
  [self replaceValue:newColors forKey:@"colors" notification:NO];
}

#define PYTHAG(bounds) sqrt(bounds.width *bounds.width + bounds.height * bounds.height) / 2

- (void)paintContext:(CGContextRef)context bounds:(CGRect)bounds
{
  CGGradientDrawingOptions options = 0;
  if (backfillStart) {
    options |= kCGGradientDrawsBeforeStartLocation;
  }
  if (backfillEnd) {
    options |= kCGGradientDrawsAfterEndLocation;
  }

  switch (type) {
  case TiGradientTypeLinear:
    CGContextDrawLinearGradient(context, [self cachedGradient],
        [TiUtils pointValue:startPoint
                     bounds:bounds
              defaultOffset:CGPointZero],
        [TiUtils pointValue:endPoint
                     bounds:bounds
              defaultOffset:CGPointMake(0, 1)],
        options);
    break;
  case TiGradientTypeRadial: {
    CGFloat startRadiusPixels;
    CGFloat endRadiusPixels;
    switch (startRadius.type) {
    case TiDimensionTypeDip:
      startRadiusPixels = startRadius.value;
      break;
    case TiDimensionTypePercent:
      startRadiusPixels = startRadius.value * PYTHAG(bounds.size);
      break;
    default:
      startRadiusPixels = 0;
    }

    switch (endRadius.type) {
    case TiDimensionTypeDip:
      endRadiusPixels = endRadius.value;
      break;
    case TiDimensionTypePercent:
      endRadiusPixels = endRadius.value * PYTHAG(bounds.size);
      break;
    default:
      endRadiusPixels = PYTHAG(bounds.size);
    }

    CGContextDrawRadialGradient(context, [self cachedGradient],
        [TiUtils pointValue:startPoint
                     bounds:bounds
              defaultOffset:CGPointMake(0.5, 0.5)],
        startRadiusPixels,
        [TiUtils pointValue:endPoint
                     bounds:bounds
              defaultOffset:CGPointMake(0.5, 0.5)],
        endRadiusPixels,
        options);
  } break;
  }
}

+ (TiGradient *)gradientFromObject:(id)value proxy:(TiProxy *)proxy
{
  if ([value isKindOfClass:[NSDictionary class]]) {
    id<TiEvaluator> context = ([proxy executionContext] == nil) ? [proxy pageContext] : [proxy executionContext];
    TiGradient *newGradient = [[[TiGradient alloc] _initWithPageContext:context] autorelease];
    [newGradient _initWithProperties:value];
    return newGradient;
  } else if ([value isKindOfClass:[TiGradient class]]) {
    return value;
  }
  return nil;
}

@end
