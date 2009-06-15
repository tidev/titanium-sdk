/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef	ALLOW_EXTERNAL_APP

#import "TitaniumTitaniumAppDownloadViewController.h"
#import "TitaniumAppDelegate.h"
#import <NuZip.h>

@implementation TitaniumAppDownloadViewController
@synthesize titaniumUrl, appName;

+ (TitaniumAppDownloadViewController *) viewController;
{
	TitaniumAppDownloadViewController * result = [[self alloc] initWithNibName:@"AppDownloadView" bundle:nil];
	return [result autorelease];
}

- (void) viewDidAppear: (BOOL) animated;
{
	if (animated) {
		[UIView beginAnimations:@"Downloady" context:nil];
	}
	
	[[self view] setAlpha:1.0];
	
	if (animated) {
		[UIView commitAnimations];
	}
}

/*
// The designated initializer. Override to perform setup that is required before the view is loaded.
- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil {
    if (self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil]) {
        // Custom initialization
    }
    return self;
}
*/

/*
// Implement loadView to create a view hierarchy programmatically, without using a nib.
- (void)loadView {
}
*/

// Implement viewDidLoad to do additional setup after loading the view, typically from a nib.
- (void)viewDidLoad {
    [super viewDidLoad];	
	[self startDownload];
}

- (void)startDownload;
{
	[progressBar setProgress:0.0];
	downloadTotalSize = 1.0;
	appZipData = [[NSMutableData alloc] init];
	[[UIApplication sharedApplication] setNetworkActivityIndicatorVisible:YES];
	[self setAppName:[[titaniumUrl query] stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding]];
	
	[mainLabel setText:[NSString stringWithFormat:@"Downloading %@...",appName]];
	[progressLabel setText:@"Connecting to server"];

	NSString * pathBit = [[titaniumUrl path] substringFromIndex:1];
	appZipUrl = [NSURL URLWithString:pathBit relativeToURL:[NSURL URLWithString:@"http://unlogica.com/bhamon/appcelerator/"]];
//	NSLog(@"Download url %@ -> %@ -> %@ / %@",titaniumUrl,pathBit,appZipUrl,[appZipUrl absoluteURL]);

	appZipConnection = [[NSURLConnection alloc] initWithRequest:[NSURLRequest requestWithURL:appZipUrl]
			delegate:self startImmediately:YES];
	
}



/*
// Override to allow orientations other than the default portrait orientation.
- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation {
    // Return YES for supported orientations
    return (interfaceOrientation == UIInterfaceOrientationPortrait);
}
*/

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning]; // Releases the view if it doesn't have a superview
    // Release anything that's not essential, such as cached data
}


- (void)dealloc {
	[titaniumUrl release];
	[appName release];
	[appZipUrl release];
	
	[mainLabel release];
	[progressLabel release];
	[progressBar release];
	
	[appZipConnection release];
	[appZipData release];
	[appZipFileName release];
    [super dealloc];
}

#pragma mark UrlConnection delegatestuffs

- (NSURLRequest *)connection:(NSURLConnection *)connection
             willSendRequest:(NSURLRequest *)redirectRequest
            redirectResponse:(NSURLResponse *)redirectResponse 
{
	return redirectRequest;
}

- (void)connection:(NSURLConnection *)connection didReceiveResponse:(NSURLResponse *)response
{
	[appZipData setLength:0];
	downloadTotalSize = [response expectedContentLength];
	[appZipFileName release];
	appZipFileName = [[response suggestedFilename] copy];
	
	[progressLabel setText:@"Downloading app..."];
}

- (void)connection:(NSURLConnection *)connection didReceiveData:(NSData *)newData
{
	[appZipData appendData:newData];
	if (downloadTotalSize != 0) 
	{
		[progressBar setProgress:[appZipData length]/(2*1+downloadTotalSize)];
	}
}

- (void)connection:(NSURLConnection *)connection didFailWithError:(NSError *)error
{
	[progressLabel setText:[NSString stringWithFormat:@"Download failed: %@.",[error localizedDescription]]];
	[[TitaniumAppDelegate sharedDelegate] performSelector:@selector(launchTitaniumApp:) withObject:nil afterDelay:3.0];
}

- (void)connectionDidFinishLoading:(NSURLConnection *)connection;
{	//Step two: Start decompressing!
	//TODO: go straight from NSData to decompressing.
	if (![appZipFileName hasSuffix:@".zip"]) {
		[self connection:connection didFailWithError:
				[NSError errorWithDomain:@"com.appcelerator.titanium"
									code:1
								userInfo:[NSDictionary dictionaryWithObject:@"Unexpected file type" forKey:NSLocalizedDescriptionKey]]];
		return;
	}
	NSString * zipFullPath = [NSTemporaryDirectory() stringByAppendingPathComponent:appZipFileName];

	NSError * unzipError = nil;
	[appZipData writeToFile:zipFullPath options:0 error:&unzipError];
	if (unzipError == nil) {
		(void)[NuZip unzip:zipFullPath toFolder:NSTemporaryDirectory() password:nil error:&unzipError];
	}
	
	if (unzipError != nil) {
		[self connection:connection didFailWithError:unzipError];
		return;
	}
	
	TitaniumAppDelegate * theDelegate = [TitaniumAppDelegate sharedDelegate];
	[theDelegate launchTitaniumApp:[[zipFullPath stringByDeletingPathExtension] stringByAppendingPathComponent:@"Resources"]];
}


@end

#endif