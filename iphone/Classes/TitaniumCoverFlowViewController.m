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
			int count = 0;
			for (int c=0;c<[images count];c++)
			{
				id path = [images objectAtIndex:c];
				UIImage *image = [[TitaniumHost sharedHost] imageForResource:path];
				if (image!=nil)
				{
					[view setImage:image forIndex:c];
					[image release];
					count++;
				}
			}
			[view setNumberOfImages:[images count]];
		}
		[backgroundColor release];
		backgroundColor=nil;
	}
	return view;
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation {
	return YES;
}

-(void)dealloc
{
	[view release];
	[images release];
	[backgroundColor release];
	[super dealloc];
}

- (void) readState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
{
	Class dictClass = [NSDictionary class];
	if(![inputState isKindOfClass:dictClass])return;
	
	NSArray *array = [inputState objectForKey:@"images"];
	if (array!=nil)
	{
		images = [array retain];
	}
	
	NSString *clr = [inputState objectForKey:@"backgroundColor"];
	if (clr!=nil)
	{
		backgroundColor = UIColorWebColorNamed(clr);
	}
}

-(void)updateImage:(NSArray*)data
{
	TitaniumBlobWrapper *wrapper = [[TitaniumHost sharedHost] blobForUrl:[data objectAtIndex:0]];
	UIImage * image = [wrapper imageBlob];
	int index = [[data objectAtIndex:1] intValue];
	[view setImage:image forIndex:index];
	[image release];
}

-(void)setUrl:(NSURL*)url index:(NSNumber*)index
{
	NSArray *array = [NSArray arrayWithObjects:url,index,nil];
	
	if(![NSThread isMainThread]){
		[self performSelectorOnMainThread:@selector(updateImage:) withObject:array waitUntilDone:NO];
	} else {
		[self updateImage:array];
	}
	
}

-(void)setSelected:(NSNumber*)index
{
	if(![NSThread isMainThread]){
		[self performSelectorOnMainThread:@selector(setSelected:) withObject:index waitUntilDone:NO];
	} else {
		[view setSelectedCover:[index intValue]];
		[view centerOnSelectedCover:YES];
	}
}

#pragma mark Delegates


- (void)openFlowView:(AFOpenFlowView *)openFlowView selectionDidChange:(int)index
{
	TitaniumHost * theHost = [TitaniumHost sharedHost];
	NSString * pathString = [self javaScriptPath];
	NSString * commandString = [NSString stringWithFormat:@"var prev = %@._SEL; %@._SEL=%d; %@.doEvent('click',{type:'click',index:%d,previous:prev}); ",pathString, pathString,index,pathString,index];	
	[theHost sendJavascript:commandString toPagesWithTokens:listeningWebContextTokens update:YES];
}

- (void)openFlowView:(AFOpenFlowView *)openFlowView requestImageForIndex:(int)index
{
}

- (UIImage *)defaultImage
{
	return nil;
}

@end
