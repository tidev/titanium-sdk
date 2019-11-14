package <%- appid %>;

import android.os.Debug;

import java.io.InputStream;
import java.lang.System;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;

import javax.crypto.Cipher;
import javax.crypto.CipherInputStream;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.util.KrollAssetHelper;
import org.appcelerator.titanium.TiApplication;

@SuppressWarnings("unchecked")
public class AssetCryptImpl implements KrollAssetHelper.AssetCrypt
{
	private static final String TAG = "AssetCryptImpl";

	private static byte[] salt = {
		<% for (let i = 0; i < salt.length - 1; i++){ - % > <% -'(byte)' + salt.readUInt8(i) + ', ' - %> < % } - %>
		<% -'(byte)' + salt.readUInt8(salt.length - 1) %>
	};

	private static final Collection<String> assets =
		new ArrayList<String>(Arrays.asList(<% for (let i = 0; i < assets.length - 1; i++) {
			- % > "Resources/<%- assets[i] %>", < %
		} - %> "Resources/<%- assets[assets.length - 1] %>"));

	public AssetCryptImpl()
	{
		try {
			System.loadLibrary("ti.cloak");
		} catch (Exception e) {
			Log.e(TAG, "Could not load 'ti.cloak' library");
		}
	}

	@Override
	public InputStream openAsset(String path)
	{
		return getAssetStream(path);
	}

	@Override
	public String readAsset(String path)
	{
		byte[] bytes = getAssetBytes(path);
		if (bytes != null) {
			return new String(bytes, StandardCharsets.UTF_8);
		}
		return null;
	}

	@Override
	public Collection<String> getAssetPaths()
	{
		return assets;
	}

	private static InputStream getAssetStream(String path)
	{
		if (!assets.contains(path)) {
			return null;
		}
		try {
			Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
			cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(ti.cloak.Binding.getKey(salt), "AES"),
						new IvParameterSpec(salt));
			return new CipherInputStream(KrollAssetHelper.getAssetManager().open(path), cipher);
		} catch (Exception e) {
			Log.e(TAG, "Could not decrypt '" + path + "'");
			Log.e(TAG, e.toString());
		}
		return null;
	}

	private static byte[] getAssetBytes(String path)
	{
		try {
			InputStream in = getAssetStream(path);
			if (in != null) {
				return KrollAssetHelper.readInputStream(in).toByteArray();
			}
		} catch (Exception e) {
			Log.e(TAG, "Could not decrypt '" + path + "'");
			Log.e(TAG, e.toString());
		}
		return null;
	}
}
