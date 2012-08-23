/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.utils;

import java.io.UnsupportedEncodingException;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.nio.charset.Charset;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import org.apache.commons.codec.binary.Base64;
import org.apache.commons.codec.digest.DigestUtils;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;

@Kroll.module
public class UtilsModule extends KrollModule
{
	private static final String TAG = "UtilsModule";

	public UtilsModule()
	{
		super();
	}
	
	private String convertToString(Object obj)
	{
		if (obj instanceof String) {
			return (String) obj;
		} else if (obj instanceof TiBlob) {
			return ((TiBlob) obj).getText();
		} else {
			throw new IllegalArgumentException("Invalid type for argument");
		}
	}

	public UtilsModule(TiContext tiContext)
	{
		this();
	}

	@Kroll.method
	public TiBlob base64encode(Object obj)
	{
		if (obj instanceof TiBlob) {
			return TiBlob.blobFromString(((TiBlob) obj).toBase64());
		}
		String data = convertToString(obj);
		if (data != null) {
			try {
				return TiBlob.blobFromString(new String(Base64.encodeBase64(data.getBytes("UTF-8")), "UTF-8"));
			} catch (UnsupportedEncodingException e) {
				Log.e(TAG, "UTF-8 is not a supported encoding type");
			}
		}
		return null;
	}

	@Kroll.method
	public TiBlob base64decode(Object obj)
	{
		String data = convertToString(obj);
		if (data != null) {
			try {
				return TiBlob.blobFromData(Base64.decodeBase64(data.getBytes("UTF-8")));
			} catch (UnsupportedEncodingException e) {
				Log.e(TAG, "UTF-8 is not a supported encoding type");
			}
		}
		return null;
	}

	@Kroll.method
	public String md5HexDigest(Object obj)
	{
		String data = convertToString(obj);
		if (data != null) {
			return DigestUtils.md5Hex(data);
		}
		return null;
	}

	@Kroll.method
	public String sha1(Object obj)
	{
		String data = convertToString(obj);
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
		String data = convertToString(obj);
		// NOTE: DigestUtils with the version before 1.4 doesn't have the function sha256Hex,
		// so we deal with it ourselves
		try {
			byte[] b = data.getBytes();
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

	public String transcodeString(String orig, String inEncoding, String outEncoding)
	{
		try {
			
			Charset charsetOut = Charset.forName(outEncoding);
			Charset charsetIn = Charset.forName(inEncoding);

			ByteBuffer bufferIn = ByteBuffer.wrap(orig.getBytes(charsetIn.name()) );
			CharBuffer dataIn = charsetIn.decode(bufferIn);
			bufferIn.clear();
			bufferIn = null;

			ByteBuffer bufferOut = charsetOut.encode(dataIn);
			dataIn.clear();
			dataIn = null;
			byte[] dataOut = bufferOut.array();
			bufferOut.clear();
			bufferOut = null;
			
			return new String(dataOut, charsetOut.name());
			
		} catch (UnsupportedEncodingException e) {
			Log.e(TAG, "Unsupported encoding: " + e.getMessage(), e);
		}
		return null;
	}
}
