/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.utils;

import java.nio.charset.StandardCharsets;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiFileProxy;
import org.appcelerator.titanium.util.TiDigestUtils;

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
			return ((String) obj).getBytes(StandardCharsets.UTF_8);
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
			return TiBlob.blobFromString(new String(Base64.encode(data, Base64.NO_WRAP), StandardCharsets.UTF_8));
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
		return TiDigestUtils.md5Hex(convertToBytes(obj));
	}

	@Kroll.method
	public String sha1(Object obj)
	{
		return TiDigestUtils.sha1Hex(convertToBytes(obj));
	}

	@Kroll.method
	public boolean arrayTest(float[] a, long[] b, int[] c, String[] d)
	{
		return true;
	}

	@Kroll.method
	public String sha256(Object obj)
	{
		return TiDigestUtils.sha256Hex(convertToBytes(obj));
	}

	@Override
	public String getApiName()
	{
		return "Ti.Utils";
	}
}
