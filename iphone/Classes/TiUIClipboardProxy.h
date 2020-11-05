/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_UICLIPBOARD
#import <TitaniumKit/TiProxy.h>
@interface TiUIClipboardProxy : TiProxy {
  @private
  UIPasteboard *_pasteboard;
  NSString *pasteboardName;
  BOOL shouldCreatePasteboard;
  BOOL isNamedPasteBoard;
  BOOL isUnique;
}

#pragma mark internal
- (id)getData_:(NSString *)mimeType;

- (void)clearData:(id)args;
- (void)clearText:(id)args;
- (id)getData:(id)args;
- (NSString *)getText:(id)args;
- (id)hasData:(id)args;
- (id)hasText:(id)unused;
- (void)setData:(id)args;
- (void)setText:(id)args;
- (void)remove:(id)unused;

@end
#endif
