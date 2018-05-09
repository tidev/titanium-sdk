/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifndef TI_LOG_SERVER_H
#define TI_LOG_SERVER_H

#ifndef DISABLE_TI_LOG_SERVER

@interface TiLogServer : NSObject {
}
+ (void)log:(NSString *)message;
+ (void)startServer;
+ (void)stopServer;
@end

#endif /* DISABLE_TI_LOG_SERVER */

#endif /* TI_LOG_SERVER_H */
