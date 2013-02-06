//
//  DTDownload.m
//  DTFoundation
//
//  Created by Oliver Drobnik on 8/6/10.
//  Copyright 2010 Drobnik.com. All rights reserved.
//

#import "DTDownload.h"
#import "NSString+DTUtilities.h"

NSString * const DTDownloadDidStartNotification = @"DTDownloadDidStartNotification";
NSString * const DTDownloadDidFinishNotification = @"DTDownloadDidFinishNotification";
NSString * const DTDownloadDidCancelNotification = @"DTDownloadDidCancelNotification";
NSString * const DTDownloadProgressNotification = @"DTDownloadProgressNotification";

@interface DTDownload ()

@property (nonatomic, retain) NSString *internalDownloadFolder;
@property (nonatomic, retain) NSDate *lastPaketTimestamp;

- (void)_updateDownloadInfo;
- (void)_completeWithSuccess;
- (void)_completeWithError:(NSError *)error;

@end

@implementation DTDownload
{
	NSURL *_URL;
	NSString *_internalDownloadFolder;
	NSString *_downloadEntityTag;
	NSDate *_lastModifiedDate;
	NSString *_downloadEntryIdentifier;
	
	NSString *_folderForDownloading;
	
	// downloading
	NSURLConnection *_urlConnection;
	NSMutableData *_receivedData;
	
	NSDate *_lastPaketTimestamp;
	float _previousSpeed;
	
	long long _receivedBytes;
	long long _expectedContentLength;
	
	NSString *_contentType;
	
	NSString *_receivedDataFilePath;
	NSFileHandle *_receivedDataFile;
	
	__unsafe_unretained id <DTDownloadDelegate> _delegate;
	
	BOOL _headOnly;
	
	BOOL _isLoading;
	BOOL _cancelled;
	
	// response handlers
	DTDownloadResponseHandler _responseHandler;
	DTDownloadCompletionHandler _completionHandler;
}

#pragma mark Downloading

- (id)initWithURL:(NSURL *)URL
{
    NSAssert(![URL isFileURL], @"File URL is illegal parameter for DTDownload");
    
	self = [super init];
	if (self)
	{
		_URL = URL;
		
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(appWillTerminate:) name:UIApplicationWillTerminateNotification object:nil];
		
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(downloadWillStartNotification:) name:DTDownloadDidStartNotification object:nil];
	}
	
	return self;
}

- (void)dealloc
{
	[[NSNotificationCenter defaultCenter] removeObserver:self];
	
    // cancel connection if still in flight
    [self cancel];
}

- (void)startHEAD
{
	NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:_URL cachePolicy:NSURLRequestReloadIgnoringLocalAndRemoteCacheData timeoutInterval:60.0];
	[request setHTTPMethod:@"HEAD"];
	
	// start downloading
	_urlConnection = [[NSURLConnection alloc] initWithRequest:request delegate:self startImmediately:NO];
	
	// without this special it would get paused during scrolling of scroll views
	[_urlConnection scheduleInRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
	[_urlConnection start];
	
	// getting only a HEAD
	_headOnly = YES;
}

