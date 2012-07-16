/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "NSData+Additions.h"
#import "Base64Transcoder.h"
#import <CommonCrypto/CommonCryptor.h>

#pragma mark Hex

/* HEX specific routines are copyright:
 
 Copyright (c) 2006, Big Nerd Ranch, Inc.
 All rights reserved.
 
 Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 
 Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 Neither the name of Big Nerd Ranch, Inc. nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

NSData * dataWithHexString (NSString * hexString)
{	
	// Hex Lookup Table
	unsigned char HEX_LOOKUP[] = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 
		6, 7, 8, 9, 0, 0, 0, 0, 0, 0, 0, 10, 11, 12, 13, 14, 15, 0, 0, 
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
		0, 0, 0, 10, 11, 12, 13, 14, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
	
	// If we have an odd number of characters, add an extra digit, rounding the
	// size of the NSData up to the nearest byte
	if ([hexString length] % 2 == 1)  {
		hexString = [NSString stringWithFormat:@"0%@", hexString]; 
	}
	
	// Iterate through the string, adding each character (equivilent to 1/2 
	// byte) to the NSData result
	int i;
	char current;
	const int size = [hexString length] / 2;
	const char * stringBuffer = [hexString cStringUsingEncoding:NSASCIIStringEncoding];
	NSMutableData * result = [NSMutableData dataWithLength:size];
	char * resultBuffer = (char*)[result mutableBytes];
	for (i = 0; i < size; i++) {
		// Get first character, use as high order bits
		current = stringBuffer[i * 2];
		resultBuffer[i] = HEX_LOOKUP[current] << 4;
		
		// Get second character, use as low order bits
		current = stringBuffer[(i * 2) + 1];
		resultBuffer[i] = resultBuffer[i] | HEX_LOOKUP[current];
	}
	
	return [NSData dataWithData:result];
}

NSString *stringWithHexString (NSString * hexString)
{
	NSData *data = dataWithHexString(hexString);
	return [[[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] autorelease];
}


#pragma mark AES128

// we use 128 bits vs 256 as a much better performance alternative
// and given the size of 128 bits and the fact that 128 is approved
// for NSA top secret .. we're probably OK at this point.  at some
// point maybe we allow this to be increased... but for now... here's
// some commentary on the 128 bit issue:
//
// Assuming that one could build a machine that could recover a DES 
// key in a second (i.e., try 255 keys per second), it would take that 
// machine approximately 149 thousand billion (149 trillion) years to 
// crack a 128-bit AES key. To put that into perspective, the universe 
// is believed to be fewer than 20 billion years old.
//
// so suck it...
//

#ifdef INCLUDE_ENCRYPT
NSData * AES128EncryptWithKey (NSData * thedata, NSString * key) 
{
	// 'key' should be 16 bytes for AES128, will be null-padded otherwise
	char keyPtr[kCCKeySizeAES128+1]; // room for terminator (unused)
	bzero(keyPtr, sizeof(keyPtr)); // fill with zeroes (for padding)
	
	// fetch key data
	[key getCString:keyPtr maxLength:sizeof(keyPtr) encoding:NSUTF8StringEncoding];
	
	NSUInteger dataLength = [thedata length];
	
	//See the doc: For block ciphers, the output size will always be less than or 
	//equal to the input size plus the size of one block.
	//That's why we need to add the size of one block here
	size_t bufferSize = dataLength + kCCBlockSizeAES128;
	void *buffer = malloc(bufferSize);
	if (buffer == NULL) {
		return nil;
	}
	size_t numBytesEncrypted = 0;
	CCCryptorStatus cryptStatus = CCCrypt(kCCEncrypt, kCCAlgorithmAES128, kCCOptionPKCS7Padding,
										  keyPtr, kCCKeySizeAES128,
										  NULL /* initialization vector (optional) */,
										  [thedata bytes], dataLength, /* input */
										  buffer, bufferSize, /* output */
										  &numBytesEncrypted);
	if (cryptStatus == kCCSuccess) {
		//the returned NSData takes ownership of the buffer and will free it on deallocation
		return [NSData dataWithBytesNoCopy:buffer length:numBytesEncrypted];
	}
	
	free(buffer); //free the buffer;
	return nil;
}
#endif
