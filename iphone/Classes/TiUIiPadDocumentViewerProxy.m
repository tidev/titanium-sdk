/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPADDOCUMENTVIEWER

#import "TiUIiPadDocumentViewerProxy.h"
#import "TiUtils.h"
#import "TiBlob.h"
#import "TitaniumApp.h"
#import "TiViewProxy.h"

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2


@implementation TiUIiPadDocumentViewerProxy

-(void)_destroy
{
	RELEASE_TO_NIL(controller);
	[super _destroy];
}

-(UIDocumentInteractionController*)controller
{
	if (controller==nil)
	{
		NSURL *url = [TiUtils toURL:[self valueForUndefinedKey:@"url"] proxy:self];
		controller = [[UIDocumentInteractionController interactionControllerWithURL:url] retain];
		controller.delegate = self;
	}
	return controller;
}

-(void)setAnnotation:(id)args
{
	[self controller].annotation = [args objectAtIndex:0];
}

-(void)show:(id)args
{
	ENSURE_SINGLE_ARG_OR_NIL(args,NSDictionary);
	BOOL animated = [TiUtils boolValue:@"animated" properties:args def:YES];

	TiViewProxy* view = [args objectForKey:@"view"];
	if (view!=nil)
	{
		if ([view supportsNavBarPositioning])
		{
			UIBarButtonItem *item = [view barButtonItem];
			[[self controller] presentOptionsMenuFromBarButtonItem:item animated:animated];
			return;
		}
		
		CGRect rect = [TiUtils rectValue:args];
		[[self controller] presentOptionsMenuFromRect:rect inView:[view view] animated:animated];
		return;
	}
	
	[[self controller] presentPreviewAnimated:animated];
}

-(void)hide:(id)args
{
	ENSURE_TYPE_OR_NIL(args,NSDictionary);
	BOOL animated = [TiUtils boolValue:@"animated" properties:args def:YES];
	[[self controller] dismissPreviewAnimated:animated];
}

-(id)url
{
	if (controller!=nil)
	{
		return [[[self controller] URL] absoluteString];
	}
	return nil;
}

-(void)setUrl:(id)value
{
	ENSURE_TYPE(value,NSString);
	NSURL *url = [TiUtils toURL:value proxy:self];
	if (controller!=nil)
	{
		[self controller].URL = url;
	}
	else 
	{
		[self replaceValue:url forKey:@"url" notification:NO];
	}
}

-(id)icons
{
	NSMutableArray *result = [NSMutableArray array];
	
	for (UIImage *image in [self controller].icons)
	{
		TiBlob *blob = [[TiBlob alloc] initWithImage:image];
		[result addObject:image];
		[blob release];
	}
	
	return result;
}

-(id)name
{
	if (controller!=nil)
	{
		return [controller name];
	}
	return nil;
}

#pragma mark Delegates

- (UIViewController *)documentInteractionControllerViewControllerForPreview:(UIDocumentInteractionController *)controller
{
	UIViewController *ac = [[TitaniumApp app] controller];
	return ac;
}
 
/*
- (UIView *)documentInteractionControllerViewForPreview:(UIDocumentInteractionController *)controller
{
	return viewController.view;
}*/

- (void)documentInteractionControllerWillBeginPreview:(UIDocumentInteractionController *)controller
{
	if ([self _hasListeners:@"load"])
	{
		[self fireEvent:@"load" withObject:nil];
	}
}

- (void)documentInteractionControllerDidEndPreview:(UIDocumentInteractionController *)controller
{
	if ([self _hasListeners:@"unload"])
	{
		[self fireEvent:@"unload" withObject:nil];
	}
}


- (void)documentInteractionControllerWillPresentOpenInMenu:(UIDocumentInteractionController *)controller
{
	if ([self _hasListeners:@"menu"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObject:@"open" forKey:@"type"];
		[self fireEvent:@"menu" withObject:event];
	}
}

- (void)documentInteractionControllerWillPresentOptionsMenu:(UIDocumentInteractionController *)controller
{
	if ([self _hasListeners:@"menu"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObject:@"options" forKey:@"type"];
		[self fireEvent:@"menu" withObject:event];
	}
}



@end

#endif

#endif