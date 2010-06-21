/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.utils;

import java.io.UnsupportedEncodingException;
import java.io.IOException;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.security.DigestInputStream;
import java.security.DigestOutputStream;
import java.security.NoSuchAlgorithmException;
import java.security.MessageDigest;

import org.apache.commons.codec.binary.Base64;
import org.apache.commons.codec.digest.DigestUtils;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiModule;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConvert;

public class UtilsModule extends TiModule
{
	private static final String LCAT = "UtilsModule";

	public UtilsModule(TiContext tiContext) {
		super(tiContext);
	}

	public TiBlob base64encode(Object obj) {
		try {
			String data = TiConvert.toString(obj);
			return TiBlob.blobFromString(getTiContext(),new String(Base64.encodeBase64(data.getBytes("UTF-8")), "UTF-8"));
		} catch (UnsupportedEncodingException e) {
			Log.e(LCAT, "UTF-8 is not a supported encoding type");
		}
		return null;
	}

	public TiBlob base64decode(Object obj)
	{
		try {
			String data = TiConvert.toString(obj);
			return TiBlob.blobFromString(getTiContext(),new String(Base64.decodeBase64(data.getBytes("UTF-8")), "UTF-8"));
		} catch (UnsupportedEncodingException e) {
			Log.e(LCAT, "UTF-8 is not a supported encoding type");
		}

		return null;
	}

	public String md5HexDigest(Object obj) {
		String data = TiConvert.toString(obj);
		return DigestUtils.md5Hex(data);
	}
	
	public String sha1(Object obj) {
		try
		{
			String data = TiConvert.toString(obj);
			byte[] b = data.getBytes();
			MessageDigest algorithm = MessageDigest.getInstance("SHA-1");
			algorithm.reset();
			algorithm.update(b);
			byte messageDigest[] = algorithm.digest();
			StringBuilder result = new StringBuilder();
			//NOTE: for some reason DigestUtils doesn't produce correct value
			//so we deal with it ourselves
			for (int i=0; i < messageDigest.length; i++) {
				result.append(Integer.toString(( messageDigest[i] & 0xff ) + 0x100, 16).substring(1));
			}
			return result.toString();
		} catch(NoSuchAlgorithmException e) {
			Log.e(LCAT, "SHA1 is not a supported algorithm");
		}
		return null;
	}
}
