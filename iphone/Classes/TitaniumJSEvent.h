//
//  TitaniumJSEvent.h
//  Titanium
//
//  Created by Blain Hamon on 10/2/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import <Foundation/Foundation.h>


@interface TitaniumJSEvent : NSObject {
	NSString * eventName;
	NSString * eventString;
	NSDictionary * eventDict;
}

@property(nonatomic,readwrite,copy)	NSString * eventName;
@property(nonatomic,readwrite,copy)	NSString * eventString;
@property(nonatomic,readwrite,copy)	NSDictionary * eventDict;

@end
