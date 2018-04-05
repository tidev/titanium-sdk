//
//  TiSharedConfig.h
//  TitaniumKit
//
//  Created by Hans Knöchel on 05.04.18.
//  Copyright © 2018 Hans Knoechel. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface TiSharedConfig : NSObject

@property (nonatomic, strong) NSString *applicationName;

@property (nonatomic, strong) NSString *applicationID;

@property (nonatomic, strong) NSString *applicationVersion;

@property (nonatomic, strong) NSString *applicationDeployType;

@property (nonatomic, strong) NSString *applicationGUID;

@property (nonatomic, strong) NSString *applicationResourcesDirectory;

@property (nonatomic, strong) NSString *applicationBuildType;

@property (nonatomic, assign, getter=isAnalyticsEnabled) BOOL analyticsEnabled;

@property (nonatomic, assign) BOOL showErrorController;

+ (id)defaultConfig;

@end
