/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "TiDOMValidator.h"
#import "TiUtils.h"
#import <libxml/tree.h>


@implementation TiDOMValidator


+(BOOL)isURICharacter:(unichar)c
{
	if (c >= 'a' && c <= 'z') return YES;
	if (c >= 'A' && c <= 'Z') return YES;
	if (c >= '0' && c <= '9') return YES;
	if (c == '/') return YES;
	if (c == '-') return YES;
	if (c == '.') return YES;
	if (c == '?') return YES;
	if (c == ':') return YES;
	if (c == '@') return YES;
	if (c == '&') return YES;
	if (c == '=') return YES;
	if (c == '+') return YES;
	if (c == '$') return YES;
	if (c == ',') return YES;
	if (c == '%') return YES;
	
	if (c == '_') return YES;
	if (c == '!') return YES;
	if (c == '~') return YES;
	if (c == '*') return YES;
	if (c == '\'') return YES;
	if (c == '(') return YES;
	if (c == ')') return YES;
	return NO;
}

+(BOOL)isHexDigit:(unichar)c
{
	if (c >= '0' && c <= '9') return YES;
	if (c >= 'A' && c <= 'F') return YES;
	if (c >= 'a' && c <= 'f') return YES;
	
	return NO;
}

+(BOOL)checkIsValidURI:(NSString*)pName
{
	int strLen = [pName length];
	int i = 0;
	for (i = 0; i < strLen; i++) {
		unichar c = [pName characterAtIndex:i];
		
		if (![self isURICharacter:c]) {
			return NO;
		}
		
		if (c == '%') {// must be followed by two hexadecimal digits
			if ( (strLen - i) > 2) {
				unichar c1 = [pName characterAtIndex:(i+1)];
				unichar c2 = [pName characterAtIndex:(i+2)];
				
				if ( (![self isHexDigit:c1]) || (![self isHexDigit:c2]) ){
					return NO;
				}
			}
			else {
				//Insufficient characters for two hexadecimal digits
				return NO;
			}
		}
	}
	return YES;
}

+(BOOL)checkElementName:(NSString*)pName
{
	return (xmlValidateNCName((xmlChar*)[pName UTF8String], 0) == 0);
}

+(BOOL)checkAttributeName:(NSString*)pName
{
	if ([self checkElementName:pName]) {
		if ([[pName lowercaseString] isEqualToString:@"xmlns"])
			return NO;
		
		return YES;
	}
	return NO;
}

+(BOOL)checkNamespacePrefix:(NSString*)pName
{
	//Can be nil or empty
	if ([pName length]==0) {
		return YES;
	}
	
	if (xmlValidateNCName((xmlChar*)[pName UTF8String], 0) == 0) {
		if ([[pName lowercaseString] hasPrefix:@"xml"])
			return NO;

		return YES;
	}
	else
		return NO;
}

+(BOOL)checkNamespaceURI:(NSString*)pName
{
	// Manually do rules, since URIs can be null or empty
	if ([pName length]==0) {
		return YES;
	}
	
	// Cannot start with a number
	unichar c = [pName characterAtIndex:0];
	if ([[NSCharacterSet decimalDigitCharacterSet] characterIsMember:c])
		return NO;
	
	//Can not start with these two characters
	if (c == '-' || c == '$') {
		return NO;
	}
	
	// If we got here, everything is OK
	return [self checkIsValidURI:pName];
}

@end
#endif