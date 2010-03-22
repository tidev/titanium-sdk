
#import <Foundation/Foundation.h>
#import <CommonCrypto/CommonCryptor.h>



static const char basis_64[] =
"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

int Base64encode_len(int len)
{
    return ((len + 2) / 3 * 4) + 1;
}

int Base64encode(char *encoded, const char *string, int len)
{
    int i;
    char *p;
	
    p = encoded;
    for (i = 0; i < len - 2; i += 3) {
		*p++ = basis_64[(string[i] >> 2) & 0x3F];
		*p++ = basis_64[((string[i] & 0x3) << 4) |
						((int) (string[i + 1] & 0xF0) >> 4)];
		*p++ = basis_64[((string[i + 1] & 0xF) << 2) |
						((int) (string[i + 2] & 0xC0) >> 6)];
		*p++ = basis_64[string[i + 2] & 0x3F];
    }
    if (i < len) {
		*p++ = basis_64[(string[i] >> 2) & 0x3F];
		if (i == (len - 1)) {
			*p++ = basis_64[((string[i] & 0x3) << 4)];
			*p++ = '=';
		}
		else {
			*p++ = basis_64[((string[i] & 0x3) << 4) |
							((int) (string[i + 1] & 0xF0) >> 4)];
			*p++ = basis_64[((string[i + 1] & 0xF) << 2)];
		}
		*p++ = '=';
    }
	
    *p++ = '\0';
    return p - encoded;
}

NSString * hexString (NSData * thedata)
{
	int i;
	const char * data = [thedata bytes];
	NSMutableString *result;
	NSString *immutableResult;
	
	// Iterate through NSData's buffer, converting every byte into hex
	// and appending the result to a string.
	result = [[NSMutableString alloc] init];
	for (i = 0; i < [thedata length]; i++) {
		[result appendFormat:@"%02x", data[i] & 0xff];
	}
	
	immutableResult = [NSString stringWithString:result];
	[result release];
	return immutableResult;
}

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

NSData * encode64 (NSData * thedata)
{
	const char *str = (const char*)[thedata bytes];
	int encodedLength = Base64encode_len([thedata length]);
	char* encoded = (char*)malloc(sizeof(char) * encodedLength);
	Base64encode(encoded,str,[thedata length]);
	NSString *s = [NSString stringWithUTF8String:encoded];
	return [s dataUsingEncoding:NSUTF8StringEncoding];
}

int main (int argc, const char * argv[]) 
{
    NSAutoreleasePool * pool = [[NSAutoreleasePool alloc] init];
	int rc = 0;
	
	if (argc!=3)
	{
		NSString *path = [NSString stringWithCString:argv[0] encoding:NSUTF8StringEncoding];
		fprintf(stderr,"Usage: %s <file> <key>\n",[[path lastPathComponent] UTF8String]);
		rc = 1;
	}
	else
	{
		NSData *content = [NSData dataWithContentsOfFile:[NSString stringWithCString:argv[1] encoding:NSUTF8StringEncoding]];
		NSData *base64 = encode64(content);
		NSData *encrypt = AES128EncryptWithKey(base64,[NSString stringWithCString:argv[2] encoding:NSUTF8StringEncoding]);
		NSString *hex = hexString(encrypt);
		fprintf(stdout,"%s\n",[hex UTF8String]);
	}
	
    [pool drain];
    return rc;
}
