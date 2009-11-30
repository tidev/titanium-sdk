/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

//
// Thanks to the http://github.com/thefaj/OpenFlow project
// for the really super cool coverflow iphone port
//


#import "TitaniumCoverFlowViewController.h"
#import "TitaniumHost.h"
#import "TitaniumBlobWrapper.h"

@implementation TitaniumCoverFlowViewController

- (UIView *) view;
{
	if (view == nil)
	{
		CGRect viewFrame;
		viewFrame.origin = CGPointZero;
		viewFrame.size = preferredViewSize;
		view = [[AFOpenFlowView alloc] initWithFrame:viewFrame];
		view.dataSource = self;
		view.viewDelegate = self;
		view.backgroundColor = backgroundColor;
		[view setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];
		if (images!=nil)
		{
			[view setNumberOfImages:[images count]];
		}
	}
	return view;
}

- (void)didReceiveMemoryWarning {
	[view release];
	view = nil;
    [super didReceiveMemoryWarning];
}


- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation {
	return YES;
}

-(void)dealloc
{
	[view release];
	[images release];
	[backgroundColor release];
	[backgrouders release];
	[super dealloc];
}

- (void) readState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
{
	Class dictClass = [NSDictionary class];
	if(![inputState isKindOfClass:dictClass])return;
	
	NSArray *array = [inputState objectForKey:@"images"];
	if (array!=nil)
	{
		images = [[NSMutableArray arrayWithArray:array] retain];
	}
	else
	{
		images = [[NSMutableArray alloc] init];
	}

	NSString *clr = [inputState objectForKey:@"backgroundColor"];
	if (clr!=nil)
	{
		backgroundColor = [UIColorWebColorNamed(clr) retain];
	}
	
}

-(void)setUrl:(NSURL*)url index:(NSNumber*)index
{
	// replace our internal URL reference
	[images replaceObjectAtIndex:[index intValue] withObject:url];
	
	UIImage *image = [[TitaniumHost sharedHost] imageForResource:url];
	if (image==nil)
	{
		TitaniumBlobWrapper *wrapper = [[TitaniumHost sharedHost] blobForUrl:url];
		image = [wrapper imageBlob];
		if (image==nil)
		{
			if (backgrouders==nil) backgrouders = [[NSMutableArray alloc]init];
			[backgrouders addObject:wrapper];
			// queue it
			[index retain]; // addObserver doesn't retain so we need to
			[self retain];
			[wrapper addObserver:self forKeyPath:@"imageBlob" options:NSKeyValueObservingOptionNew context:index];
			[wrapper retain];
			return;
		}
	}
	// push the load on the main event UI thread
	NSDictionary *args = [NSDictionary dictionaryWithObjectsAndKeys:image,@"image",index,@"index",nil];
	[self performSelectorOnMainThread:@selector(setImageData:) withObject:args waitUntilDone:NO];
}

-(void)setSelected:(NSNumber*)index
{
	if(![NSThread isMainThread])
	{
		[self performSelectorOnMainThread:@selector(setSelected:) withObject:index waitUntilDone:NO];
	} 
	else 
	{
		if (view!=nil)
		{
			[view setSelectedCover:[index intValue]];
			[view centerOnSelectedCover:YES];
			// trigger callback event
			[self openFlowView:view selectionDidChange:[index intValue]];
		}
	}
}

#pragma mark Callback for blob loading

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context;
{
	if ([keyPath isEqualToString:@"imageBlob"]) 
	{
		[object removeObserver:self forKeyPath:keyPath];
		NSNumber *index = (NSNumber*)context;
		if (view!=nil)
		{
			UIImage *image = [(TitaniumBlobWrapper*)object imageBlob];
			// callback is always on the UI thread
			[view setImage:image forIndex:[index intValue]];
		}
		[index release];
		[backgrouders removeObject:object];
		[self release];
		[object release];
	}
}


#pragma mark OperationQueue callbacks

