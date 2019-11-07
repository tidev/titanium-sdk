/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.util;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import org.appcelerator.kroll.common.Log;

/**
 * Provides hashing methods such as MD5, SHA1, and SHA256.
 * <p>
 * This class provides a subset of methods that work just like the Apache "DigestUtils" class
 * which Google has deprecated. This allows this class to be a near drop-in replacement.
 * <p>
 * You cannot create instances of this class. Only static methods are provided.
 */
public class TiDigestUtils
{
	private static final String TAG = "TiDigestUtils";

	/** Constructor made private to prevent instances from being made. */
	private TiDigestUtils()
	{
	}

	public static byte[] md5(byte[] data)
	{
		return digest("MD5", data);
	}

	public static byte[] md5(String data)
	{
		return md5(utf8BytesFrom(data));
	}

	public static String md5Hex(byte[] data)
	{
		return hex(md5(data));
	}

	public static String md5Hex(String data)
	{
		return hex(md5(data));
	}

	public static byte[] sha1(byte[] data)
	{
		return digest("SHA-1", data);
	}

	public static byte[] sha1(String data)
	{
		return sha1(utf8BytesFrom(data));
	}

	public static String sha1Hex(byte[] data)
	{
		return hex(sha1(data));
	}

	public static String sha1Hex(String data)
	{
		return hex(sha1(data));
	}

	public static byte[] sha256(byte[] data)
	{
		return digest("SHA-256", data);
	}

	public static byte[] sha256(String data)
	{
		return sha256(utf8BytesFrom(data));
	}

	public static String sha256Hex(byte[] data)
	{
		return hex(sha256(data));
	}

	public static String sha256Hex(String data)
	{
		return hex(sha256(data));
	}

	public static String hex(byte[] bytes)
	{
		// Validate argument.
		if (bytes == null) {
			return null;
		}

		// Convert bytes to a lower-case hexadecimal string.
		StringBuilder stringBuilder = new StringBuilder(bytes.length * 2);
		for (byte nextByte : bytes) {
			int unsignedValue = nextByte & 0xFF;
			stringBuilder.append(Integer.toHexString(unsignedValue >>> 4));
			stringBuilder.append(Integer.toHexString(unsignedValue & 0x0F));
		}
		return stringBuilder.toString();
	}

	private static byte[] utf8BytesFrom(String data)
	{
		byte[] bytes = null;
		if (data != null) {
			try {
				bytes = data.getBytes("UTF-8");
			} catch (Exception ex) {
				Log.e(TAG, ex.getMessage(), ex);
			}
		}
		return bytes;
	}

	private static byte[] digest(String algorithm, byte[] data)
	{
		// Validate arguments.
		if ((algorithm == null) || (data == null)) {
			return null;
		}

		// Generate a hash using the given algorithm and data.
		byte[] hash = null;
		try {
			MessageDigest messageDigest = MessageDigest.getInstance(algorithm);
			messageDigest.reset();
			messageDigest.update(data);
			hash = messageDigest.digest();
		} catch (NoSuchAlgorithmException ex) {
			Log.e(TAG, "'" + algorithm + "' is not a supported algorithm");
		} catch (Exception ex) {
			Log.e(TAG, ex.getMessage(), ex);
		}
		return hash;
	}
}
