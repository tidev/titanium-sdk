/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "TiDOMValidator.h"
#import "TiUtils.h"

@implementation TiDOMValidator

static NSMutableCharacterSet *letterCharacterSet = nil;
static NSMutableCharacterSet *digitCharacterSet = nil;
static NSMutableCharacterSet *extenderCharacterSet = nil;
static NSMutableCharacterSet *combiningCharacterSet = nil;

+(BOOL)isLetter:(unichar)c
{
	if (letterCharacterSet == nil) {
		letterCharacterSet = [[NSMutableCharacterSet alloc]init];
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0041,26)];	//[0x0041-0x005A]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0061,26)];	//[0x0061-0x007A]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x00C0,23)];	//[0x00C0-0x00D6]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x00D8,31)];	//[0x00D8-0x00F6]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x00F8,8)];	//[0x00F8-0x00FF]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0100,50)];	//[0x0100-0x0131]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0134,11)];	//[0x0134-0x013E]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0141,8)];	//[0x0141-0x0148]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x014A,53)];	//[0x014A-0x017E]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0180,68)];	//[0x0180-0x01C3]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x01CD,36)];	//[0x01CD-0x01F0]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x01F4,2)];	//[0x01F4-0x01F5]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x01FA,30)];	//[0x01FA-0x0217]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0250,89)];	//[0x0250-0x02A8]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x02BB,7)];	//[0x02BB-0x02C1]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0386,1)];	//[0x0386]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0388,3)];	//[0x0388-0x038A]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x038C,1)];	//[0x038C]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x038E,20)];	//[0x038E-0x03A1]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x03A3,44)];	//[0x03A3-0x03CE]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x03D0,7)];	//[0x03D0-0x03D6]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x03DA,1)];	//[0x03DA]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x03DC,1)];	//[0x03DC]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x03DE,1)];	//[0x03DE]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x03E0,1)];	//[0x03E0]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x03E2,18)];	//[0x03E2-0x03F3]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0401,12)];	//[0x0401-0x040C]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x040E,66)];	//[0x040E-0x044F]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0451,12)];	//[0x0451-0x045C]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x045E,36)];	//[0x045E-0x0481]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0490,53)];	//[0x0490-0x04C4]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x04C7,2)];	//[0x04C7-0x04C8]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x04CB,2)];	//[0x04CB-0x04CC]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x04D0,28)];	//[0x04D0-0x04EB]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x04EE,8)];	//[0x04EE-0x04F5]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x04F8,2)];	//[0x04F8-0x04F9]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0531,38)];	//[0x0531-0x0556]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0559,1)];	//[0x0559]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0561,38)];	//[0x0561-0x0586]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x05D0,27)];	//[0x05D0-0x05EA]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x05F0,3)];	//[0x05F0-0x05F2]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0621,26)];	//[0x0621-0x063A]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0641,10)];	//[0x0641-0x064A]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0671,71)];	//[0x0671-0x06B7]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x06BA,5)];	//[0x06BA-0x06BE]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x06C0,15)];	//[0x06C0-0x06CE]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x06D0,4)];	//[0x06D0-0x06D3]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x06D5,1)];	//[0x06D5]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x06E5,2)];	//[0x06E5-0x06E6]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0905,53)];	//[0x0905-0x0939]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x093D,1)];	//[0x093D]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0958,10)];	//[0x0958-0x0961]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0985,8)];	//[0x0985-0x098C]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x098F,2)];	//[0x098F-0x0990]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0993,22)];	//[0x0993-0x09A8]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x09AA,7)];	//[0x09AA-0x09B0]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x09B2,1)];	//[0x09B2]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x09B6,4)];	//[0x09B6-0x09B9]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x09DC,2)];	//[0x09DC-0x09DD]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x09DF,3)];	//[0x09DF-0x09E1]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x09F0,2)];	//[0x09F0-0x09F1]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0A05,6)];	//[0x0A05-0x0A0A]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0A0F,2)];	//[0x0A0F-0x0A10]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0A13,22)];	//[0x0A13-0x0A28]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0A2A,7)];	//[0x0A2A-0x0A30]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0A32,2)];	//[0x0A32-0x0A33]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0A35,2)];	//[0x0A35-0x0A36]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0A38,2)];	//[0x0A38-0x0A39]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0A59,4)];	//[0x0A59-0x0A5C]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0A5E,1)];	//[0x0A5E]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0A72,3)];	//[0x0A72-0x0A74]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0A85,7)];	//[0x0A85-0x0A8B]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0A8D,1)];	//[0x0A8D]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0A8F,3)];	//[0x0A8F-0x0A91]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0A93,22)];	//[0x0A93-0x0AA8]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0AAA,7)];	//[0x0AAA-0x0AB0]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0AB2,2)];	//[0x0AB2-0x0AB3]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0AB5,5)];	//[0x0AB5-0x0AB9]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0ABD,1)];	//[0x0ABD]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0AE0,1)];	//[0x0AE0]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0B05,8)];	//[0x0B05-0x0B0C]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0B0F,2)];	//[0x0B0F-0x0B10]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0B13,22)];	//[0x0B13-0x0B28]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0B2A,7)];	//[0x0B2A-0x0B30]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0B32,2)];	//[0x0B32-0x0B33]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0B36,4)];	//[0x0B36-0x0B39]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0B3D,1)];	//[0x0B3D]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0B5C,2)];	//[0x0B5C-0x0B5D]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0B5F,3)];	//[0x0B5F-0x0B61]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0B85,6)];	//[0x0B85-0x0B8A]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0B8E,3)];	//[0x0B8E-0x0B90]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0B92,4)];	//[0x0B92-0x0B95]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0B99,2)];	//[0x0B99-0x0B9A]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0B9C,1)];	//[0x0B9C]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0B9E,2)];	//[0x0B9E-0x0B9F]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0BA3,2)];	//[0x0BA3-0x0BA4]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0BA8,3)];	//[0x0BA8-0x0BAA]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0BAE,8)];	//[0x0BAE-0x0BB5]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0BB7,3)];	//[0x0BB7-0x0BB9]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0C05,8)];	//[0x0C05-0x0C0C]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0C0E,3)];	//[0x0C0E-0x0C10]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0C12,23)];	//[0x0C12-0x0C28]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0C2A,10)];	//[0x0C2A-0x0C33]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0C35,5)];	//[0x0C35-0x0C39]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0C60,2)];	//[0x0C60-0x0C61]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0C85,8)];	//[0x0C85-0x0C8C]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0C8E,3)];	//[0x0C8E-0x0C90]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0C92,23)];	//[0x0C92-0x0CA8]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0CAA,10)];	//[0x0CAA-0x0CB3]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0CB5,5)];	//[0x0CB5-0x0CB9]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0CDE,1)];	//[0x0CDE]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0CE0,2)];	//[0x0CE0-0x0CE1]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0D05,8)];	//[0x0D05-0x0D0C]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0D0E,3)];	//[0x0D0E-0x0D10]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0D12,23)];	//[0x0D12-0x0D28]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0D2A,16)];	//[0x0D2A-0x0D39]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0D60,2)];	//[0x0D60-0x0D61]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0E01,46)];	//[0x0E01-0x0E2E]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0E30,1)];	//[0x0E30]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0E32,2)];	//[0x0E32-0x0E33]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0E40,6)];	//[0x0E40-0x0E45]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0E81,2)];	//[0x0E81-0x0E82]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0E84,1)];	//[0x0E84]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0E87,2)];	//[0x0E87-0x0E88]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0E8A,1)];	//[0x0E8A]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0E8D,1)];	//[0x0E8D]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0E94,4)];	//[0x0E94-0x0E97]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0E99,7)];	//[0x0E99-0x0E9F]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0EA1,3)];	//[0x0EA1-0x0EA3]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0EA5,1)];	//[0x0EA5]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0EA7,1)];	//[0x0EA7]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0EAA,2)];	//[0x0EAA-0x0EAB]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0EAD,2)];	//[0x0EAD-0x0EAE]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0EB0,1)];	//[0x0EB0]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0EB2,2)];	//[0x0EB2-0x0EB3]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0EBD,1)];	//[0x0EBD]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0EC0,5)];	//[0x0EC0-0x0EC4]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0F40,8)];	//[0x0F40-0x0F47]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x0F49,33)];	//[0x0F49-0x0F69]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x10A0,38)];	//[0x10A0-0x10C5]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x10D0,39)];	//[0x10D0-0x10F6]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1100,1)];	//[0x1100]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1102,2)];	//[0x1102-0x1103]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1105,3)];	//[0x1105-0x1107]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1109,1)];	//[0x1109]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x110B,2)];	//[0x110B-0x110C]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x110E,5)];	//[0x110E-0x1112]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x113C,1)];	//[0x113C]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x113E,1)];	//[0x113E]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1140,1)];	//[0x1140]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x114C,1)];	//[0x114C]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x114E,1)];	//[0x114E]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1150,1)];	//[0x1150]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1154,2)];	//[0x1154-0x1155]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1159,1)];	//[0x1159]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x115F,3)];	//[0x115F-0x1161]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1163,1)];	//[0x1163]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1165,1)];	//[0x1165]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1167,1)];	//[0x1167]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1169,1)];	//[0x1169]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x116D,2)];	//[0x116D-0x116E]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1172,2)];	//[0x1172-0x1173]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1175,1)];	//[0x1175]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x119E,1)];	//[0x119E]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x11A8,1)];	//[0x11A8]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x11AB,1)];	//[0x11AB]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x11AE,2)];	//[0x11AE-0x11AF]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x11B7,2)];	//[0x11B7-0x11B8]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x11BA,1)];	//[0x11BA]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x11BC,7)];	//[0x11BC-0x11C2]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x11EB,1)];	//[0x11EB]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x11F0,1)];	//[0x11F0]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x11F9,1)];	//[0x11F9]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1E00,156)];	//[0x1E00-0x1E9B]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1EA0,90)];	//[0x1EA0-0x1EF9]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1F00,22)];	//[0x1F00-0x1F15]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1F18,6)];	//[0x1F18-0x1F1D]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1F20,38)];	//[0x1F20-0x1F45]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1F48,6)];	//[0x1F48-0x1F4D]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1F50,8)];	//[0x1F50-0x1F57]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1F59,1)];	//[0x1F59]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1F5B,1)];	//[0x1F5B]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1F5D,1)];	//[0x1F5D]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1F5F,31)];	//[0x1F5F-0x1F7D]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1F80,53)];	//[0x1F80-0x1FB4]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1FB6,7)];	//[0x1FB6-0x1FBC]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1FBE,1)];	//[0x1FBE]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1FC2,3)];	//[0x1FC2-0x1FC4]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1FC6,7)];	//[0x1FC6-0x1FCC]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1FD0,4)];	//[0x1FD0-0x1FD3]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1FD6,6)];	//[0x1FD6-0x1FDB]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1FE0,13)];	//[0x1FE0-0x1FEC]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1FF2,3)];	//[0x1FF2-0x1FF4]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x1FF6,7)];	//[0x1FF6-0x1FFC]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x2126,1)];	//[0x2126]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x212A,2)];	//[0x212A-0x212B]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x212E,1)];	//[0x212E]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x2180,3)];	//[0x2180-0x2182]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x3041,84)];	//[0x3041-0x3094]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x30A1,90)];	//[0x30A1-0x30FA]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x3105,40)];	//[0x3105-0x312C]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0xAC00,11172)];	//[0xAC00-0xD7A3]
		
		//Ideographic
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x4E00,20902)];	//[0x4E00-0x9FA5]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x3007,1)];	//[0x3007]
		[letterCharacterSet addCharactersInRange:NSMakeRange(0x3021,9)];	//[0x3021-0x3029]
		
	}
	return [letterCharacterSet characterIsMember:c];
}

