

#import <Foundation/Foundation.h>

@interface NuZip : NSObject {}

+ (BOOL) unzip: (NSString *) inputPath toFolder: (NSString *) outputPath password:(NSString *) passwordString error:(NSError **) error;

@end
