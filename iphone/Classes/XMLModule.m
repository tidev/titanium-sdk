/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_XML

#import "XMLModule.h"
#import "TiDOMDocumentProxy.h"
#import "TiDOMNodeProxy.h"

@implementation XMLModule

-(id)parseString:(id)arg
{
	ENSURE_SINGLE_ARG(arg,NSString);
	
	TiDOMDocumentProxy *proxy = [[[TiDOMDocumentProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
	[proxy parseString:arg];
	return proxy;
}

-(id)serializeToString:(id)arg
{
    ENSURE_SINGLE_ARG(arg,TiDOMNodeProxy);
	
    TiDOMNodeProxy *proxy = (TiDOMNodeProxy *)arg;
    NSString* xmlString = [proxy XMLString];
    if ([xmlString length] == 0) {
        return xmlString;
    }
    
    //Strip out all the xmlns:xmlns="http://www.w3.org/2000/xmlns/" definitions
    NSString* strippedString = [xmlString stringByReplacingOccurrencesOfString:@" xmlns:xmlns=\"http://www.w3.org/2000/xmlns/\"" withString:@""];
    
    //Clean out duplicate namespace definitions
    NSString* cleanString = [self cleanDuplicateNS:strippedString];
    
    return cleanString;
}

/**
 IOS does not have a proper transformer like java. (javax.xml.transform.Transformer)
 It is perfectly valid to have an element with a namespace and an attribute whose values match the namespace
 Eg:
 var doc = Ti.XML.parseString('<a/>');
 var feed = doc.implementation.createDocument('http://www.test.org/myns', 'myns:feed', null);
 feed.documentElement.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:myns', 'http://www.test.org/myns');
 
 When you print out feed it will print out the NS myns twice. This method cleans out the duplicate NS definitions
 */
-(NSString*) cleanDuplicateNS:(NSString*)xmlString
{
    NSRange searchRange = NSMakeRange(0, [xmlString length]);
    
    NSRange result = [xmlString rangeOfString:@" xmlns" options:0 range:searchRange];
    while (result.location != NSNotFound) {
        searchRange.location = result.location+result.length;
        searchRange.length = [xmlString length] - (searchRange.location);
        
        //Search for end of element
        NSRange endOfElement = [xmlString rangeOfString:@">" options:0 range:searchRange];
        //Search for end of NS definition
        NSRange endOfNS = [xmlString rangeOfString:@" " options:0 range:searchRange];
        if (endOfNS.location < endOfElement.location) {
            //Get the actual xmlns definition
            NSRange subStringRange = NSMakeRange(result.location, endOfNS.location - result.location);
            NSString* subString = [xmlString substringWithRange:subStringRange];
            
            //Set up a search range
            subStringRange.location = endOfNS.location;
            subStringRange.length = endOfElement.location - endOfNS.location;
            xmlString = [xmlString stringByReplacingOccurrencesOfString:subString withString:@"" options:0 range:subStringRange];
            
            //Update search range
            searchRange.location = subStringRange.location+1;
            searchRange.length = [xmlString length] - searchRange.location;
        }
        else {
            //Not in this element. Update search range.
            searchRange.location = endOfElement.location+1;
            searchRange.length = [xmlString length] - searchRange.location;
        }
        result = [xmlString rangeOfString:@" xmlns" options:0 range:searchRange];
    }
    
    return xmlString;
}
                             

@end

#endif