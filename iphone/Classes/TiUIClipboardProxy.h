/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_UICLIPBOARD
@import TitaniumKit.ObjcProxy;

@protocol ClipboardExports <JSExport>

// Properties (and accessors)
READONLY_PROPERTY(bool, allowCreation, AllowCreation);
READONLY_PROPERTY(NSString *, name, Name);
READONLY_PROPERTY(bool, unique, Unique);

// The "text" property is exposed via @property so that JS `clipboard.text = x`
// routes through setText: and `clipboard.text` routes through getText. Without
// the @property declaration JSExport treats these as plain methods and JS
// property assignment never reaches the native setter (silent no-op on iOS 26).
@property (nonatomic, copy, getter=getText, setter=setText:) NSString *text;

// Methods
- (void)clearData:(NSString *)type;
- (void)clearText;
- (JSValue *)getData:(NSString *)type;
- (NSArray<NSDictionary<NSString *, id> *> *)getItems;
- (NSString *)getText;
- (bool)hasData:(id)type;
- (bool)hasText;
- (bool)hasURLs;
- (bool)hasImages;
- (bool)hasColors;
JSExportAs(setData,
           -(void)setData
           : (NSString *)type withData
           : (JSValue *)data);
- (void)setText:(NSString *)text;
- (void)setItems:(NSDictionary<NSString *, id> *)items;
- (void)remove;

@end

@interface TiUIClipboardProxy : ObjcProxy <ClipboardExports> {
  @private
  UIPasteboard *_pasteboard;
  BOOL shouldCreatePasteboard;
  BOOL isUnique;
}

- (id)getData_:(NSString *)mimeType;

@end
#endif
