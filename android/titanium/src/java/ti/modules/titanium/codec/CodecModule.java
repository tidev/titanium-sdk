/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.codec;

import java.io.UnsupportedEncodingException;
import java.nio.ByteOrder;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;

import ti.modules.titanium.BufferProxy;
import ti.modules.titanium.TitaniumModule;

@Kroll.module(parentModule=TitaniumModule.class)
public class CodecModule extends KrollModule
{
	private static final String TAG = "TiCodec";

	@Kroll.constant public static final String CHARSET_ASCII = "ascii";
	@Kroll.constant public static final String CHARSET_ISO_LATIN_1 = "latin1";
	@Kroll.constant public static final String CHARSET_UTF8 = "utf8";
	@Kroll.constant public static final String CHARSET_UTF16 = "utf16";
	@Kroll.constant public static final String CHARSET_UTF16BE = "utf16be";
	@Kroll.constant public static final String CHARSET_UTF16LE = "utf16le";

	@Kroll.constant public static final String TYPE_BYTE = "byte";
	@Kroll.constant public static final String TYPE_SHORT = "short";
	@Kroll.constant public static final String TYPE_INT = "int";
	@Kroll.constant public static final String TYPE_FLOAT = "float";
	@Kroll.constant public static final String TYPE_LONG = "long";
	@Kroll.constant public static final String TYPE_DOUBLE = "double";

	@Kroll.constant public static final int BIG_ENDIAN = 0;
	@Kroll.constant public static final int LITTLE_ENDIAN = 1;

	@Kroll.method
	public int encodeNumber(KrollDict args)
	{
		if (!args.containsKey(TiC.PROPERTY_DEST)) {
			throw new IllegalArgumentException("dest was not specified for encodeNumber");
		}
		if (!args.containsKey(TiC.PROPERTY_SOURCE)) {
			throw new IllegalArgumentException("src was not specified for encodeNumber");
		}
		if (!args.containsKey(TiC.PROPERTY_TYPE)) {
			throw new IllegalArgumentException("type was not specified for encodeNumber");
		}

		BufferProxy dest = (BufferProxy) args.get(TiC.PROPERTY_DEST);
		Number src = (Number) args.get(TiC.PROPERTY_SOURCE);
		String type = TiConvert.toString(args, TiC.PROPERTY_TYPE);
		int byteOrder = getByteOrder(args.get(TiC.PROPERTY_BYTE_ORDER));

		int position = 0;
		if (args.containsKey(TiC.PROPERTY_POSITION)) {
			position = TiConvert.toInt(args, TiC.PROPERTY_POSITION);
		}

		byte buffer[] = dest.getBuffer();
		return encodeNumber(src, type, buffer, position, byteOrder);
	}

	public static int encodeNumber(Number src, String type, byte dest[], int position, int byteOrder)
	{
		long l = src.longValue();
		if (type.equals(TYPE_BYTE)) {
			dest[position] = (byte)(l & 0xFF);
			return position+1;
		} else if (type.equals(TYPE_SHORT)) {
			int bits = byteOrder == BIG_ENDIAN ? 8 : 0;
			int step = byteOrder == BIG_ENDIAN ? -8 : 8;
			for (int i = position; i < position+2; i++, bits += step) {
				dest[i] = (byte)((l >>> bits) & 0xFF);
			}
			return position+2;
		} else if (type.equals(TYPE_INT) || type.equals(TYPE_FLOAT)) {
			if (type.equals(TYPE_FLOAT)) {
				l = Float.floatToIntBits(src.floatValue());
			}
			int bits = byteOrder == BIG_ENDIAN ? 24 : 0;
			int step = byteOrder == BIG_ENDIAN ? -8 : 8;
			for (int j = position; j < position+4; j++, bits += step) {
				dest[j] = (byte)((l >>> bits) & 0xFF);
			}
			return position+4;
		} else if (type.equals(TYPE_LONG) || type.equals(TYPE_DOUBLE)) {
			if (type.equals(TYPE_DOUBLE)) {
				l = Double.doubleToLongBits(src.doubleValue());
			}
			int bits = byteOrder == BIG_ENDIAN ? 56 : 0;
			int step = byteOrder == BIG_ENDIAN ? -8 : 8;
			for (int i = position; i < position+8; i++, bits += step) {
				dest[i] = (byte)((l >>> bits) & 0xFF);
			}
			return position+8;
		}
		return position;
	}

