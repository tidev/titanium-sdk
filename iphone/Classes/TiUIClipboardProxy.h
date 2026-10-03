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

// "text" is exposed both as a JS property (clipboard.text / clipboard.text = x)
// and as JS methods (clipboard.getText() / clipboard.setText(x)). JSExport only
// routes JS property assignment through the native setter when the property is
// declared via @property; without it, clipboard.text = x silently no-ops on
// iOS 26. The GETTER/SETTER macros below expose the legacy getX/setX method
// forms alongside the property.
@property (nonatomic, copy) NSString *text;
GETTER(NSString *, Text);
SETTER(NSString *, Text);

// Methods
- (void)clearData:(NSString *)type;
- (void)clearText;
- (JSValue *)getData:(NSString *)type;
- (NSArray<NSDictionary<NSString *, id> *> *)getItems;
- (bool)hasData:(id)type;
- (bool)hasText;
- (bool)hasURLs;
- (bool)hasImages;
- (bool)hasColors;
JSExportAs(setData,
           -(void)setData
           : (NSString *)type withData
           : (JSValue *)data);
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