+(BOOL)isXMLDigit:(unichar)c
{
	if (digitCharacterSet == nil) {
		digitCharacterSet = [[NSMutableCharacterSet alloc]init];
		[digitCharacterSet addCharactersInRange:NSMakeRange(0x0030,10)];	//[0x0030-0x0039]
		[digitCharacterSet addCharactersInRange:NSMakeRange(0x0660,10)];	//[0x0660-0x0669]
		[digitCharacterSet addCharactersInRange:NSMakeRange(0x06F0,10)];	//[0x06F0-0x06F9]
		[digitCharacterSet addCharactersInRange:NSMakeRange(0x0966,10)];	//[0x0966-0x096F]
		[digitCharacterSet addCharactersInRange:NSMakeRange(0x09E6,10)];	//[0x09E6-0x09EF]
		[digitCharacterSet addCharactersInRange:NSMakeRange(0x0A66,10)];	//[0x0A66-0x0A6F]
		[digitCharacterSet addCharactersInRange:NSMakeRange(0x0AE6,10)];	//[0x0AE6-0x0AEF]
		[digitCharacterSet addCharactersInRange:NSMakeRange(0x0B66,10)];	//[0x0B66-0x0B6F]
		[digitCharacterSet addCharactersInRange:NSMakeRange(0x0BE7,9)];		//[0x0BE7-0x0BEF]
		[digitCharacterSet addCharactersInRange:NSMakeRange(0x0C66,10)];	//[0x0C66-0x0C6F]
		[digitCharacterSet addCharactersInRange:NSMakeRange(0x0CE6,10)];	//[0x0CE6-0x0CEF]
		[digitCharacterSet addCharactersInRange:NSMakeRange(0x0D66,10)];	//[0x0D66-0x0D6F]
		[digitCharacterSet addCharactersInRange:NSMakeRange(0x0E50,10)];	//[0x0E50-0x0E59]
		[digitCharacterSet addCharactersInRange:NSMakeRange(0x0ED0,10)];	//[0x0ED0-0x0ED9]
		[digitCharacterSet addCharactersInRange:NSMakeRange(0x0F20,10)];	//[0x0F20-0x0F29]	
	}
	return [digitCharacterSet characterIsMember:c];
}