- (void)startWithResume:(BOOL)shouldResume
{
	if (_isLoading)
	{
		return;
	}
	
	if (_cancelled)
	{
		_cancelled = NO;
	}
	
	_isLoading = YES;
	
	NSString *fileName = [[_URL path] lastPathComponent];
	self.internalDownloadFolder = [[self.folderForDownloading stringByAppendingPathComponent:fileName] stringByAppendingPathExtension:@"download"];
	
	_receivedDataFilePath = [_internalDownloadFolder stringByAppendingPathComponent:fileName];
	
	if ([[NSFileManager defaultManager] fileExistsAtPath:_internalDownloadFolder])
	{
		// there is a paused download
		
		// load previous data
		
		NSString *infoPath = [_internalDownloadFolder stringByAppendingPathComponent:@"Info.plist"];
		NSDictionary *infoDictionary = [NSDictionary dictionaryWithContentsOfFile:infoPath];
        NSDictionary *resumeInfo = [infoDictionary objectForKey:@"DownloadEntryResumeInformation"];
 
        // we can only resume if there is a download info dictionary
        
        if (resumeInfo)
        {
            _expectedContentLength = [[infoDictionary objectForKey:@"DownloadEntryProgressTotalToLoad"] longLongValue];
            _receivedBytes = [[resumeInfo objectForKey:@"NSURLDownloadBytesReceived"] longLongValue];
            _downloadEntryIdentifier = [infoDictionary objectForKey:@"DownloadEntryIdentifier"];
            if (!_downloadEntryIdentifier)
            {
                _downloadEntryIdentifier = [NSString stringWithUUID];
            }
            
            if ([_delegate respondsToSelector:@selector(shouldResumeDownload:)])
            {
                if (!shouldResume || ![_delegate shouldResumeDownload:self])
                {
                    NSError *error = nil;
                    if (![[NSFileManager defaultManager] removeItemAtPath:_receivedDataFilePath error:&error])
                    {
                        NSLog(@"Cannot remove file at path %@, %@", _receivedDataFilePath, [error localizedDescription]);
                        return;
                    }
                    
                    shouldResume = NO;
                }
            }
        }
        else
        {
            shouldResume = NO;
        }
		
		if (shouldResume)
		{
			_downloadEntityTag = [resumeInfo objectForKey:@"NSURLDownloadEntityTag"];
			
			
			// here we assume we should continue download
			_receivedDataFile = [NSFileHandle fileHandleForWritingAtPath:_receivedDataFilePath];
			[_receivedDataFile seekToEndOfFile];
			
			// test if remembered length = received data length
			
			long long offset = [_receivedDataFile offsetInFile];
			if (_receivedBytes != offset)
			{
				// inconsistency, reset
				_receivedBytes = 0;
				_expectedContentLength = 0;
				_downloadEntityTag = nil;
				_lastModifiedDate = nil;
				
				[_receivedDataFile closeFile];
				
				NSError *error = nil;
				if (_receivedDataFile && ![[NSFileManager defaultManager] removeItemAtPath:_receivedDataFilePath error:&error])
				{
					NSLog(@"Cannot remove file at path %@, %@", _receivedDataFilePath, [error localizedDescription]);
					return;
				}
				
				_receivedDataFile = nil;
			}
			else
			{
                // if we have an expected content length and the received bytes equal that then we are already done!
				if (_expectedContentLength>=0 && _receivedBytes && _receivedBytes >= _expectedContentLength)
				{
					// Already done!
					[self _completeWithSuccess];
					return;
				}
			}
		}
		else
		{
			// reset
			_receivedBytes = 0;
			_expectedContentLength = 0;
			_downloadEntityTag = nil;
			_lastModifiedDate = nil;
		}
	}
	else
	{
		// create download folder
		NSError *error = nil;
		
		if (![[NSFileManager defaultManager] createDirectoryAtPath:_internalDownloadFolder withIntermediateDirectories:YES attributes:nil error:&error])
		{
			NSLog(@"Cannot create download folder %@, %@", _internalDownloadFolder, [error localizedDescription]);
			return;
		}
		
		_downloadEntryIdentifier = [NSString stringWithUUID];
	}
	
	NSMutableURLRequest *request=[NSMutableURLRequest requestWithURL:_URL cachePolicy:NSURLRequestReloadIgnoringLocalAndRemoteCacheData timeoutInterval:60.0];
	
    // activate pipelining
    [request setHTTPShouldUsePipelining:YES];
    
	// set range header
	if (_receivedBytes)
	{
		[request setValue:[NSString stringWithFormat:@"bytes=%lld-", _receivedBytes] forHTTPHeaderField:@"Range"];
	}
	
	// send notification
	[[NSNotificationCenter defaultCenter] postNotificationName:DTDownloadDidStartNotification object:self];
	
	// start downloading
	_urlConnection = [[NSURLConnection alloc] initWithRequest:request delegate:self startImmediately:NO];
	
	// without this special it would get paused during scrolling of scroll views
	[_urlConnection scheduleInRunLoop:[NSRunLoop mainRunLoop] forMode: NSRunLoopCommonModes];
	[_urlConnection start];
	
	if (_urlConnection)
	{
		_receivedData=[NSMutableData data];
	}
}

