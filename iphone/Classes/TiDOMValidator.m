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

+(BOOL)isLetter:(unichar)c
{
	if (c < 0x0041) return NO;  if (c <= 0x005a) return YES;
	if (c < 0x0061) return NO;  if (c <= 0x007A) return YES;
	if (c < 0x00C0) return NO;  if (c <= 0x00D6) return YES;
	if (c < 0x00D8) return NO;  if (c <= 0x00F6) return YES;
	if (c < 0x00F8) return NO;  if (c <= 0x00FF) return YES;
	if (c < 0x0100) return NO;  if (c <= 0x0131) return YES;
	if (c < 0x0134) return NO;  if (c <= 0x013E) return YES;
	if (c < 0x0141) return NO;  if (c <= 0x0148) return YES;
	if (c < 0x014A) return NO;  if (c <= 0x017E) return YES;
	if (c < 0x0180) return NO;  if (c <= 0x01C3) return YES;
	if (c < 0x01CD) return NO;  if (c <= 0x01F0) return YES;
	if (c < 0x01F4) return NO;  if (c <= 0x01F5) return YES;
	if (c < 0x01FA) return NO;  if (c <= 0x0217) return YES;
	if (c < 0x0250) return NO;  if (c <= 0x02A8) return YES;
	if (c < 0x02BB) return NO;  if (c <= 0x02C1) return YES;
	if (c == 0x0386) return YES;
	if (c < 0x0388) return NO;  if (c <= 0x038A) return YES;
	if (c == 0x038C) return YES;
	if (c < 0x038E) return NO;  if (c <= 0x03A1) return YES;
	if (c < 0x03A3) return NO;  if (c <= 0x03CE) return YES;
	if (c < 0x03D0) return NO;  if (c <= 0x03D6) return YES;
	if (c == 0x03DA) return YES;
	if (c == 0x03DC) return YES;
	if (c == 0x03DE) return YES;
	if (c == 0x03E0) return YES;
	if (c < 0x03E2) return NO;  if (c <= 0x03F3) return YES;
	if (c < 0x0401) return NO;  if (c <= 0x040C) return YES;
	if (c < 0x040E) return NO;  if (c <= 0x044F) return YES;
	if (c < 0x0451) return NO;  if (c <= 0x045C) return YES;
	if (c < 0x045E) return NO;  if (c <= 0x0481) return YES;
	if (c < 0x0490) return NO;  if (c <= 0x04C4) return YES;
	if (c < 0x04C7) return NO;  if (c <= 0x04C8) return YES;
	if (c < 0x04CB) return NO;  if (c <= 0x04CC) return YES;
	if (c < 0x04D0) return NO;  if (c <= 0x04EB) return YES;
	if (c < 0x04EE) return NO;  if (c <= 0x04F5) return YES;
	if (c < 0x04F8) return NO;  if (c <= 0x04F9) return YES;
	if (c < 0x0531) return NO;  if (c <= 0x0556) return YES;
	if (c == 0x0559) return YES;
	if (c < 0x0561) return NO;  if (c <= 0x0586) return YES;
	if (c < 0x05D0) return NO;  if (c <= 0x05EA) return YES;
	if (c < 0x05F0) return NO;  if (c <= 0x05F2) return YES;
	if (c < 0x0621) return NO;  if (c <= 0x063A) return YES;
	if (c < 0x0641) return NO;  if (c <= 0x064A) return YES;
	if (c < 0x0671) return NO;  if (c <= 0x06B7) return YES;
	if (c < 0x06BA) return NO;  if (c <= 0x06BE) return YES;
	if (c < 0x06C0) return NO;  if (c <= 0x06CE) return YES;
	if (c < 0x06D0) return NO;  if (c <= 0x06D3) return YES;
	if (c == 0x06D5) return YES;
	if (c < 0x06E5) return NO;  if (c <= 0x06E6) return YES;
	if (c < 0x0905) return NO;  if (c <= 0x0939) return YES;
	if (c == 0x093D) return YES;
	if (c < 0x0958) return NO;  if (c <= 0x0961) return YES;
	if (c < 0x0985) return NO;  if (c <= 0x098C) return YES;
	if (c < 0x098F) return NO;  if (c <= 0x0990) return YES;
	if (c < 0x0993) return NO;  if (c <= 0x09A8) return YES;
	if (c < 0x09AA) return NO;  if (c <= 0x09B0) return YES;
	if (c == 0x09B2) return YES;
	if (c < 0x09B6) return NO;  if (c <= 0x09B9) return YES;
	if (c < 0x09DC) return NO;  if (c <= 0x09DD) return YES;
	if (c < 0x09DF) return NO;  if (c <= 0x09E1) return YES;
	if (c < 0x09F0) return NO;  if (c <= 0x09F1) return YES;
	if (c < 0x0A05) return NO;  if (c <= 0x0A0A) return YES;
	if (c < 0x0A0F) return NO;  if (c <= 0x0A10) return YES;
	if (c < 0x0A13) return NO;  if (c <= 0x0A28) return YES;
	if (c < 0x0A2A) return NO;  if (c <= 0x0A30) return YES;
	if (c < 0x0A32) return NO;  if (c <= 0x0A33) return YES;
	if (c < 0x0A35) return NO;  if (c <= 0x0A36) return YES;
	if (c < 0x0A38) return NO;  if (c <= 0x0A39) return YES;
	if (c < 0x0A59) return NO;  if (c <= 0x0A5C) return YES;
	if (c == 0x0A5E) return YES;
	if (c < 0x0A72) return NO;  if (c <= 0x0A74) return YES;
	if (c < 0x0A85) return NO;  if (c <= 0x0A8B) return YES;
	if (c == 0x0A8D) return YES;
	if (c < 0x0A8F) return NO;  if (c <= 0x0A91) return YES;
	if (c < 0x0A93) return NO;  if (c <= 0x0AA8) return YES;
	if (c < 0x0AAA) return NO;  if (c <= 0x0AB0) return YES;
	if (c < 0x0AB2) return NO;  if (c <= 0x0AB3) return YES;
	if (c < 0x0AB5) return NO;  if (c <= 0x0AB9) return YES;
	if (c == 0x0ABD) return YES;
	if (c == 0x0AE0) return YES;
	if (c < 0x0B05) return NO;  if (c <= 0x0B0C) return YES;
	if (c < 0x0B0F) return NO;  if (c <= 0x0B10) return YES;
	if (c < 0x0B13) return NO;  if (c <= 0x0B28) return YES;
	if (c < 0x0B2A) return NO;  if (c <= 0x0B30) return YES;
	if (c < 0x0B32) return NO;  if (c <= 0x0B33) return YES;
	if (c < 0x0B36) return NO;  if (c <= 0x0B39) return YES;
	if (c == 0x0B3D) return YES;
	if (c < 0x0B5C) return NO;  if (c <= 0x0B5D) return YES;
	if (c < 0x0B5F) return NO;  if (c <= 0x0B61) return YES;
	if (c < 0x0B85) return NO;  if (c <= 0x0B8A) return YES;
	if (c < 0x0B8E) return NO;  if (c <= 0x0B90) return YES;
	if (c < 0x0B92) return NO;  if (c <= 0x0B95) return YES;
	if (c < 0x0B99) return NO;  if (c <= 0x0B9A) return YES;
	if (c == 0x0B9C) return YES;
	if (c < 0x0B9E) return NO;  if (c <= 0x0B9F) return YES;
	if (c < 0x0BA3) return NO;  if (c <= 0x0BA4) return YES;
	if (c < 0x0BA8) return NO;  if (c <= 0x0BAA) return YES;
	if (c < 0x0BAE) return NO;  if (c <= 0x0BB5) return YES;
	if (c < 0x0BB7) return NO;  if (c <= 0x0BB9) return YES;
	if (c < 0x0C05) return NO;  if (c <= 0x0C0C) return YES;
	if (c < 0x0C0E) return NO;  if (c <= 0x0C10) return YES;
	if (c < 0x0C12) return NO;  if (c <= 0x0C28) return YES;
	if (c < 0x0C2A) return NO;  if (c <= 0x0C33) return YES;
	if (c < 0x0C35) return NO;  if (c <= 0x0C39) return YES;
	if (c < 0x0C60) return NO;  if (c <= 0x0C61) return YES;
	if (c < 0x0C85) return NO;  if (c <= 0x0C8C) return YES;
	if (c < 0x0C8E) return NO;  if (c <= 0x0C90) return YES;
	if (c < 0x0C92) return NO;  if (c <= 0x0CA8) return YES;
	if (c < 0x0CAA) return NO;  if (c <= 0x0CB3) return YES;
	if (c < 0x0CB5) return NO;  if (c <= 0x0CB9) return YES;
	if (c == 0x0CDE) return YES;
	if (c < 0x0CE0) return NO;  if (c <= 0x0CE1) return YES;
	if (c < 0x0D05) return NO;  if (c <= 0x0D0C) return YES;
	if (c < 0x0D0E) return NO;  if (c <= 0x0D10) return YES;
	if (c < 0x0D12) return NO;  if (c <= 0x0D28) return YES;
	if (c < 0x0D2A) return NO;  if (c <= 0x0D39) return YES;
	if (c < 0x0D60) return NO;  if (c <= 0x0D61) return YES;
	if (c < 0x0E01) return NO;  if (c <= 0x0E2E) return YES;
	if (c == 0x0E30) return YES;
	if (c < 0x0E32) return NO;  if (c <= 0x0E33) return YES;
	if (c < 0x0E40) return NO;  if (c <= 0x0E45) return YES;
	if (c < 0x0E81) return NO;  if (c <= 0x0E82) return YES;
	if (c == 0x0E84) return YES;
	if (c < 0x0E87) return NO;  if (c <= 0x0E88) return YES;
	if (c == 0x0E8A) return YES;
	if (c == 0x0E8D) return YES;
	if (c < 0x0E94) return NO;  if (c <= 0x0E97) return YES;
	if (c < 0x0E99) return NO;  if (c <= 0x0E9F) return YES;
	if (c < 0x0EA1) return NO;  if (c <= 0x0EA3) return YES;
	if (c == 0x0EA5) return YES;
	if (c == 0x0EA7) return YES;
	if (c < 0x0EAA) return NO;  if (c <= 0x0EAB) return YES;
	if (c < 0x0EAD) return NO;  if (c <= 0x0EAE) return YES;
	if (c == 0x0EB0) return YES;
	if (c < 0x0EB2) return NO;  if (c <= 0x0EB3) return YES;
	if (c == 0x0EBD) return YES;
	if (c < 0x0EC0) return NO;  if (c <= 0x0EC4) return YES;
	if (c < 0x0F40) return NO;  if (c <= 0x0F47) return YES;
	if (c < 0x0F49) return NO;  if (c <= 0x0F69) return YES;
	if (c < 0x10A0) return NO;  if (c <= 0x10C5) return YES;
	if (c < 0x10D0) return NO;  if (c <= 0x10F6) return YES;
	if (c == 0x1100) return YES;
	if (c < 0x1102) return NO;  if (c <= 0x1103) return YES;
	if (c < 0x1105) return NO;  if (c <= 0x1107) return YES;
	if (c == 0x1109) return YES;
	if (c < 0x110B) return NO;  if (c <= 0x110C) return YES;
	if (c < 0x110E) return NO;  if (c <= 0x1112) return YES;
	if (c == 0x113C) return YES;
	if (c == 0x113E) return YES;
	if (c == 0x1140) return YES;
	if (c == 0x114C) return YES;
	if (c == 0x114E) return YES;
	if (c == 0x1150) return YES;
	if (c < 0x1154) return NO;  if (c <= 0x1155) return YES;
	if (c == 0x1159) return YES;
	if (c < 0x115F) return NO;  if (c <= 0x1161) return YES;
	if (c == 0x1163) return YES;
	if (c == 0x1165) return YES;
	if (c == 0x1167) return YES;
	if (c == 0x1169) return YES;
	if (c < 0x116D) return NO;  if (c <= 0x116E) return YES;
	if (c < 0x1172) return NO;  if (c <= 0x1173) return YES;
	if (c == 0x1175) return YES;
	if (c == 0x119E) return YES;
	if (c == 0x11A8) return YES;
	if (c == 0x11AB) return YES;
	if (c < 0x11AE) return NO;  if (c <= 0x11AF) return YES;
	if (c < 0x11B7) return NO;  if (c <= 0x11B8) return YES;
	if (c == 0x11BA) return YES;
	if (c < 0x11BC) return NO;  if (c <= 0x11C2) return YES;
	if (c == 0x11EB) return YES;
	if (c == 0x11F0) return YES;
	if (c == 0x11F9) return YES;
	if (c < 0x1E00) return NO;  if (c <= 0x1E9B) return YES;
	if (c < 0x1EA0) return NO;  if (c <= 0x1EF9) return YES;
	if (c < 0x1F00) return NO;  if (c <= 0x1F15) return YES;
	if (c < 0x1F18) return NO;  if (c <= 0x1F1D) return YES;
	if (c < 0x1F20) return NO;  if (c <= 0x1F45) return YES;
	if (c < 0x1F48) return NO;  if (c <= 0x1F4D) return YES;
	if (c < 0x1F50) return NO;  if (c <= 0x1F57) return YES;
	if (c == 0x1F59) return YES;
	if (c == 0x1F5B) return YES;
	if (c == 0x1F5D) return YES;
	if (c < 0x1F5F) return NO;  if (c <= 0x1F7D) return YES;
	if (c < 0x1F80) return NO;  if (c <= 0x1FB4) return YES;
	if (c < 0x1FB6) return NO;  if (c <= 0x1FBC) return YES;
	if (c == 0x1FBE) return YES;
	if (c < 0x1FC2) return NO;  if (c <= 0x1FC4) return YES;
	if (c < 0x1FC6) return NO;  if (c <= 0x1FCC) return YES;
	if (c < 0x1FD0) return NO;  if (c <= 0x1FD3) return YES;
	if (c < 0x1FD6) return NO;  if (c <= 0x1FDB) return YES;
	if (c < 0x1FE0) return NO;  if (c <= 0x1FEC) return YES;
	if (c < 0x1FF2) return NO;  if (c <= 0x1FF4) return YES;
	if (c < 0x1FF6) return NO;  if (c <= 0x1FFC) return YES;
	if (c == 0x2126) return YES;
	if (c < 0x212A) return NO;  if (c <= 0x212B) return YES;
	if (c == 0x212E) return YES;
	if (c < 0x2180) return NO;  if (c <= 0x2182) return YES;
	if (c == 0x3007) return YES;                          // ideographic
	if (c < 0x3021) return NO;  if (c <= 0x3029) return YES;  // ideo
	if (c < 0x3041) return NO;  if (c <= 0x3094) return YES;
	if (c < 0x30A1) return NO;  if (c <= 0x30FA) return YES;
	if (c < 0x3105) return NO;  if (c <= 0x312C) return YES;
	if (c < 0x4E00) return NO;  if (c <= 0x9FA5) return YES;  // ideo
	if (c < 0xAC00) return NO;  if (c <= 0xD7A3) return YES;
	
	return NO;
	
}