+(BOOL)isXMLExtender:(unichar)c
{
	if (extenderCharacterSet == nil) {
		extenderCharacterSet = [[NSMutableCharacterSet alloc]init];
		[extenderCharacterSet addCharactersInRange:NSMakeRange(0x00B7,1)];	//[0x00B7]
		[extenderCharacterSet addCharactersInRange:NSMakeRange(0x02D0,1)];	//[0x02D0]
		[extenderCharacterSet addCharactersInRange:NSMakeRange(0x02D1,1)];	//[0x02D1]
		[extenderCharacterSet addCharactersInRange:NSMakeRange(0x0387,1)];	//[0x0387]
		[extenderCharacterSet addCharactersInRange:NSMakeRange(0x0640,1)];	//[0x0640]
		[extenderCharacterSet addCharactersInRange:NSMakeRange(0x0E46,1)];	//[0x0E46]
		[extenderCharacterSet addCharactersInRange:NSMakeRange(0x0EC6,1)];	//[0x0EC6]
		[extenderCharacterSet addCharactersInRange:NSMakeRange(0x3005,1)];	//[0x3005]
		[extenderCharacterSet addCharactersInRange:NSMakeRange(0x3031,5)];	//[0x3031-0x3035]
		[extenderCharacterSet addCharactersInRange:NSMakeRange(0x309D,2)];	//[0x309D-0x309E]
		[extenderCharacterSet addCharactersInRange:NSMakeRange(0x30FC,3)];	//[0x30FC-0x30FE]
	}
	return [extenderCharacterSet characterIsMember:c];

}