-(id)loadImage:(NSNumber*)index
{
	id path = [images objectAtIndex:[index intValue]];
	UIImage *image = [[TitaniumHost sharedHost] imageForResource:path];
	if (image==nil)
	{
		NSURL *url = nil;
		if ([path isKindOfClass:[NSURL class]])
		{
			url = (NSURL*)path;
		}
		else 
		{
			url = [NSURL URLWithString:path];
		}
		TitaniumBlobWrapper *wrapper = [[TitaniumHost sharedHost] blobForUrl:url];
		// check since it could be cached
		image = [wrapper imageBlob];
		if (image==nil)
		{
			if (backgrouders==nil) backgrouders = [[NSMutableArray alloc]init];
			[index retain]; // addObserver doesn't retain so we need to
			[self retain];
			[backgrouders addObject:wrapper];
			[wrapper addObserver:self forKeyPath:@"imageBlob" options:NSKeyValueObservingOptionNew context:index];
			[wrapper retain];
			return nil;
		}
	}
	return [NSDictionary dictionaryWithObjectsAndKeys:image,@"image",index,@"index",nil];
}

- (void)setImageData:(NSDictionary*)args
{
	if (args!=nil && view!=nil)
	{
		[view setImage:[args objectForKey:@"image"] forIndex:[[args objectForKey:@"index"] intValue]];
	}
}

#pragma mark Delegates


- (void)openFlowView:(AFOpenFlowView *)openFlowView selectionDidChange:(int)index
{
	TitaniumHost * theHost = [TitaniumHost sharedHost];
	NSString * pathString = [self javaScriptPath];
	NSString * commandString = [NSString stringWithFormat:@"var prev = %@._SEL; %@._SEL=%d; %@.doEvent('change',{type:'change',index:%d,previous:prev}); ",pathString, pathString,index,pathString,index];	
	[theHost sendJavascript:commandString toPagesWithTokens:listeningWebContextTokens update:YES];
}

- (void)openFlowView:(AFOpenFlowView *)openFlowView click:(int)index
{
	TitaniumHost * theHost = [TitaniumHost sharedHost];
	NSString * pathString = [self javaScriptPath];
	NSString * commandString = [NSString stringWithFormat:@"var prev = %@._SEL; %@._SEL=%d; %@.doEvent('click',{type:'click',index:%d,previous:prev}); ",pathString, pathString,index,pathString,index];	
	[theHost sendJavascript:commandString toPagesWithTokens:listeningWebContextTokens update:YES];
}

- (void)openFlowView:(AFOpenFlowView *)openFlowView requestImageForIndex:(int)index
{
	id path = [images objectAtIndex:index];
	UIImage *image = [[TitaniumHost sharedHost] imageForResource:path];
	if (image==nil)
	{
		NSURL *url = nil;
		if ([path isKindOfClass:[NSURL class]])
		{
			url = (NSURL*)path;
		}
		else 
		{
			url = [NSURL URLWithString:path];
		}
		TitaniumBlobWrapper *wrapper = [[TitaniumHost sharedHost] blobForUrl:url];
		image = [wrapper imageBlob];
		if (image==nil)
		{
			// just set the placeholder placeholder
			UIImage *image = [self defaultImage];
			[view setImage:image forIndex:index];

			// queue it
			if (backgrouders==nil) backgrouders = [[NSMutableArray alloc]init];
			[backgrouders addObject:wrapper];
			NSNumber *i = [NSNumber numberWithInt:index];
			// addObserver doesn't retain so we need to
			[i retain];
			[self retain];
			[wrapper addObserver:self forKeyPath:@"imageBlob" options:NSKeyValueObservingOptionNew context:i];
			[wrapper retain];
			return;
		}
	}
	[view setImage:image forIndex:index];
}

- (UIImage *)defaultImage
{
	return [[TitaniumHost sharedHost] imageForResource:@"modules/ui/images/photoDefault.png"];
}

@end
