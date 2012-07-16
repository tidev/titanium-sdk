/*
 * Copyright (c) 2008 Plausible Labs Cooperative, Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of any contributors
 *    may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

#import "PlausibleDatabase.h"

/** 
 * Generic Database Exception
 * @ingroup exceptions
 */
NSString *TI_PLDatabaseException = @"com.plausiblelabs.pldatabase.exception.generic";

/** Plausible Database NSError Domain
 * @ingroup globals */
NSString *TI_PLDatabaseErrorDomain = @"com.plausiblelabs.pldatabase";

/**
 * Key to retrieve the optionally provided SQL query which caused the error from an NSError in the PLDatabaseErrorDomain, as an NSString
 * @ingroup globals
 */
NSString *TI_PLDatabaseErrorQueryStringKey = @"com.plausiblelabs.pldatabase.error.query.string";

/**
  * Key to retrieve the native database error code from an NSError in the PLDatabaseErrorDomain, as an NSNumber
  * @ingroup globals
  */
NSString *TI_PLDatabaseErrorVendorErrorKey = @"com.plausiblelabs.pldatabase.error.vendor.code";

/** 
 * Key to retrieve the native database error string from an NSError in the PLDatabaseErrorDomain, as an NSString
 * @ingroup globals
 */
NSString *TI_PLDatabaseErrorVendorStringKey = @"com.plausiblelabs.pldatabase.error.vendor.string";

/**
 * @internal
 * Implementation-private utility methods.
 */
@implementation PlausibleDatabase

/**
 * @internal
 *
 * Create a new NSError in the PLDatabaseErrorDomain.
 *
 * @param errorCode The error code.
 * @param localizedDescription A localized error description.
 * @param queryString The optional query which caused the error.
 * @param nativeCode The native SQL driver's error code.
 * @param nativeString The native SQL driver's non-localized error string.
 * @return A NSError that may be returned to the API caller.
 */
+ (NSError *) errorWithCode: (TI_PLDatabaseError) errorCode localizedDescription: (NSString *) localizedDescription 
                queryString: (NSString *) queryString vendorError: (NSNumber *) vendorError
                vendorErrorString: (NSString *) vendorErrorString 
{
    NSMutableDictionary *userInfo;

    /* Create the userInfo dictionary */
    userInfo = [NSMutableDictionary dictionaryWithObjectsAndKeys: 
                localizedDescription, NSLocalizedDescriptionKey,
                vendorError, TI_PLDatabaseErrorVendorErrorKey,
                vendorErrorString, TI_PLDatabaseErrorVendorStringKey,
                nil];
    
    /* Optionally insert the query string. */
    if (queryString != nil)
        [userInfo setObject: queryString forKey: TI_PLDatabaseErrorQueryStringKey];
    
    /* Return the NSError */
    return [NSError errorWithDomain: TI_PLDatabaseErrorDomain code: errorCode userInfo: userInfo];
}

@end