+(BOOL)isXMLDigit:(unichar)c
{
	if (c < 0x0030) return NO;  if (c <= 0x0039) return YES;
	if (c < 0x0660) return NO;  if (c <= 0x0669) return YES;
	if (c < 0x06F0) return NO;  if (c <= 0x06F9) return YES;
	if (c < 0x0966) return NO;  if (c <= 0x096F) return YES;
	
	if (c < 0x09E6) return NO;  if (c <= 0x09EF) return YES;
	if (c < 0x0A66) return NO;  if (c <= 0x0A6F) return YES;
	if (c < 0x0AE6) return NO;  if (c <= 0x0AEF) return YES;
	
	if (c < 0x0B66) return NO;  if (c <= 0x0B6F) return YES;
	if (c < 0x0BE7) return NO;  if (c <= 0x0BEF) return YES;
	if (c < 0x0C66) return NO;  if (c <= 0x0C6F) return YES;
	
	if (c < 0x0CE6) return NO;  if (c <= 0x0CEF) return YES;
	if (c < 0x0D66) return NO;  if (c <= 0x0D6F) return YES;
	if (c < 0x0E50) return NO;  if (c <= 0x0E59) return YES;
	
	if (c < 0x0ED0) return NO;  if (c <= 0x0ED9) return YES;
	if (c < 0x0F20) return NO;  if (c <= 0x0F29) return YES;
	
	return NO;
}