- (void)cancel
{
	if (_cancelled)
    {
		return;
	}
	
	_cancelled = YES;

	// update resume info on disk if necessary
	[self _updateDownloadInfo];
	
	// only send cancel notification if it was loading
	if (_isLoading)
	{
		_isLoading = NO;

		// cancel the connection
		[_urlConnection cancel];
		
		// send notification
		[[NSNotificationCenter defaultCenter] postNotificationName:DTDownloadDidCancelNotification object:self];
		
		if ([_delegate respondsToSelector:@selector(downloadDidCancel:)])
		{
			[_delegate downloadDidCancel:self];
		}
	}

	// nil the completion handlers in case they captured self
	_completionHandler = nil;
	_responseHandler = nil;

	_receivedData = nil;
	_urlConnection = nil;
	_delegate = nil;
}

- (void)cleanup
{
	[self cancel];
	
	// remove cached file
	NSFileManager *fileManager = [[NSFileManager alloc] init];
	[fileManager removeItemAtPath:self.internalDownloadFolder error:nil];
}

- (NSString *)description
{
	return [NSString stringWithFormat:@"<%@ URL='%@'>", NSStringFromClass([self class]), self.URL];
}

#pragma mark - Internal Utilities

- (void)_completeWithError:(NSError *)error
{
	_isLoading = NO;
	
	// notify delegate of error
	if ([_delegate respondsToSelector:@selector(download:didFailWithError:)])
	{
		[_delegate download:self didFailWithError:error];
	}
	
	// call completion handler
	if (_completionHandler)
	{
		_completionHandler(nil, error);
	}
	
	// nil the completion handlers in case they captured self
	_completionHandler = nil;
	_responseHandler = nil;
	
	// send notification
	[[NSNotificationCenter defaultCenter] postNotificationName:DTDownloadDidFinishNotification object:self];
}

- (void)_completeWithSuccess
{
	_isLoading = NO;
	
	if (_headOnly)
	{
		// only a HEAD request
		if ([_delegate respondsToSelector:@selector(downloadDidFinishHEAD:)])
		{
			[_delegate downloadDidFinishHEAD:self];
		}
	}
	else
	{
		// normal GET request
		NSError *error = nil;
		
		NSFileManager *fm = [NSFileManager defaultManager];
		
		NSString *fileName = [[_URL path] lastPathComponent];
		NSString *targetPath = [self.folderForDownloading stringByAppendingPathComponent:fileName];
		
		// remove item that may exist at final target path
		if ([fm fileExistsAtPath:targetPath])
		{
			// remove existing file
			if (![fm removeItemAtPath:targetPath error:&error])
			{
				NSLog(@"Cannot remove item %@", [error localizedDescription]);
				return;
			}
		}
		
		// move downloaded file to final location
		if (![fm moveItemAtPath:_receivedDataFilePath toPath:targetPath error:&error])
		{
			NSLog(@"Cannot move item from %@ to %@, %@", _receivedDataFilePath, targetPath, [error localizedDescription]);
			return;
		}
		
		// remove internal download folder
		if (![fm removeItemAtPath:self.internalDownloadFolder error:&error])
		{
			NSLog(@"Cannot remove item %@, %@", self.internalDownloadFolder, [error localizedDescription]);
			return;
		}
		
		// notify delegate
		if ([_delegate respondsToSelector:@selector(download:didFinishWithFile:)])
		{
			[_delegate download:self didFinishWithFile:targetPath];
		}
		
		// run completion handler
		if (_completionHandler)
		{
			_completionHandler(targetPath, nil);
		}
	}
	
	// nil the completion handlers in case they captured self
	_completionHandler = nil;
	_responseHandler = nil;
	
	// send notification
	[[NSNotificationCenter defaultCenter] postNotificationName:DTDownloadDidFinishNotification object:self];
}