+(BOOL)isXMLCombiningChar:(unichar)c
{
	if (combiningCharacterSet == nil) {
		combiningCharacterSet = [[NSMutableCharacterSet alloc]init];
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0300,70)];	//[0x0300-0x0345]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0360,2)];	//[0x0360-0x0361]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0483,4)];	//[0x0483-0x0486]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0591,17)];	//[0x0591-0x05A1]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x05A3,23)];	//[0x05A3-0x05B9]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x05BB,3)];	//[0x05BB-0x05BD]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x05BF,1)];	//[0x05BF]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x05C1,2)];	//[0x05C1-0x05C2]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x05C4,1)];	//[0x05C4]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x064B,8)];	//[0x064B-0x0652]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0670,1)];	//[0x0670]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x06D6,7)];	//[0x06D6-0x06DC]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x06DD,3)];	//[0x06DD-0x06DF]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x06E0,5)];	//[0x06E0-0x06E4]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x06E7,2)];	//[0x06E7-0x06E8]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x06EA,4)];	//[0x06EA-0x06ED]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0901,3)];	//[0x0901-0x0903]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x093C,1)];	//[0x093C]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x093E,15)];	//[0x093E-0x094C]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x094D,1)];	//[0x094D]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0951,4)];	//[0x0951-0x0954]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0962,2)];	//[0x0962-0x0963]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0981,3)];	//[0x0981-0x0983]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x09BC,1)];	//[0x09BC]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x09BE,1)];	//[0x09BE]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x09BF,1)];	//[0x09BF]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x09C0,5)];	//[0x09C0-0x09C4]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x09C7,2)];	//[0x09C7-0x09C8]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x09CB,3)];	//[0x09CB-0x09CD]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x09D7,1)];	//[0x09D7]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x09E2,2)];	//[0x09E2-0x09E3]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0A02,1)];	//[0x0A02]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0A3C,1)];	//[0x0A3C]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0A3E,1)];	//[0x0A3E]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0A3F,1)];	//[0x0A3F]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0A40,3)];	//[0x0A40-0x0A42]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0A47,2)];	//[0x0A47-0x0A48]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0A4B,3)];	//[0x0A4B-0x0A4D]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0A70,2)];	//[0x0A70-0x0A71]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0A81,3)];	//[0x0A81-0x0A83]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0ABC,1)];	//[0x0ABC]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0ABE,8)];	//[0x0ABE-0x0AC5]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0AC7,3)];	//[0x0AC7-0x0AC9]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0ACB,3)];	//[0x0ACB-0x0ACD]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0B01,3)];	//[0x0B01-0x0B03]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0B3C,1)];	//[0x0B3C]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0B3E,6)];	//[0x0B3E-0x0B43]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0B47,2)];	//[0x0B47-0x0B48]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0B4B,3)];	//[0x0B4B-0x0B4D]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0B56,2)];	//[0x0B56-0x0B57]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0B82,2)];	//[0x0B82-0x0B83]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0BBE,5)];	//[0x0BBE-0x0BC2]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0BC6,3)];	//[0x0BC6-0x0BC8]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0BCA,4)];	//[0x0BCA-0x0BCD]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0BD7,1)];	//[0x0BD7]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0C01,3)];	//[0x0C01-0x0C03]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0C3E,7)];	//[0x0C3E-0x0C44]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0C46,3)];	//[0x0C46-0x0C48]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0C4A,4)];	//[0x0C4A-0x0C4D]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0C55,2)];	//[0x0C55-0x0C56]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0C82,2)];	//[0x0C82-0x0C83]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0CBE,7)];	//[0x0CBE-0x0CC4]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0CC6,3)];	//[0x0CC6-0x0CC8]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0CCA,4)];	//[0x0CCA-0x0CCD]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0CD5,2)];	//[0x0CD5-0x0CD6]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0D02,2)];	//[0x0D02-0x0D03]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0D3E,6)];	//[0x0D3E-0x0D43]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0D46,3)];	//[0x0D46-0x0D48]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0D4A,4)];	//[0x0D4A-0x0D4D]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0D57,1)];	//[0x0D57]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0E31,1)];	//[0x0E31]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0E34,7)];	//[0x0E34-0x0E3A]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0E47,8)];	//[0x0E47-0x0E4E]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0EB1,1)];	//[0x0EB1]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0EB4,6)];	//[0x0EB4-0x0EB9]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0EBB,2)];	//[0x0EBB-0x0EBC]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0EC8,6)];	//[0x0EC8-0x0ECD]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0F18,2)];	//[0x0F18-0x0F19]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0F35,1)];	//[0x0F35]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0F37,1)];	//[0x0F37]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0F39,1)];	//[0x0F39]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0F3E,1)];	//[0x0F3E]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0F3F,1)];	//[0x0F3F]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0F71,20)];	//[0x0F71-0x0F84]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0F86,6)];	//[0x0F86-0x0F8B]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0F90,6)];	//[0x0F90-0x0F95]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0F97,1)];	//[0x0F97]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0F99,21)];	//[0x0F99-0x0FAD]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0FB1,7)];	//[0x0FB1-0x0FB7]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x0FB9,1)];	//[0x0FB9]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x20D0,13)];	//[0x20D0-0x20DC]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x20E1,1)];	//[0x20E1]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x302A,6)];	//[0x302A-0x302F]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x3099,1)];	//[0x3099]
		[combiningCharacterSet addCharactersInRange:NSMakeRange(0x309A,1)];	//[0x309A]

	}
	return [combiningCharacterSet characterIsMember:c];

}