+(BOOL)isXMLExtender:(unichar)c
{
	if (c < 0x00B6) return NO;  // quick short circuit
	
	// Extenders
	if (c == 0x00B7) return YES;
	if (c == 0x02D0) return YES;
	if (c == 0x02D1) return YES;
	if (c == 0x0387) return YES;
	if (c == 0x0640) return YES;
	if (c == 0x0E46) return YES;
	if (c == 0x0EC6) return YES;
	if (c == 0x3005) return YES;
	
	if (c < 0x3031) return NO;  if (c <= 0x3035) return YES;
	if (c < 0x309D) return NO;  if (c <= 0x309E) return YES;
	if (c < 0x30FC) return NO;  if (c <= 0x30FE) return YES;
	
	return NO;
}

+(BOOL)isXMLCombiningChar:(unichar)c
{
	// CombiningChar
	if (c < 0x0300) return NO;  if (c <= 0x0345) return YES;
	if (c < 0x0360) return NO;  if (c <= 0x0361) return YES;
	if (c < 0x0483) return NO;  if (c <= 0x0486) return YES;
	if (c < 0x0591) return NO;  if (c <= 0x05A1) return YES;
	
	if (c < 0x05A3) return NO;  if (c <= 0x05B9) return YES;
	if (c < 0x05BB) return NO;  if (c <= 0x05BD) return YES;
	if (c == 0x05BF) return YES;
	if (c < 0x05C1) return NO;  if (c <= 0x05C2) return YES;
	
	if (c == 0x05C4) return YES;
	if (c < 0x064B) return NO;  if (c <= 0x0652) return YES;
	if (c == 0x0670) return YES;
	if (c < 0x06D6) return NO;  if (c <= 0x06DC) return YES;
	
	if (c < 0x06DD) return NO;  if (c <= 0x06DF) return YES;
	if (c < 0x06E0) return NO;  if (c <= 0x06E4) return YES;
	if (c < 0x06E7) return NO;  if (c <= 0x06E8) return YES;
	
	if (c < 0x06EA) return NO;  if (c <= 0x06ED) return YES;
	if (c < 0x0901) return NO;  if (c <= 0x0903) return YES;
	if (c == 0x093C) return YES;
	if (c < 0x093E) return NO;  if (c <= 0x094C) return YES;
	
	if (c == 0x094D) return YES;
	if (c < 0x0951) return NO;  if (c <= 0x0954) return YES;
	if (c < 0x0962) return NO;  if (c <= 0x0963) return YES;
	if (c < 0x0981) return NO;  if (c <= 0x0983) return YES;
	
	if (c == 0x09BC) return YES;
	if (c == 0x09BE) return YES;
	if (c == 0x09BF) return YES;
	if (c < 0x09C0) return NO;  if (c <= 0x09C4) return YES;
	if (c < 0x09C7) return NO;  if (c <= 0x09C8) return YES;
	
	if (c < 0x09CB) return NO;  if (c <= 0x09CD) return YES;
	if (c == 0x09D7) return YES;
	if (c < 0x09E2) return NO;  if (c <= 0x09E3) return YES;
	if (c == 0x0A02) return YES;
	if (c == 0x0A3C) return YES;
	
	if (c == 0x0A3E) return YES;
	if (c == 0x0A3F) return YES;
	if (c < 0x0A40) return NO;  if (c <= 0x0A42) return YES;
	if (c < 0x0A47) return NO;  if (c <= 0x0A48) return YES;
	
	if (c < 0x0A4B) return NO;  if (c <= 0x0A4D) return YES;
	if (c < 0x0A70) return NO;  if (c <= 0x0A71) return YES;
	if (c < 0x0A81) return NO;  if (c <= 0x0A83) return YES;
	if (c == 0x0ABC) return YES;
	
	if (c < 0x0ABE) return NO;  if (c <= 0x0AC5) return YES;
	if (c < 0x0AC7) return NO;  if (c <= 0x0AC9) return YES;
	if (c < 0x0ACB) return NO;  if (c <= 0x0ACD) return YES;
	
	if (c < 0x0B01) return NO;  if (c <= 0x0B03) return YES;
	if (c == 0x0B3C) return YES;
	if (c < 0x0B3E) return NO;  if (c <= 0x0B43) return YES;
	if (c < 0x0B47) return NO;  if (c <= 0x0B48) return YES;
	
	if (c < 0x0B4B) return NO;  if (c <= 0x0B4D) return YES;
	if (c < 0x0B56) return NO;  if (c <= 0x0B57) return YES;
	if (c < 0x0B82) return NO;  if (c <= 0x0B83) return YES;
	
	if (c < 0x0BBE) return NO;  if (c <= 0x0BC2) return YES;
	if (c < 0x0BC6) return NO;  if (c <= 0x0BC8) return YES;
	if (c < 0x0BCA) return NO;  if (c <= 0x0BCD) return YES;
	if (c == 0x0BD7) return YES;
	
	if (c < 0x0C01) return NO;  if (c <= 0x0C03) return YES;
	if (c < 0x0C3E) return NO;  if (c <= 0x0C44) return YES;
	if (c < 0x0C46) return NO;  if (c <= 0x0C48) return YES;
	
	if (c < 0x0C4A) return NO;  if (c <= 0x0C4D) return YES;
	if (c < 0x0C55) return NO;  if (c <= 0x0C56) return YES;
	if (c < 0x0C82) return NO;  if (c <= 0x0C83) return YES;
	
	if (c < 0x0CBE) return NO;  if (c <= 0x0CC4) return YES;
	if (c < 0x0CC6) return NO;  if (c <= 0x0CC8) return YES;
	if (c < 0x0CCA) return NO;  if (c <= 0x0CCD) return YES;
	
	if (c < 0x0CD5) return NO;  if (c <= 0x0CD6) return YES;
	if (c < 0x0D02) return NO;  if (c <= 0x0D03) return YES;
	if (c < 0x0D3E) return NO;  if (c <= 0x0D43) return YES;
	
	if (c < 0x0D46) return NO;  if (c <= 0x0D48) return YES;
	if (c < 0x0D4A) return NO;  if (c <= 0x0D4D) return YES;
	if (c == 0x0D57) return YES;
	if (c == 0x0E31) return YES;
	
	if (c < 0x0E34) return NO;  if (c <= 0x0E3A) return YES;
	if (c < 0x0E47) return NO;  if (c <= 0x0E4E) return YES;
	if (c == 0x0EB1) return YES;
	if (c < 0x0EB4) return NO;  if (c <= 0x0EB9) return YES;
	
	if (c < 0x0EBB) return NO;  if (c <= 0x0EBC) return YES;
	if (c < 0x0EC8) return NO;  if (c <= 0x0ECD) return YES;
	if (c < 0x0F18) return NO;  if (c <= 0x0F19) return YES;
	if (c == 0x0F35) return YES;
	
	if (c == 0x0F37) return YES;
	if (c == 0x0F39) return YES;
	if (c == 0x0F3E) return YES;
	if (c == 0x0F3F) return YES;
	if (c < 0x0F71) return NO;  if (c <= 0x0F84) return YES;
	
	if (c < 0x0F86) return NO;  if (c <= 0x0F8B) return YES;
	if (c < 0x0F90) return NO;  if (c <= 0x0F95) return YES;
	if (c == 0x0F97) return YES;
	if (c < 0x0F99) return NO;  if (c <= 0x0FAD) return YES;
	
	if (c < 0x0FB1) return NO;  if (c <= 0x0FB7) return YES;
	if (c == 0x0FB9) return YES;
	if (c < 0x20D0) return NO;  if (c <= 0x20DC) return YES;
	if (c == 0x20E1) return YES;
	
	if (c < 0x302A) return NO;  if (c <= 0x302F) return YES;
	if (c == 0x3099) return YES;
	if (c == 0x309A) return YES;
	
	return NO;
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