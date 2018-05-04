/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.utils;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.nio.charset.Charset;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import org.apache.commons.codec.digest.DigestUtils;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiFileProxy;
import org.appcelerator.titanium.util.TiMimeTypeHelper;

import android.util.Base64;

@Kroll.module
public class UtilsModule extends KrollModule
{
	private static final String TAG = "UtilsModule";

	public UtilsModule()
	{
		super();
	}

	private byte[] convertToBytes(Object obj)
	{
		if (obj instanceof String) {
			try {
				return ((String) obj).getBytes("UTF-8");
			} catch (UnsupportedEncodingException e) {
				Log.e(TAG, "UTF-8 is not a supported encoding type");
			}
			return ((String) obj).getBytes(); // should never fall back here!
		} else if (obj instanceof TiBlob) {
			return ((TiBlob) obj).getBytes();
		} else {
			throw new IllegalArgumentException("Invalid type for argument");
		}
	}

	@Kroll.method
	public TiBlob base64encode(Object obj)
	{
		if (obj instanceof TiFileProxy) {
			// recursively call base64encode after converting Ti.Filesystem.File to a Ti.Blob wrapping it
			return base64encode(TiBlob.blobFromFile(((TiFileProxy) obj).getBaseFile()));
		}
		byte[] data = convertToBytes(obj);
		if (data != null) {
			try {
				return TiBlob.blobFromString(new String(Base64.encode(data, Base64.NO_WRAP), "UTF-8"));
			} catch (UnsupportedEncodingException e) {
				Log.e(TAG, "UTF-8 is not a supported encoding type");
			}
		}
		return null;
	}

	@Kroll.method
	public TiBlob base64decode(Object obj)
	{
		if (obj instanceof TiFileProxy) {
			// recursively call base64decode after converting Ti.Filesystem.File to a Ti.Blob wrapping it
			return base64decode(TiBlob.blobFromFile(((TiFileProxy) obj).getBaseFile()));
		}
		byte[] data = convertToBytes(obj);
		if (data != null) {
			return TiBlob.blobFromData(Base64.decode(data, Base64.NO_WRAP));
		}
		return null;
	}

	@Kroll.method
	public String md5HexDigest(Object obj)
	{
		byte[] data = convertToBytes(obj);
		if (data != null) {
			return DigestUtils.md5Hex(data);
		}
		return null;
	}

	@Kroll.method
	public String sha1(Object obj)
	{
		byte[] data = convertToBytes(obj);
		if (data != null) {
			return DigestUtils.shaHex(data);
		}
		return null;
	}

	@Kroll.method
	public boolean arrayTest(float[] a, long[] b, int[] c, String[] d)
	{
		return true;
	}

	@Kroll.method
	public String sha256(Object obj)
	{
		// NOTE: DigestUtils with the version before 1.4 doesn't have the function sha256Hex,
		// so we deal with it ourselves
		try {
			byte[] b = convertToBytes(obj);
			MessageDigest algorithm = MessageDigest.getInstance("SHA-256");
			algorithm.reset();
			algorithm.update(b);
			byte messageDigest[] = algorithm.digest();
			StringBuilder result = new StringBuilder();
			for (int i = 0; i < messageDigest.length; i++) {
				result.append(Integer.toString((messageDigest[i] & 0xff) + 0x100, 16).substring(1));
			}
			return result.toString();
		} catch (NoSuchAlgorithmException e) {
			Log.e(TAG, "SHA256 is not a supported algorithm");
		}
		return null;
	}

	@Override
	public String getApiName()
	{
		return "Ti.Utils";
	}
}