+(BOOL)isXMLNameStartCharacter:(unichar)c
{
	return ( ([self isLetter:c]) || (c == '_') || (c ==':') );
}

+(BOOL)isXMLNameCharacter:(unichar)c
{
	return ( ([self isLetter:c]) || ([self isXMLDigit:c]) || c == '.' || c == '-'
			|| c == '_' || c == ':' || ([self isXMLCombiningChar:c]) 
			|| ([self isXMLExtender:c]));
}

+(BOOL)checkXMLName:(NSString*)pName
{
	if ( (pName == nil) || ([pName length] == 0) )
	{
		return NO;
	}
	
	unichar c = [pName characterAtIndex:0];
	if (![self isXMLNameStartCharacter:c])
		return NO;
	int i = 0;
	for (i=1; i < [pName length]; i++) {
		c = [pName characterAtIndex:0];
		if (![self isXMLNameCharacter:c])
			return NO;
	}
	return YES;
}
+(BOOL)isURICharacter:(unichar)c
{
	if (c >= 'a' && c <= 'z') return YES;
	if (c >= 'A' && c <= 'Z') return YES;
	if (c >= '0' && c <= '9') return YES;
	if (c == '/') return YES;
	if (c == '-') return YES;
	if (c == '.') return YES;
	if (c == '?') return YES;
	if (c == ':') return YES;
	if (c == '@') return YES;
	if (c == '&') return YES;
	if (c == '=') return YES;
	if (c == '+') return YES;
	if (c == '$') return YES;
	if (c == ',') return YES;
	if (c == '%') return YES;
	
	if (c == '_') return YES;
	if (c == '!') return YES;
	if (c == '~') return YES;
	if (c == '*') return YES;
	if (c == '\'') return YES;
	if (c == '(') return YES;
	if (c == ')') return YES;
	return NO;
}