	@Kroll.method
	public Object decodeNumber(KrollDict args)
	{
		if (!args.containsKey(TiC.PROPERTY_SOURCE)) {
			throw new IllegalArgumentException("src was not specified for encodeNumber");
		}
		if (!args.containsKey(TiC.PROPERTY_TYPE)) {
			throw new IllegalArgumentException("type was not specified for encodeNumber");
		}

		BufferProxy buffer = (BufferProxy) args.get(TiC.PROPERTY_SOURCE);
		String type = (String) args.get(TiC.PROPERTY_TYPE);
		int byteOrder = getByteOrder(args.get(TiC.PROPERTY_BYTE_ORDER));

		int position = 0;
		if (args.containsKey(TiC.PROPERTY_POSITION)) {
			position = TiConvert.toInt(args, TiC.PROPERTY_POSITION);
		}

		byte src[] = buffer.getBuffer();
		if (type.equals(TYPE_BYTE)) {
			return src[position];
		}
		else if (type.equals(TYPE_SHORT)) {
			short s1 = (short) (src[position] & 0xFF);
			short s2 = (short) (src[position + 1] & 0xFF);
			switch (byteOrder) {
				case BIG_ENDIAN:
					return ((s1 << 8) + s2);
				case LITTLE_ENDIAN:
					return ((s2 << 8) + s1);
			}
		} else if (type.equals(TYPE_INT) || type.equals(TYPE_FLOAT)) {
			int bits = 0;
			int shiftBits = byteOrder == BIG_ENDIAN ? 24 : 0;
			int step = byteOrder == BIG_ENDIAN ? -8 : 8;
			for (int i = 0; i < 4; i++, shiftBits += step) {
				int part = (int) (src[position + i] & 0xFF);
				bits += (part << shiftBits);
			}
			if (type.equals(TYPE_FLOAT)) {
				return Float.intBitsToFloat(bits);
			}
			return bits;
		} else if (type.equals(TYPE_LONG) || type.equals(TYPE_DOUBLE)) {
			long bits = 0;
			int shiftBits = byteOrder == BIG_ENDIAN ? 56 : 0;
			int step = byteOrder == BIG_ENDIAN ? -8 : 8;
			for (int i = 0; i < 8; i++, shiftBits += step) {
				long part = (long) (src[position + i] & 0xFF);
				bits += (part << shiftBits);
			}
			if (type.equals(TYPE_DOUBLE)) {
				return Double.longBitsToDouble(bits);
			}
			return bits;
		}
		return 0;
	}

	@Kroll.method
	public int encodeString(KrollDict args)
	{
		if (!args.containsKey(TiC.PROPERTY_DEST)) {
			throw new IllegalArgumentException("dest was not specified for encodeString");
		}
		if (!args.containsKey(TiC.PROPERTY_SOURCE) || args.get(TiC.PROPERTY_SOURCE) == null) {
			throw new IllegalArgumentException("src was not specified for encodeString");
		}

		BufferProxy dest = (BufferProxy) args.get(TiC.PROPERTY_DEST);
		String src = (String) args.get(TiC.PROPERTY_SOURCE);

		int destPosition = 0;
		if (args.containsKey(TiC.PROPERTY_DEST_POSITION)) {
			destPosition = TiConvert.toInt(args, TiC.PROPERTY_DEST_POSITION);
		}
		int srcPosition = 0;
		if (args.containsKey(TiC.PROPERTY_SOURCE_POSITION)) {
			srcPosition = TiConvert.toInt(args, TiC.PROPERTY_SOURCE_POSITION);
		}
		int srcLength = src.length();
		if (args.containsKey(TiC.PROPERTY_SOURCE_LENGTH)) {
			srcLength = TiConvert.toInt(args, TiC.PROPERTY_SOURCE_LENGTH);
		}

		String charset = validateCharset(args);
		byte destBuffer[] = dest.getBuffer();
		validatePositionAndLength(srcPosition, srcLength, src.length());

		if (srcPosition != 0 || srcLength != src.length()) {
			src = src.substring(srcPosition, srcPosition+srcLength);
		}

		try {
			byte encoded[] = src.getBytes(charset);
			System.arraycopy(encoded, 0, destBuffer, destPosition, encoded.length);

			return destPosition + encoded.length;
		} catch (UnsupportedEncodingException e) {
			Log.w(TAG, e.getMessage(), e);
			throw new IllegalArgumentException("Unsupported Encoding: " + charset);
		}
	}