- (void)_updateDownloadInfo
{
	// no need to save resume info if we have not received any bytes yet, or download is complete
	if (_receivedBytes==0 || (_receivedBytes >= _expectedContentLength) || _headOnly)
	{
		return;
	}
	
	NSMutableDictionary *resumeDict = [NSMutableDictionary dictionary];
	
	[resumeDict setObject:[NSNumber numberWithLongLong:_receivedBytes] forKey:@"NSURLDownloadBytesReceived"];
	
	if (_downloadEntityTag)
	{
		[resumeDict setObject:_downloadEntityTag forKey:@"NSURLDownloadEntityTag"];
	}
	
	[resumeDict setObject:[_URL description] forKey:@"DownloadEntryURL"];
	
	NSDictionary *writeDict = [NSDictionary dictionaryWithObjectsAndKeys:
										[NSNumber numberWithInt:-999], @"DownloadEntryErrorCodeDictionaryKey",
										@"NSURLErrorDomain", @"DownloadEntryErrorDomainDictionaryKey",
										
										_downloadEntryIdentifier, @"DownloadEntryIdentifier",
										_receivedDataFilePath, @"DownloadEntryPath",
										[NSNumber numberWithLongLong:_receivedBytes], @"DownloadEntryProgressBytesSoFar",
										[NSNumber numberWithLongLong:_expectedContentLength], @"DownloadEntryProgressTotalToLoad",
										resumeDict, @"DownloadEntryResumeInformation",
										[_URL description], @"DownloadEntryURL"
										, nil];
	
	NSString *infoPath = [_internalDownloadFolder stringByAppendingPathComponent:@"Info.plist"];
	
	[writeDict writeToFile:infoPath atomically:YES];
}

#pragma mark - NSURLConnection Delegate

- (void)connection:(NSURLConnection *)connection didFailWithError:(NSError *)error
{
	_receivedData = nil;
	_urlConnection = nil;
	
	[_receivedDataFile closeFile];
	
	// update resume info on disk
	[self _updateDownloadInfo];
	
	[self _completeWithError:error];
}

- (void)connection:(NSURLConnection *)connection didReceiveResponse:(NSURLResponse *)response
{
	if ([response isKindOfClass:[NSHTTPURLResponse class]])
	{
		NSHTTPURLResponse *http = (NSHTTPURLResponse *)response;
		_contentType = http.MIMEType;
		
		if (http.statusCode>=400)
		{
			NSDictionary *userInfo = [NSDictionary dictionaryWithObject:[NSHTTPURLResponse localizedStringForStatusCode:http.statusCode] forKey:NSLocalizedDescriptionKey];
			
			NSError *error = [NSError errorWithDomain:@"iCatalog" code:http.statusCode userInfo:userInfo];
			
			[connection cancel];
			
			[self connection:connection didFailWithError:error];
			return;
		}

        _expectedContentLength = [response expectedContentLength];
		
		NSString * currentEntityTag = [http.allHeaderFields objectForKey:@"Etag"];
		if (!_downloadEntityTag)
		{
			_downloadEntityTag = currentEntityTag;
		}
		else
		{
			// check if it's the same as from last time
			if (![self.downloadEntityTag isEqualToString:currentEntityTag])
			{
				// file was changed on server restart from beginning
				[_urlConnection cancel];
				
				// update loading flag to allow resume
				_isLoading = NO;
				[self startWithResume:NO];
			}
		}
		
		// get something to identify file
		NSString *modified = [http.allHeaderFields objectForKey:@"Last-Modified"];
		if (modified)
		{
			NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
			[dateFormatter setDateFormat:@"EEE, dd MMM yyyy HH:mm:ss zzz"];
			NSLocale *locale = [[NSLocale alloc] initWithLocaleIdentifier:@"en_US"];
			[dateFormatter setLocale:locale];
			
			_lastModifiedDate = [dateFormatter dateFromString:modified];
		}
		
		if (_responseHandler)
		{
			BOOL shouldCancel = NO;
			_responseHandler([http allHeaderFields], &shouldCancel);
			
			if (shouldCancel)
			{
				[self cancel];
			}
		}
	}
	else
	{
		[_urlConnection cancel];
	}
	
	// could be redirections, so we set the Length to 0 every time
	[_receivedData setLength:0];
}

