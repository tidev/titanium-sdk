/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSDOCUMENTVIEWER
#import "TiUIiOSDocumentViewerProxy.h"
#import <TitaniumKit/TiApp.h>
#import <TitaniumKit/TiBlob.h>
#import <TitaniumKit/TiUtils.h>
#import <TitaniumKit/TiViewProxy.h>

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
    TiBlob *blob = [[TiBlob alloc] initWithImage:image];
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
// a temporary file.
- (NSURL *)_toURL:(NSString *)object proxy:(TiProxy *)proxy
{
  if (![TiUtils isIOSVersionOrGreater:@"11.2"]) {
    return [TiUtils toURL:object proxy:proxy];
  }

  // Reference the old URL and file basename
  NSURL *fileURL = [TiUtils toURL:object proxy:self];
  NSString *fileName = [[fileURL absoluteString] lastPathComponent];

  // If the original (!) file already exists in the application-data-directory, return it!
  NSString *documentsPath = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES)[0];
  NSString *file = [documentsPath stringByAppendingPathComponent:fileName];

  if ([[NSFileManager defaultManager] fileExistsAtPath:file]) {
    return fileURL;
  }

  // If the file does not exist in the application data directory, create it!
  NSString *generatedFileName = [NSString stringWithFormat:@"tmp-%@", fileName];
  NSError *error = nil;
  NSURL *fixedURL = [NSURL fileURLWithPath:documentsPath isDirectory:YES];

  // If the generated (!) file already exists in the application-data-directory, return it as well!
  if ([[NSFileManager defaultManager] fileExistsAtPath:fixedURL.path]) {
    return fileURL;
  }

  [[NSFileManager defaultManager] copyItemAtURL:fileURL
                                          toURL:[fixedURL URLByAppendingPathComponent:generatedFileName]
                                          error:&error];

  // In case the file could not be copied, return the old URL and warn the user
  if (error != nil) {
    NSLog(@"[ERROR] Could not copy file to application data directory automatically, please copy it manually to work around the Apple iOS 11.2+ bug.");
    NSLog(@"[ERROR] %@", error.localizedDescription);
    return fileURL;
  }

  return [fixedURL URLByAppendingPathComponent:generatedFileName];
}

#pragma mark Delegates

- (UIViewController *)documentInteractionControllerViewControllerForPreview:(UIDocumentInteractionController *)controller
{
  return [[TiApp controller] topPresentedController];
}

- (void)documentInteractionControllerWillBeginPreview:(UIDocumentInteractionController *)controller
{
  if ([self _hasListeners:@"load"]) {
    [self fireEvent:@"load" withObject:nil];
  }
}

- (void)documentInteractionControllerDidEndPreview:(UIDocumentInteractionController *)controller
{
  // Delete temporary copied files from application data directory again
  if ([controller.URL.lastPathComponent hasPrefix:@"tmp-"]) {
    NSError *error = nil;
    [[NSFileManager defaultManager] removeItemAtURL:controller.URL error:&error];

    if (error != nil) {
      DebugLog(@"[ERROR] Error removing temporary file from application data directory: %@", error.localizedDescription);
    }
  }

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
