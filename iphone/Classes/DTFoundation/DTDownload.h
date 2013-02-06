//
//  DTDownload.h
//  DTFoundation
//
//  Created by Oliver Drobnik on 8/6/10.
//  Copyright 2010 Drobnik.com. All rights reserved.
//

// notifications
extern NSString * const DTDownloadDidStartNotification;
extern NSString * const DTDownloadDidFinishNotification;
extern NSString * const DTDownloadDidCancelNotification;
extern NSString * const DTDownloadProgressNotification;


@class DTDownload;

// block-based response handler, called after headers were received. Returning YES via shouldCancel cancels the download
typedef void (^DTDownloadResponseHandler)(NSDictionary *headers, BOOL *shouldCancel);

// block-based completion handler, called once the download has finished, in case of error path is nil and error is set
typedef void (^DTDownloadCompletionHandler)(NSString *path, NSError *error);


/**
 Methods that a delegate of a download object is being queried with.
 */

@protocol DTDownloadDelegate <NSObject>

@optional

/**
 Sent by the download object to the delegate to inquire if a download that can be resumed should continue. Return `NO` if the download should start from the beginning.
 
 @param download A download object.
 */
- (BOOL)shouldResumeDownload:(DTDownload *)download;

/**
 Sent by the download object to inform the delegate about its progress.
 
 @param download A download object.
 @param downloadedBytes The number of bytes that were downloaded so far.
 @param totalBytes The number of total bytes to be downloaded.
 @param speed A rough estimate of the current download speed.
 */
- (void)download:(DTDownload *)download downloadedBytes:(long long)downloadedBytes ofTotalBytes:(long long)totalBytes withSpeed:(float)speed;

/**
 Sent by the download object to the delegate when only a HEAD was requested and the request is done.
 
 @param download A download object.
 */
- (void)downloadDidFinishHEAD:(DTDownload *)download;


/**
 Sent by the download object to the delegate when the download was been aborted due to failure.
 
 @param download A download object.
 @param error An error object that contains information about what caused the failure.
 */
- (void)download:(DTDownload *)download didFailWithError:(NSError *)error;

/**
 Sent by the download object to the delegate when the download as completed successfully.
 
 @param download A download object.
 @param path The file path to the downloaded file
 */
- (void)download:(DTDownload *)download didFinishWithFile:(NSString *)path;

/**
 Sent by the download object to the delegate if the download was in progress but got cancelled
 
 @param download A download object.
 */
- (void)downloadDidCancel:(DTDownload *)download;

@end



/**
 A Class that represents a download of a file from a remote server. It also supports only getting a HEAD on the given URL and optionally resume an interrupted download
 */

@interface DTDownload : NSObject

/**
 Returns the URL that is being downloaded by the receiver.
 */
@property (nonatomic, strong, readonly) NSURL *URL;

/**
 Returns the entity tag of the downloading file.
 */
@property (nonatomic, strong, readonly) NSString *downloadEntityTag;

/**
 Returns the MIME type of the downloading file.
 */
@property (nonatomic, strong, readonly) NSString *contentType;

/**
 Returns the number expected content bytes of the downloading file. 
 
 If the headers did not specify a content length to expect then this value is -1
 */
@property (nonatomic, assign, readonly) long long expectedContentLength;

/**
 Returns the last modified date of the downloading file.
 */
@property (nonatomic, strong, readonly) NSDate *lastModifiedDate;

/**
 Use to set or retrieve the folder where the downloaded file should be copied to.
 
 Changing this only has an effect if the download has not yet completed.
 */
@property (nonatomic, strong) NSString *folderForDownloading;

/**
 Use to set or retrieve an object that provides a context for the download.
 */
@property (nonatomic, strong) id context;

/**
 Returns the receiver’s delegate.
 
 @see delegate
 */
@property (nonatomic, assign) id <DTDownloadDelegate> delegate;

/**-------------------------------------------------------------------------------------
 @name Initializing a Download Object
 ---------------------------------------------------------------------------------------
 */

/** Creates a download for a given URL.
 
 @param url A remote URL
 @returns An initialized download object
 */
- (id)initWithURL:(NSURL *)url;

/**-------------------------------------------------------------------------------------
 @name Starting the Download
 ---------------------------------------------------------------------------------------
 */

/**
 Starts or Resumes a download for a given URL.
 
 @param shouldResume Specifies if the download should be resumed if possible
 @returns An initialized download object
 */
- (void)startWithResume:(BOOL)shouldResume;

/**
 Starts a HEAD request for the given URL. This retrieves the headers and not the body of the document.
 */
- (void)startHEAD;

/**
 Cancels a download in progress
 */
- (void)cancel;

/**
 Determines if the download is currently in progress
 */
- (BOOL)isLoading;

/**
 *  Removes the downloaded file or the incomplete file if the download is currently running.
 *	 Note: Also the download is cancelled if necessary
 */
- (void)cleanup;


/**-------------------------------------------------------------------------------------
 @name Block Handlers
 ---------------------------------------------------------------------------------------
 */

/**
 Sets the block to execute as soon as the HTTP response has been received and the headers are available.
 */
@property (nonatomic, copy) DTDownloadResponseHandler responseHandler;


/**
 Sets the block to execute as soon as the download has completed.
 */
@property (nonatomic, copy) DTDownloadCompletionHandler completionHandler;

@end
