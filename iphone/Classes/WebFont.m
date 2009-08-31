//
//  WebFont.m
//  Titanium
//
//  Created by Blain Hamon on 8/28/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import "WebFont.h"

BOOL UpdateFontDescriptionFromDict(NSDictionary * fontDict,TitaniumFontDescription * result)
{
	BOOL didChange = NO;
	
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
		float fontSize = multiplier * [sizeObject floatValue];
		if (fontSize != result->size){
			didChange = YES;
			result->size = fontSize;
		}
	}

	NSString * isBoldObject = [fontDict objectForKey:@"fontWeight"];
	if([isBoldObject isKindOfClass:[NSString class]]){
		isBoldObject = [isBoldObject lowercaseString];
		if([isBoldObject isEqualToString:@"bold"]){
			didChange |= !(result->isBold);
			result->isBold = YES;
		} else if([isBoldObject isEqualToString:@"normal"]){
			didChange |= (result->isBold);
			result->isBold = NO;
		}
	}

	return didChange;
}

UIFont * FontFromDescription(TitaniumFontDescription * inputDesc)
{
	UIFont * result;
	if (inputDesc->isBold){
		result = [UIFont boldSystemFontOfSize:inputDesc->size];
	} else {
		result = [UIFont systemFontOfSize:inputDesc->size];
	}

	return result;
}

//UIFont * UIFontFromDictWithDefaultSizeWeight(NSDictionary * fontDict,float fontSize,BOOL isBold){
//	float multiplier = 1.0; //Default is px.
//
//	id sizeObject = [fontDict objectForKey:@"fontSize"];
//	if([sizeObject isKindOfClass:[NSString class]]){
//		sizeObject = [sizeObject lowercaseString];
//		if([sizeObject hasSuffix:@"px"]){
//			sizeObject = [sizeObject substringToIndex:[sizeObject length]-2];
//		}
//		//TODO: Mod multipler with different suffixes (in, cm, etc)
//	}
//	if([sizeObject respondsToSelector:@selector(floatValue)]){
//		fontSize = multiplier * [sizeObject floatValue];
//	}
//	if(fontSize < 5)fontSize = [UIFont systemFontSize];
//	
//	NSString * isBoldObject = [fontDict objectForKey:@"fontWeight"];
//	if([isBoldObject isKindOfClass:[NSString class]]){
//		isBoldObject = [isBoldObject lowercaseString];
//		if([isBoldObject isEqualToString:@"bold"]){
//			isBold = YES;
//		} else if([isBoldObject isEqualToString:@"normal"]){
//			isBold = NO;
//		}
//	}
//
//	
//	
//	UIFont * result=nil;
//
//	//TODO grab font name
//
//	if(result==nil){
//		if(isBold){
//			result = [UIFont boldSystemFontOfSize:fontSize];
//		} else {
//			result = [UIFont systemFontOfSize:fontSize];
//		}
//	}
//	return result;
//}
//
