/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.utils;

import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import org.apache.commons.codec.binary.Base64;
import org.apache.commons.codec.digest.DigestUtils;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.Log;

@Kroll.module
public class UtilsModule extends KrollModule
{
	private static final String LCAT = "UtilsModule";

	public UtilsModule(TiContext tiContext) {
		super(tiContext);
	}

	@Kroll.method
	public TiBlob base64encode(String data) {
		try {
			return TiBlob.blobFromString(getTiContext(),new String(Base64.encodeBase64(data.getBytes("UTF-8")), "UTF-8"));
		} catch (UnsupportedEncodingException e) {
			Log.e(LCAT, "UTF-8 is not a supported encoding type");
		}
		return null;
	}

	@Kroll.method
	public TiBlob base64decode(String data)
	{
		try {
			return TiBlob.blobFromData(getTiContext(), Base64.decodeBase64(data.getBytes("UTF-8")));
		} catch (UnsupportedEncodingException e) {
			Log.e(LCAT, "UTF-8 is not a supported encoding type");
		}

		return null;
	}

	@Kroll.method
	public String md5HexDigest(String data) {
		return DigestUtils.md5Hex(data);
	}
	
	@Kroll.method
	public String sha1(String data) {
		try
		{
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
