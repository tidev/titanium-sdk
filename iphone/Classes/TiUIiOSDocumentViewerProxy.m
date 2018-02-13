/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSDOCUMENTVIEWER
#import "TiUIiOSDocumentViewerProxy.h"
#import "TiApp.h"
#import "TiBlob.h"
#import "TiUtils.h"
#import "TiViewProxy.h"

@implementation TiUIiOSDocumentViewerProxy

- (void)_destroy
{
  controller.delegate = nil;
  RELEASE_TO_NIL(controller);
  [super _destroy];
}

- (UIDocumentInteractionController *)controller
{
  if (controller == nil) {
    NSURL *url = [self _toURL:[self valueForUndefinedKey:@"url"] proxy:self];
    controller = [[UIDocumentInteractionController interactionControllerWithURL:url] retain];
    controller.delegate = self;
  }
  return controller;
}

- (NSString *)apiName
{
  return @"Ti.UI.iOS.DocumentViewer";
}

- (void)setAnnotation:(id)args
{
  [self controller].annotation = [args objectAtIndex:0];
}

- (void)show:(id)args
{
  ENSURE_SINGLE_ARG_OR_NIL(args, NSDictionary);
  [self rememberSelf];
  ENSURE_UI_THREAD(show, args);
  BOOL animated = [TiUtils boolValue:@"animated" properties:args def:YES];

  TiViewProxy *view = [args objectForKey:@"view"];
  if (view != nil) {
    if ([view supportsNavBarPositioning] && [view isUsingBarButtonItem]) {
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

- (void)hide:(id)args
{
  ENSURE_TYPE_OR_NIL(args, NSDictionary);
  ENSURE_UI_THREAD(hide, args);
  BOOL animated = [TiUtils boolValue:@"animated" properties:args def:YES];
  [[self controller] dismissPreviewAnimated:animated];
}

- (id)url
{
  if (controller != nil) {
    return [[[self controller] URL] absoluteString];
  }
  return nil;
}

- (void)setUrl:(id)value
{
  ENSURE_TYPE(value, NSString);
  NSURL *url = [self _toURL:value proxy:self];
  //UIDocumentInteractionController is recommended to be a new instance for every different url
  //instead of having titanium developer create a new instance every time a new document url is loaded
  //we assume that setUrl is called to change doc, so we go ahead and release the controller and create
  //a new one when asked to present
  RELEASE_TO_NIL(controller);
  [self replaceValue:url forKey:@"url" notification:NO];
}

- (id)icons
{
  NSMutableArray *result = [NSMutableArray array];

  for (UIImage *image in [self controller].icons) {
    TiBlob *blob = [[TiBlob alloc] _initWithPageContext:[self pageContext] andImage:image];
    [result addObject:image];
    [blob release];
  }

  return result;
}

- (id)name
{
  if (controller != nil) {
    return [controller name];
  }
  return nil;
}

#pragma mark Utilities

// Workaround for an issue occuring on iOS 11.2+ that causes
// files from the resources-directory (app-bundle) to not be
// recognized properly. This method works around this by creating
// a temporary file that is flushed after the app terminates.
- (NSURL *)_toURL:(NSString *)object proxy:(TiProxy *)proxy
{
  if (![TiUtils isIOSVersionOrGreater:@"11.2"]) {
    return [TiUtils toURL:object proxy:proxy];
  }

  // Reference the old URL and file basename
  NSURL *fileURL = [TiUtils toURL:object proxy:self];
  NSString *fileName = [[fileURL absoluteString] lastPathComponent];

  // Check if the file already exists in the application-data-directory.
  // If so, return it.
  NSString *documentsPath = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES)[0];
  NSString *file = [documentsPath stringByAppendingPathComponent:fileName];

  if ([[NSFileManager defaultManager] fileExistsAtPath:file]) {
    return fileURL;
  }

  // Check if the file already exists in the cache-directory.
  // If so, return it.
  NSArray *tmpDirectory = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:NSTemporaryDirectory() error:NULL];
  for (NSString *file in tmpDirectory) {
    if ([file isEqualToString:fileName]) {
      return [NSURL fileURLWithPath:file relativeToURL:[NSURL fileURLWithPath:NSTemporaryDirectory() isDirectory:YES]];
    }
  }

  // If the file does not exist in the temporary- and application-data-directory,
  // create it in the temporary directory.
  NSError *error = nil;
  NSURL *temporaryURL = [NSURL fileURLWithPath:NSTemporaryDirectory() isDirectory:YES];
  [[NSFileManager defaultManager] copyItemAtURL:fileURL
                                          toURL:[temporaryURL URLByAppendingPathComponent:fileName]
                                          error:&error];

  // In case the file could not be copied, return the old URL and warn the user
  if (error != nil) {
    NSLog(@"[ERROR] Could not copy file to temporary directory automatically, copy it manually to work around the Apple iOS 11.2+ bug.");
    return fileURL;
  }

  return [temporaryURL URLByAppendingPathComponent:fileName];
}

#pragma mark Delegates

- (UIViewController *)documentInteractionControllerViewControllerForPreview:(UIDocumentInteractionController *)controller
{
  return [[TiApp controller] topPresentedController];
}

/*
- (UIView *)documentInteractionControllerViewForPreview:(UIDocumentInteractionController *)controller
{
	return viewController.view;
}*/

- (void)documentInteractionControllerWillBeginPreview:(UIDocumentInteractionController *)controller
{
  if ([self _hasListeners:@"load"]) {
    [self fireEvent:@"load" withObject:nil];
  }
}

- (void)documentInteractionControllerDidEndPreview:(UIDocumentInteractionController *)controller
{
  if ([self _hasListeners:@"unload"]) {
    [self fireEvent:@"unload" withObject:nil];
  }
  [self forgetSelf];
}

- (void)documentInteractionControllerWillPresentOpenInMenu:(UIDocumentInteractionController *)controller
{
  if ([self _hasListeners:@"menu"]) {
    NSDictionary *event = [NSDictionary dictionaryWithObject:@"open" forKey:@"type"];
    [self fireEvent:@"menu" withObject:event];
  }
}

- (void)documentInteractionControllerWillPresentOptionsMenu:(UIDocumentInteractionController *)controller
{
  if ([self _hasListeners:@"menu"]) {
    NSDictionary *event = [NSDictionary dictionaryWithObject:@"options" forKey:@"type"];
    [self fireEvent:@"menu" withObject:event];
  }
}

@end

#endif