- (void)connection:(NSURLConnection *)connection didReceiveData:(NSData *)data
{
	if (!_receivedDataFile)
	{
		// first chunk creates a new file
		[[NSFileManager defaultManager] createFileAtPath:_receivedDataFilePath contents:data attributes:nil];
		_receivedBytes += [data length];
		
		_receivedDataFile = [NSFileHandle fileHandleForWritingAtPath:_receivedDataFilePath];
		[_receivedDataFile seekToEndOfFile];
	}
    else
    {
        // subsequent chunks get added to file
        [_receivedDataFile writeData:data];
        _receivedBytes += [data length];
    }
	
	// calculate a transfer speed
	float downloadSpeed = 0;
	NSDate *now = [NSDate date];
	
	if (_lastPaketTimestamp)
	{
		NSTimeInterval downloadDurationForPaket = [now timeIntervalSinceDate:self.lastPaketTimestamp];
		float instantSpeed = [data length] / downloadDurationForPaket;
		
		downloadSpeed = (_previousSpeed * 0.9)+0.1 * instantSpeed;
	}
	
	self.lastPaketTimestamp = now;
	
	// send notification
	if (_expectedContentLength>0)
	{
		// notify delegate
		if ([_delegate respondsToSelector:@selector(download:downloadedBytes:ofTotalBytes:withSpeed:)])
		{
			[_delegate download:self downloadedBytes:_receivedBytes ofTotalBytes:_expectedContentLength withSpeed:downloadSpeed];
		}

		NSDictionary *userInfo = @{@"ProgressPercent" : [NSNumber numberWithFloat:(float)_receivedBytes / (float)_expectedContentLength], @"TotalBytes": [NSNumber numberWithLongLong:_expectedContentLength], @"ReceivedBytes": [NSNumber numberWithLongLong:_receivedBytes] };
		[[NSNotificationCenter defaultCenter] postNotificationName:DTDownloadProgressNotification object:self userInfo:userInfo];
	}
}

- (void)connectionDidFinishLoading:(NSURLConnection *)connection
{
	_receivedData = nil;
	_urlConnection = nil;
	
	[_receivedDataFile closeFile];
	_receivedDataFile = nil;
	
	[self _completeWithSuccess];
}

#pragma mark Notifications
- (void)appWillTerminate:(NSNotification *)notification
{
	[self cancel];
}

- (void)downloadWillStartNotification:(NSNotification *)notification
{
	DTDownload *download = [notification object];
	
	// ignore my own notifications
	if (download == self)
	{
		return;
	}
	
	if ([download.URL isEqual:self.URL])
	{
		NSString *myFolder = self.folderForDownloading;
		NSString *otherFolder = download.folderForDownloading;
		
		NSAssert(![myFolder isEqualToString:otherFolder], @"Trying to start a new download for URL %@ with the same download folder as an existing DTDownload", self.URL);
	}
}

#pragma mark Properties
- (NSString *)folderForDownloading
{
	if (!_folderForDownloading)
	{
		NSString *md5 = [[_URL absoluteString] md5Checksum];
		
		_folderForDownloading = [NSTemporaryDirectory() stringByAppendingPathComponent:md5];
	}
	
	return _folderForDownloading;
}

- (BOOL)isLoading
{
	return _isLoading;
}

@synthesize URL = _URL;
@synthesize internalDownloadFolder = _internalDownloadFolder;
@synthesize downloadEntityTag = _downloadEntityTag;
@synthesize folderForDownloading = _folderForDownloading;
@synthesize lastPaketTimestamp = _lastPaketTimestamp;
@synthesize delegate = _delegate;
@synthesize lastModifiedDate = _lastModifiedDate;
@synthesize contentType = _contentType;
@synthesize expectedContentLength = _expectedContentLength;
@synthesize context = _context;
@synthesize responseHandler = _responseHandler;
@synthesize completionHandler = _completionHandler;

@end
