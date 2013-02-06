//
//  DTCachedFile.h
//  DTFoundation
//
//  Created by Oliver Drobnik on 4/20/12.
//  Copyright (c) 2012 Cocoanetics. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <CoreData/CoreData.h>

/**
 A managed object representing meta information on a cached file. 
 
 You usually never access these directly, they are used internally by <DTDownloadCache>
 */
@interface DTCachedFile : NSManagedObject

/**
 Remote URL of the receiver
 */
@property (nonatomic, retain) NSString *remoteURL;

/**
 The data in the file represented by the receiver
 */
@property (nonatomic, retain) NSData *fileData;

/**
 The last time when the receiver was accessed
 */
@property (nonatomic, retain) NSDate *lastAccessDate;

/**
 The last time the receiver was modified
 */
@property (nonatomic, retain) NSDate *lastModifiedDate;

/**
 The time when the receiver is set to expire. Note: Not yet implemented.
 */
@property (nonatomic, retain) NSDate *expirationDate;

/**
 The content MIME type of the receiver
 */
@property (nonatomic, retain) NSString *contentType;

/**
 The file size in bytes of the receiver
 */
@property (nonatomic, retain) NSNumber *fileSize;

/**
 Flag to force the loading of the file, even if data is cached
 */
@property (nonatomic, retain) NSNumber *forceLoad;

/**
Abort a download if the ETag and/or last modified are the same
 */
@property (nonatomic, retain) NSNumber *abortDownloadIfNotChanged;

/**
 Transient flag to show that this is already being downloaded
 */
@property (nonatomic, retain) NSNumber *isLoading;

/**
 The ETag of the receiver if the remote host did return one
 */
@property (nonatomic, retain) NSString *entityTagIdentifier;

@end
