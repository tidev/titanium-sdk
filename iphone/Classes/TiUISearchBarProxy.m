/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UITABLEVIEW) || defined(USE_TI_UILISTVIEW)
#ifndef USE_TI_UISEARCHBAR
#define USE_TI_UISEARCHBAR
#endif
#endif

#ifdef USE_TI_UISEARCHBAR

#import "TiUISearchBarProxy.h"
#import "TiUISearchBar.h"

@implementation TiUISearchBarProxy
@synthesize showsCancelButton;

#pragma mark Method forwarding

- (NSString *)apiName
{
  return @"Ti.UI.SearchBar";
}

- (void)blur:(id)args
{
  [self makeViewPerformSelector:@selector(blur:) withObject:args createIfNeeded:YES waitUntilDone:NO];
}

- (void)focus:(id)args
{
  [self makeViewPerformSelector:@selector(focus:) withObject:args createIfNeeded:YES waitUntilDone:NO];
}

- (void)windowWillClose
{
  if ([self viewInitialized]) {
    [self makeViewPerformSelector:@selector(blur:) withObject:nil createIfNeeded:NO waitUntilDone:YES];
  }
  [super windowWillClose];
}

- (void)setShowCancel:(id)value withObject:(id)object
{
  BOOL boolValue = [TiUtils boolValue:value];
  BOOL animated = [TiUtils boolValue:@"animated" properties:object def:NO];
  //TODO: Value checking and exception generation, if necessary.

  [self replaceValue:value forKey:@"showCancel" notification:NO];
  showsCancelButton = boolValue;

  //ViewAttached gives a false negative when not attached to a window.
  TiThreadPerformOnMainThread(^{
    UISearchBar *search = [self searchBar];
    [search setShowsCancelButton:showsCancelButton animated:animated];
    [search sizeToFit];
  },
      NO);
}

- (void)setDelegate:(id<UISearchBarDelegate>)delegate
{
  [self makeViewPerformSelector:@selector(setDelegate:) withObject:delegate createIfNeeded:(delegate != nil) waitUntilDone:YES];
}

- (UISearchBar *)searchBar
{
  return [(TiUISearchBar *)[self view] searchBar];
}

- (void)setSearchBar:(UISearchBar *)searchBar
{
  // In UISearchController searchbar is readonly. We have to replace that search bar with existing search bar of proxy.
  [(TiUISearchBar *)[self view] setSearchBar:searchBar];

  // Set search bar properties to new search bar
  NSDictionary *properties = [self allProperties];
  for (NSString *key in properties.allKeys) {
    SEL selector = SetterForKrollProperty(key);
    if ([(TiUISearchBar *)[self view] respondsToSelector:selector]) {
      [(TiUISearchBar *)[self view] performSelector:selector withObject:[properties objectForKey:key]];
    }
  }
}

- (void)ensureSearchBarHierarchy
{
  WARN_IF_BACKGROUND_THREAD;
  if ([self viewAttached]) {
    UISearchBar *searchBar = [self searchBar];
    if ([searchBar superview] != view) {
      [view addSubview:searchBar];
    }
    [searchBar setFrame:[view bounds]];
  }
}

- (NSMutableDictionary *)langConversionTable
{
  return [NSMutableDictionary dictionaryWithObjectsAndKeys:@"prompt", @"promptid", @"hintText", @"hinttextid", nil];
}

- (TiDimension)defaultAutoHeightBehavior:(id)unused
{
  return TiDimensionAutoSize;
}

#pragma mark getters

- (NSString *)value
{
  return [[self searchBar] text];
}

- (NSNumber *)showBookmark
{
  return NUMBOOL([[self searchBar] showsBookmarkButton]);
}

- (NSNumber *)showCancel
{
  return NUMBOOL([[self searchBar] showsCancelButton]);
}

- (NSString *)hintText
{
  return [[self searchBar] placeholder];
}

- (id)hintTextColor
{
  return [self valueForUndefinedKey:@"hintTextColor"];
}

- (id)color
{
  return [self valueForUndefinedKey:@"color"];
}

- (NSNumber *)keyboardType
{
  return @([[self searchBar] keyboardType]);
}

- (NSNumber *)keyboardAppearance
{
  return @([[self searchBar] keyboardAppearance]);
}

- (NSString *)prompt
{
  return [[self searchBar] prompt];
}

- (NSNumber *)autocorrect
{
  UITextAutocorrectionType autocorrectionType = [[self searchBar] autocorrectionType];
  if (autocorrectionType == UITextAutocorrectionTypeYes) {
    return NUMBOOL(YES);
  } else if (autocorrectionType == UITextAutocorrectionTypeNo) {
    return NUMBOOL(NO);
  } else {
    return nil;
  }
}

- (NSNumber *)autocapitalization
{
  return @([[self searchBar] autocapitalizationType]);
}

- (id)tintColor
{
  return [self valueForUndefinedKey:@"tintColor"];
}

- (id)barColor
{
  return [self valueForUndefinedKey:@"barColor"];
}

- (NSNumber *)style
{
  return @([[self searchBar] searchBarStyle]);
}

#if IS_SDK_IOS_13
- (void)insertTokenAtIndex:(id)params
{
  ENSURE_ARG_COUNT(params, 2);

  if (![TiUtils isIOSVersionOrGreater:@"13.0"]) {
    return;
  }

  NSDictionary<NSString *, NSString *> *token = params[0];
  int index = [TiUtils intValue:params[1]];

  UISearchToken *searchToken = [UISearchToken tokenWithIcon:[TiUtils toImage:token[@"image"] proxy:self]
                                                       text:[TiUtils stringValue:@"text" properties:token]];

  if (token[@"identifier"] == nil) {
    NSLog(@"[WARN] Missing search token identifier! Using a generated UUID …");
  }

  searchToken.representedObject = [TiUtils stringValue:@"identifier" properties:token def:[TiUtils createUUID]];

  [[[self searchBar] searchTextField] insertToken:searchToken atIndex:index];
}

- (void)removeTokenAtIndex:(id)index
{
  ENSURE_SINGLE_ARG(index, NSNumber);
  if (![TiUtils isIOSVersionOrGreater:@"13.0"]) {
     return;
   }
  [[[self searchBar] searchTextField] removeTokenAtIndex:[TiUtils intValue:index]];
}

- (NSArray<NSDictionary<NSString *, NSString *> *> *)tokens
{
  NSArray<UISearchToken *> *tokens = [[[self searchBar] searchTextField] tokens];
  NSMutableArray<id> *result = [NSMutableArray arrayWithCapacity:tokens.count];

  [tokens enumerateObjectsUsingBlock:^(UISearchToken *_Nonnull obj, NSUInteger idx, BOOL *_Nonnull stop) {
    [result addObject:obj.representedObject];
  }];

  return result;
}
#endif

USE_VIEW_FOR_CONTENT_HEIGHT
@end

#endif
