//
//  TiBonjourBrowserProxy.h
//  Titanium
//
//  Created by Stiv on 2/20/10.
//  Copyright 2010 Apple Inc. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "TiProxy.h"

// NSNetServiceBrowser delegate
@interface TiNetworkBonjourBrowserProxy : TiProxy {
    NSNetServiceBrowser* browser;
    NSString* serviceType;
    NSString* domain;
    
    NSMutableArray* services;
    
    BOOL searching;
    NSString* error;
    NSCondition* searchCondition;
}

-(void)search:(id)unused;
-(void)stopSearch:(id)unused;
-(NSNumber*)isSearching:(id)unused;

@property(readonly, nonatomic) NSString* serviceType;
@property(readonly, nonatomic) NSString* domain;

@end