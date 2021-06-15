#import "TiEvaluator.h"

@class TiHost;

@protocol Module <NSObject>

/*
 * Used to force a module name for native modules. This is used in the calculation of the expected proxy name for proxy factory method calls.
 * i.e. TiMapModule w/ a call to Map.createAnnotation => TiMapAnnotationProxy
 * w/ no name set, it will prepend "Ti" i.e. UIModule w/ a call to createWindow => TiUIWindowProxy
 * This logic is currently only used in TiModule.m
 */
- (void)_setName:(NSString *)moduleClassName;
- (void)setExecutionContext:(id<TiEvaluator>)context;
- (void)setHost:(TiHost *)host;
- (BOOL)isJSModule;
- (NSData *)moduleJS;
- (BOOL)destroyed;
- (void)release;
- (NSData *)loadModuleAsset:(NSString *)fromPath;

@end
