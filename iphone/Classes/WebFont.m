//
//  WebFont.m
//  Titanium
//
//  Created by Blain Hamon on 8/28/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import "WebFont.h"

UIFont * UIFontFromDictWithDefaultSizeWeight(NSDictionary * fontDict,float fontSize,BOOL isBold){
	float multiplier = 1.0; //Default is px.

	id sizeObject = [fontDict objectForKey:@"fontSize"];
	if([sizeObject isKindOfClass:[NSString class]]){
		sizeObject = [sizeObject lowercaseString];
		if([sizeObject hasSuffix:@"px"]){
			sizeObject = [sizeObject substringToIndex:[sizeObject length]-2];
		}
		//TODO: Mod multipler with different suffixes (in, cm, etc)
	}
	if([sizeObject respondsToSelector:@selector(floatValue)]){
		fontSize = multiplier * [sizeObject floatValue];
	}
	if(fontSize < 5)fontSize = [UIFont systemFontSize];
	
	NSString * isBoldObject = [fontDict objectForKey:@"fontWeight"];
	if([isBoldObject isKindOfClass:[NSString class]]){
		isBoldObject = [isBoldObject lowercaseString];
		if([isBoldObject isEqualToString:@"bold"]){
			isBold = YES;
		} else if([isBoldObject isEqualToString:@"normal"]){
			isBold = NO;
		}
	}

	//TODO: Italics
	
	UIFont * result=nil;

	//TODO grab font name

	if(result==nil){
		if(isBold){
			result = [UIFont boldSystemFontOfSize:fontSize];
		} else {
			result = [UIFont systemFontOfSize:fontSize];
		}
	}
	return result;
}

