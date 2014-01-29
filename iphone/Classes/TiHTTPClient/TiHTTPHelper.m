//
//  TiHelper.m
//  HTTPClient
//
//  Created by Pedro Enrique on 1/20/14.
//  Copyright (c) 2014 Pedro Enrique. All rights reserved.
//

#import "TiHTTPHelper.h"

@implementation TiHTTPHelper

static char *alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

+(NSString *)base64encode:(NSData *)plainText
{
    int encodedLength = (4 * (([plainText length] / 3) + (1 - (3 - ([plainText length] % 3)) / 3))) + 1;
    unsigned char *outputBuffer = malloc(encodedLength);
    unsigned char *inputBuffer = (unsigned char *)[plainText bytes];
    
    NSInteger i;
    NSInteger j = 0;
    int remain;
    
    for(i = 0; i < [plainText length]; i += 3) {
        remain = [plainText length] - i;
        
        outputBuffer[j++] = alphabet[(inputBuffer[i] & 0xFC) >> 2];
        outputBuffer[j++] = alphabet[((inputBuffer[i] & 0x03) << 4) |
                                     ((remain > 1) ? ((inputBuffer[i + 1] & 0xF0) >> 4): 0)];
        
        if(remain > 1)
            outputBuffer[j++] = alphabet[((inputBuffer[i + 1] & 0x0F) << 2)
                                         | ((remain > 2) ? ((inputBuffer[i + 2] & 0xC0) >> 6) : 0)];
        else
            outputBuffer[j++] = '=';
        
        if(remain > 2)
            outputBuffer[j++] = alphabet[inputBuffer[i + 2] & 0x3F];
        else
            outputBuffer[j++] = '=';
    }
    
    outputBuffer[j] = 0;
    NSString *result = [NSString stringWithUTF8String:(const char*)outputBuffer];
    free(outputBuffer);
    
    return result;
}

@end