+(BOOL)isHexDigit:(unichar)c
{
	if (c >= '0' && c <= '9') return YES;
	if (c >= 'A' && c <= 'F') return YES;
	if (c >= 'a' && c <= 'f') return YES;
	
	return NO;
}

+(BOOL)checkIsValidURI:(NSString*)pName
{
	int strLen = [pName length];
	int i = 0;
	for (i = 0; i < strLen; i++) {
		unichar c = [pName characterAtIndex:i];
		
		if (![self isURICharacter:c]) {
			return NO;
		}
		
		if (c == '%') {// must be followed by two hexadecimal digits
			if ( (strLen - i) > 2) {
				unichar c1 = [pName characterAtIndex:(i+1)];
				unichar c2 = [pName characterAtIndex:(i+2)];
				
				if ( (![self isHexDigit:c1]) || (![self isHexDigit:c2]) ){
					return NO;
				}
			}
			else {
				//Insufficient characters for two hexadecimal digits
				return NO;
			}
		}
	}
	return YES;
}

+(BOOL)checkElementName:(NSString*)pName
{
	if ([self checkXMLName:pName]) {
		NSRange range = [pName rangeOfString:@":"];
		if (range.location == NSNotFound) {
			return YES;
		}
	}
	return NO;
}

+(BOOL)checkAttributeName:(NSString*)pName
{
	if ([self checkElementName:pName]) {
		if ([[pName lowercaseString] compare:@"xmlns"] != 0) {
			return YES;
		}
	}
	return NO;
}

+(BOOL)checkNamespacePrefix:(NSString*)pName
{
	if ((pName == nil) || ([pName length]==0)) {
		return YES;
	}
	
	// Cannot start with a number
	unichar c = [pName characterAtIndex:0];
	if ([self isXMLDigit:c]) {
		return NO;
	}
	
	// Cannot start with these 3 characters
	if (c == '.' || c == '-' || c == '$') {
		return NO;
	}
	
	// Cannot start with "xml" in any character case
	if ([[pName lowercaseString] hasPrefix:@"xml"]) {
		return NO;
	}

	// Ensure legal content
	int i = 0;
	for (i=0; i < [pName length]; i++) {
		c = [pName characterAtIndex:0];
		if (![self isXMLNameCharacter:c])
			return NO;
	}

	// No colons allowed
	NSRange range = [pName rangeOfString:@":"];
	if (range.location != NSNotFound) {
		return NO;
	}

	// If we got here, everything is OK
	return YES;
}

+(BOOL)checkNamespaceURI:(NSString*)pName
{
	// Manually do rules, since URIs can be null or empty
	if ((pName == nil) || ([pName length]==0)) {
		return YES;
	}
	
	// Cannot start with a number
	unichar c = [pName characterAtIndex:0];
	if ([self isXMLDigit:c]) {
		return NO;
	}
	
	//Can not start with these two characters
	if (c == '-' || c == '$') {
		return NO;
	}
	
	// If we got here, everything is OK
	return [self checkIsValidURI:pName];
}

@end
#endif