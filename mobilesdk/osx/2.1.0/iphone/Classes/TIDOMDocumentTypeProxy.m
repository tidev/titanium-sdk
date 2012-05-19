/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "TIDOMDocumentTypeProxy.h"


@implementation TIDOMDocumentTypeProxy

-(id)nodeValue
{
	// DOM spec says nodeValue must return null
	return [NSNull null];
}
-(id)entities{
    //TODO
    return [NSNull null];
}
-(id)notations{
     //TODO
    return [NSNull null];
}
-(id)name{
	if (node != nil)
	{
		return [node localName];
	}
	return [NSNull null];
}
-(id)publicId
{
    if (node != nil)
    {
        xmlDtdPtr theRealNode = (xmlDtdPtr)[node XMLNode];
        if (theRealNode->ExternalID != nil)
        {
            NSString* ret = [NSString stringWithUTF8String:(const char *)theRealNode->ExternalID];
            if (ret == nil)
                return [NSNull null];
            else
                return ret;
        }
    }
    return [NSNull null];
}
-(id)systemId
{
    if (node != nil)
    {
        xmlDtdPtr theRealNode = (xmlDtdPtr)[node XMLNode];
        if (theRealNode->SystemID != nil)
        {
            NSString* ret = [NSString stringWithUTF8String:(const char *)theRealNode->SystemID];
            if (ret == nil)
                return [NSNull null];
            else
                return ret;
        }
    }
    return [NSNull null];
}
-(id)internalSubset
{
    if (node != nil)
    {
        [node XMLString];
    }
    return [NSNull null];
}
@end

#endif
