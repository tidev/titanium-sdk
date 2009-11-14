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
	[images replaceObjectAtIndex:[index intValue] withObject:url];
	[[OperationQueue sharedQueue] queue:@selector(loadImage:) target:self arg:index after:@selector(setImageData:) on:self ui:YES];
}

-(void)setSelected:(NSNumber*)index
{
	if(![NSThread isMainThread]){
		[self performSelectorOnMainThread:@selector(setSelected:) withObject:index waitUntilDone:NO];
	} else {
		[view setSelectedCover:[index intValue]];
		[view centerOnSelectedCover:YES];
		// trigger callback event
		[self openFlowView:view selectionDidChange:[index intValue]];
	}
}

#pragma mark OperationQueue callbacks

-(id)loadImage:(NSNumber*)index
{
	id path = [images objectAtIndex:[index intValue]];
	UIImage *image = [[TitaniumHost sharedHost] imageForResource:path];
	if (image==nil)
	{
		NSLog(@"[ERROR] couldn't find URL: %@ for cover flow image index: %@",path,index);
		return nil;
	}
	return [NSDictionary dictionaryWithObjectsAndKeys:image,@"image",index,@"index",nil];
}

- (void)setImageData:(NSDictionary*)args
{
	if (args!=nil)
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
	[[OperationQueue sharedQueue] queue:@selector(loadImage:) target:self arg:[NSNumber numberWithInt:index] after:@selector(setImageData:) on:self ui:YES];
}

- (UIImage *)defaultImage
{
	return [UIImage imageNamed:@"modules/ui/images/photoDefault.png"];
}

@end
