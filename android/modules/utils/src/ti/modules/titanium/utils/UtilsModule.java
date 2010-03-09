/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.utils;

import java.io.UnsupportedEncodingException;

import org.apache.commons.codec.binary.Base64;
import org.apache.commons.codec.digest.DigestUtils;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiModule;
import org.appcelerator.titanium.util.Log;

public class UtilsModule extends TiModule
{
	private static final String LCAT = "UtilsModule";

	public UtilsModule(TiContext tiContext) {
		super(tiContext);
	}

	public String base64encode(String data) {
		try {
			return new String(Base64.encodeBase64(data.getBytes("UTF-8")), "UTF-8");
		} catch (UnsupportedEncodingException e) {
			Log.e(LCAT, "UTF-8 is not a supported encoding type");
		}
		return null;
	}

	public String base64decode(String data)
	{
		try {
			return new String(Base64.decodeBase64(data.getBytes("UTF-8")), "UTF-8");
		} catch (UnsupportedEncodingException e) {
			Log.e(LCAT, "UTF-8 is not a supported encoding type");
		}

		return null;
	}

	public String md5HexDigest(String data) {
		return DigestUtils.md5Hex(data);
	}
}
