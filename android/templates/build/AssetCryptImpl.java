package <%- appid %>;

import java.util.Collections;
import java.util.Map;
import java.util.HashMap;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.lang.reflect.Method;
import java.lang.System;
import java.util.Collection;

import org.appcelerator.kroll.util.KrollAssetHelper;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;

import android.os.Debug;
import android.util.Base64;

@SuppressWarnings("unchecked")
public class AssetCryptImpl implements KrollAssetHelper.AssetCrypt
{
	private static class Range
	{
		int offset;
		int length;
		public Range(int offset, int length)
		{
			this.offset = offset;
			this.length = length;
		}
	}

	<%- encryptedAssets %>

	@Override
	public InputStream openAsset(String path)
	{
		byte[] bytes = fetchFilteredAssetBytes(path);
		if (bytes == null) {
			return null;
		}
		return new ByteArrayInputStream(bytes);
	}

	@Override
	public String readAsset(String path)
	{
		byte[] bytes = fetchFilteredAssetBytes(path);
		if (bytes == null) {
			return null;
		}
		return new String(bytes, StandardCharsets.UTF_8);
	}

	@Override
	public Collection<String> getAssetPaths()
	{
		return assets.keySet();
	}

	private static byte[] fetchFilteredAssetBytes(String path)
	{
		TiApplication application = TiApplication.getInstance();
		boolean isProduction = false;
		if (application != null) {
			isProduction = TiApplication.DEPLOY_TYPE_PRODUCTION.equals(application.getAppInfo().getDeployType());
		}

		if (isProduction && Debug.isDebuggerConnected()) {
			Log.e("AssetCryptImpl", "Illegal State. Exit.");
			System.exit(1);
		}

		Range range = assets.get(path);
		if (range == null) {
			return null;
		}

		return filterDataInRange(assetsBytes, range.offset, range.length);
	}

	private static byte[] filterDataInRange(byte[] data, int offset, int length)
	{
		try {
			Class clazz = Class.forName("org.appcelerator.titanium.TiVerify");
			Method method = clazz.getMethod("filterDataInRange", new Class[] { data.getClass(), int.class, int.class });
			return (byte[]) method.invoke(clazz, new Object[] { data, offset, length });
		} catch (Exception e) {
			Log.e("AssetCryptImpl", "Unable to load asset data.", e);
		}
		return new byte[0];
	}
}
