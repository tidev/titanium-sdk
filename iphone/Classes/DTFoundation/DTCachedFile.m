//
//  DTCachedFile.m
//  DTFoundation
//
//  Created by Oliver Drobnik on 4/20/12.
//  Copyright (c) 2012 Cocoanetics. All rights reserved.
//

#import "DTCachedFile.h"


@implementation DTCachedFile

@dynamic remoteURL;
@dynamic fileData;
@dynamic lastAccessDate;
@dynamic lastModifiedDate;
@dynamic expirationDate;
@dynamic contentType;
@dynamic fileSize;
@dynamic forceLoad;
@dynamic isLoading;
@dynamic abortDownloadIfNotChanged;
@dynamic entityTagIdentifier;

@end
