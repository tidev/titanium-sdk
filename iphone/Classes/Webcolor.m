/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "Webcolor.h"
#import "TiBase.h"


UIColor * checkmarkColor = nil;
NSMutableDictionary * colorLookup = nil;

BOOL isASCIIHexDigit(unichar c) { return (c >= '0' && c <= '9') || ((c | 0x20) >= 'a' && (c | 0x20) <= 'f'); }
int toASCIIHexValue(unichar c) {return (c & 0xF) + (c < 'A' ? 0 : 9); }

UIColor * UIColorCheckmarkColor()
{
	if(checkmarkColor==nil)
	{
		checkmarkColor = RGBACOLOR(55.0,79.0,130.0,1);
	}
	return checkmarkColor;
}

UIColor * UIColorWebColorNamed(NSString * colorName)
{
	if (![colorName isKindOfClass:[NSString class]])
	{
		return nil;
	}
	colorName = [colorName stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceCharacterSet]];
	if (colorLookup == nil)
	{
		UIColor * white = [UIColor whiteColor];
		UIColor * black = [UIColor blackColor];
		colorLookup = [[NSMutableDictionary alloc] initWithObjectsAndKeys:
					   black,@"black",
					   [UIColor grayColor],@"gray",
					   [UIColor darkGrayColor],@"darkgray",
					   [UIColor lightGrayColor],@"lightgray",
					   white,@"white",
					   [UIColor redColor],@"red",
					   [UIColor greenColor],@"green",
					   [UIColor blueColor],@"blue",
					   [UIColor cyanColor],@"cyan",
					   [UIColor yellowColor],@"yellow",
					   [UIColor magentaColor],@"magenta",
					   [UIColor orangeColor],@"orange",
					   [UIColor purpleColor],@"purple",
					   [UIColor brownColor],@"brown",
					   [UIColor clearColor],@"transparent",
					   [UIColor groupTableViewBackgroundColor],@"stripped",
					   
					   // these are also defined by the W3C HTML spec so we support them
					   UIColorForHex(@"#0ff"),@"aqua",
					   UIColorForHex(@"#f0f"),@"fuchsia",
					   UIColorForHex(@"#0f0"),@"lime",
					   UIColorForHex(@"#800"),@"maroon",
					   UIColorForHex(@"#FFC0CB"),@"pink",
					   UIColorForHex(@"#000080"),@"navy",
					   UIColorForHex(@"#c0c0c0"),@"silver",
					   UIColorForHex(@"#808000"),@"olive",
					   UIColorForHex(@"#008080"),@"teal",

					   white,@"fff",
					   white,@"ffff",
					   white,@"ffffff",
					   white,@"ffffffff",
					   black,@"000",
					   black,@"f000",
					   black,@"000000",
					   black,@"ff000000",
					   nil];
	}
	if ([colorName hasPrefix:@"#"]) 
	{
		colorName = [colorName substringFromIndex:1];
	}
	colorName = [colorName lowercaseString];
	UIColor * result = [colorLookup objectForKey:colorName];

	if (result != nil)
	{
		return result;
	}
	
	result = UIColorForHex(colorName);
	
	if (result == nil)
	{
		result = UIColorForRGBFunction(colorName);
	}
	
	if (result != nil) 
	{
		[colorLookup setObject:result forKey:colorName];
	}
	
	return result;
}

UIColor * UIColorForRGBFunction(NSString * functionString)
{ 
	int stringLength=[functionString length];
	NSRange openParensRange = [functionString rangeOfString:@"("];
	if (openParensRange.location == NSNotFound) 
	{
		return nil;
	}

	//Last char must be terminating ).
	if ([functionString characterAtIndex:stringLength-1] != ')') 
	{
		return nil;
	}

	NSRange searchRange;
	NSRange nextTokenRange;
	int segmentLength;

	searchRange.location = openParensRange.location + 1; //Skipping starting (
	searchRange.length = stringLength - searchRange.location - 1; //-1 for terminating ).

	nextTokenRange = [functionString rangeOfString:@"," options:NSLiteralSearch range:searchRange];
	if (nextTokenRange.location == NSNotFound)
	{
		return nil;
	}

	segmentLength = nextTokenRange.location - searchRange.location; //This does NOT include a comma.
	float firstArg = [[functionString substringWithRange:NSMakeRange(searchRange.location, segmentLength)] floatValue];
	
	searchRange.location += segmentLength + 1;	searchRange.length -= segmentLength + 1;

	nextTokenRange = [functionString rangeOfString:@"," options:NSLiteralSearch range:searchRange];
	if (nextTokenRange.location == NSNotFound) 
	{
		return nil;
	}
	
	segmentLength = nextTokenRange.location - searchRange.location; //This does NOT include a comma.
	float secondArg = [[functionString substringWithRange:NSMakeRange(searchRange.location, segmentLength)] floatValue];
	
	searchRange.location += segmentLength + 1;	searchRange.length -= segmentLength + 1;
	
	nextTokenRange = [functionString rangeOfString:@"," options:NSLiteralSearch range:searchRange];

	float thirdArg, fourthArg = 1.0;
	if (nextTokenRange.location == NSNotFound) 
	{
		thirdArg = [[functionString substringWithRange:searchRange] floatValue];
	} 
	else 
	{
		segmentLength = nextTokenRange.location - searchRange.location;
		thirdArg = [[functionString substringWithRange:NSMakeRange(searchRange.location, segmentLength)] floatValue];
		fourthArg = [[functionString substringWithRange:NSMakeRange(nextTokenRange.location+1,searchRange.length - segmentLength - 1)] floatValue];
	}
	
	return RGBACOLOR(firstArg,secondArg,thirdArg,fourthArg);
}


UIColor * UIColorForHex(NSString * hexCode)
{
    unsigned length = [hexCode length];
	float alpha = 1.0;
    if ((length != 3) && (length != 4) && (length != 6) && (length!=7) && (length != 8))
	{
		NSLog(@"[WARN] Hex color passed looks invalid: %@",hexCode);
        return nil;
	}
    unsigned value = 0;

    for (size_t i = 0; i < length; ++i) 
	{
		unichar thisChar = [hexCode characterAtIndex:i];
		if (thisChar=='#') continue;
        if (!isASCIIHexDigit(thisChar))
		{
            return nil;
		}
        value <<= 4;
        value |= toASCIIHexValue(thisChar);
    }

	if (length < 6) 
	{
		value = ((value & 0xF000) << 16) |
				((value & 0xFF00) << 12) |
				((value & 0xFF0) << 8) |
				((value & 0xFF) << 4) |
				(value & 0xF);
	}

	if((length % 4)==0)
	{
		alpha = ((value >> 24) & 0xFF) / 255.0;
	}

	int red = (value >> 16) & 0xFF;
	int green = (value >> 8) & 0xFF;
	int blue = value & 0xFF;

	return RGBACOLOR(red,green,blue,alpha);
}

void UIColorFlushCache()
{
	RELEASE_TO_NIL(colorLookup);
	RELEASE_TO_NIL(checkmarkColor);
}