	@Kroll.method
	public String decodeString(KrollDict args)
	{
		if (!args.containsKey(TiC.PROPERTY_SOURCE) || args.get(TiC.PROPERTY_SOURCE) == null) {
			throw new IllegalArgumentException("src was not specified for decodeString");
		}

		BufferProxy src = (BufferProxy) args.get(TiC.PROPERTY_SOURCE);
		byte buffer[] = src.getBuffer();

		int position = 0;
		if (args.containsKey(TiC.PROPERTY_POSITION)) {
			position = TiConvert.toInt(args, TiC.PROPERTY_POSITION);
		}
		int length = buffer.length;
		if (args.containsKey(TiC.PROPERTY_LENGTH)) {
			length = TiConvert.toInt(args, TiC.PROPERTY_LENGTH);
		}

		validatePositionAndLength(position, length, buffer.length);
		String charset = validateCharset(args);

		try {
			return new String(buffer, position, length, charset);
		} catch (UnsupportedEncodingException e) {
			Log.w(TAG, e.getMessage(), e);
			throw new IllegalArgumentException("Unsupported Encoding: " + charset);
		}
	}

	@Kroll.getProperty @Kroll.method
	public int getNativeByteOrder()
	{
		return getByteOrder(null);
	}

	/*
	protected byte getByte(Scriptable scope, KrollProxy buffer, int position)
	{
		return ((Number) buffer.get(scope, position)).byteValue();
	}*/

	public static int getWidth(String dataType)
	{
		if (TYPE_BYTE.equals(dataType)) {
			return 1;
		} else if (TYPE_SHORT.equals(dataType)) {
			return 2;
		} else if (TYPE_INT.equals(dataType) || TYPE_FLOAT.equals(dataType)) {
			return 4;
		} else if (TYPE_LONG.equals(dataType) || TYPE_DOUBLE.equals(dataType)) {
			return 8;
		}
		return 0;
	}

	public static int getByteOrder(Object byteOrder)
	{
		if (byteOrder instanceof Number) {
			return ((Number)byteOrder).intValue();
		} else {
			if (ByteOrder.nativeOrder() == ByteOrder.BIG_ENDIAN) {
				return BIG_ENDIAN;
			} else {
				return LITTLE_ENDIAN;
			}
		}
	}

	public static String getCharset(String charset)
	{
		// These are taken from http://download.oracle.com/javase/1.4.2/docs/api/java/nio/charset/Charset.html
		if (CHARSET_ASCII.equals(charset)) {
			return "US-ASCII";
		} else if (CHARSET_ISO_LATIN_1.equals(charset)) {
			return "ISO-8859-1";
		} else if (CHARSET_UTF8.equals(charset)) {
			return "UTF-8";
		} else if (CHARSET_UTF16.equals(charset)) {
			return "UTF-16";
		} else if (CHARSET_UTF16LE.equals(charset)) {
			return "UTF-16LE";
		} else if (CHARSET_UTF16BE.equals(charset)) {
			return "UTF-16BE";
		}
		return null;
	}

	protected String validateCharset(KrollDict args)
	{
		String charset = "UTF-8";
		if (args.containsKey(TiC.PROPERTY_CHARSET)) {
			charset = getCharset(TiConvert.toString(args, TiC.PROPERTY_CHARSET));
		}
		if (charset == null) {
			throw new IllegalArgumentException("could not find a valid charset for " + args.get(TiC.PROPERTY_CHARSET));
		}
		return charset;
	}

	protected void validatePositionAndLength(int position, int length, int expectedLength)
	{
		if (position + length > expectedLength) {
			throw new IllegalArgumentException("position " + position + " and length " + length +
				" is bigger than the expected length: " + expectedLength);
		}
	}
}
