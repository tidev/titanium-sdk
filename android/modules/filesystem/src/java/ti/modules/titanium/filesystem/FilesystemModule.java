/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.filesystem;

import java.io.File;
import java.io.IOException;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;

import ti.modules.titanium.stream.FileStreamProxy;

@Kroll.module
public class FilesystemModule extends KrollModule
{
	private static final String TAG = "TiFilesystem";

	@Kroll.constant
	public static final int MODE_READ = 0;
	@Kroll.constant
	public static final int MODE_WRITE = 1;
	@Kroll.constant
	public static final int MODE_APPEND = 2;

	// Methods
	public FilesystemModule()
	{
		super();
	}

	@Kroll.method
	public FileProxy createTempFile(KrollInvocation invocation)
	{
		try {
			File file = File.createTempFile("tifile", ".tmp", TiApplication.getInstance().getTiTempDir());
			String[] parts = { file.getAbsolutePath() };
			return new FileProxy(invocation.getSourceUrl(), parts, false);
		} catch (Exception ex) {
			Log.e(TAG, "Unable to create tmp file: " + ex.getMessage(), ex);
		}
		return null;
	}

	@Kroll.method
	public FileProxy createTempDirectory(KrollInvocation invocation)
	{
		try {
			File parentDir = TiApplication.getInstance().getTiTempDir();
			String tempDirName = "tidir" + System.currentTimeMillis();
			File tempDir = new File(parentDir, tempDirName);
			for (int index = 0; tempDir.exists(); index++) {
				tempDir = new File(parentDir, tempDirName + index);
			}
			tempDir.mkdirs();
			String[] parts = { tempDir.getAbsolutePath() };
			return new FileProxy(invocation.getSourceUrl(), parts, false);
		} catch (Exception ex) {
			Log.e(TAG, "Unable to create tmp directory: " + ex.getMessage(), ex);
		}
		return null;
	}

	@Kroll.method
	@Kroll.getProperty
	public boolean isExternalStoragePresent()
	{
		return android.os.Environment.getExternalStorageState().equals(android.os.Environment.MEDIA_MOUNTED);
	}

	@Kroll.method
	public FileProxy getFile(KrollInvocation invocation, Object[] parts)
	{
		//If directory doesn't exist, return
		if (parts[0] == null) {
			Log.w(TAG, "A null directory was passed. Returning null.");
			return null;
		}
		String[] sparts = TiConvert.toStringArray(parts);
		return new FileProxy(invocation.getSourceUrl(), sparts);
	}

	@Kroll.method
	private boolean hasStoragePermissions()
	{
		if (Build.VERSION.SDK_INT < 23) {
			return true;
		}

		Context context = TiApplication.getInstance().getApplicationContext();

		return ((context.checkSelfPermission(android.Manifest.permission.READ_EXTERNAL_STORAGE)
				 == PackageManager.PERMISSION_GRANTED)
				&& (context.checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)
					== PackageManager.PERMISSION_GRANTED));
	}

	@Kroll.method
	public void requestStoragePermissions(@Kroll.argument(optional = true) KrollFunction permissionCallback)
	{
		if (hasStoragePermissions()) {
			KrollDict response = new KrollDict();
			response.putCodeAndMessage(0, null);
			permissionCallback.callAsync(getKrollObject(), response);
			return;
		}

		String[] permissions = new String[] {
			android.Manifest.permission.READ_EXTERNAL_STORAGE,
			android.Manifest.permission.WRITE_EXTERNAL_STORAGE
		};
		Activity currentActivity = TiApplication.getInstance().getCurrentActivity();
		TiBaseActivity.registerPermissionRequestCallback(TiC.PERMISSION_CODE_EXTERNAL_STORAGE, permissionCallback,
														 getKrollObject());
		currentActivity.requestPermissions(permissions, TiC.PERMISSION_CODE_EXTERNAL_STORAGE);
	}

	@Kroll.method
	@Kroll.getProperty
	public FileProxy getApplicationDirectory()
	{
		return null;
	}

	@Kroll.method
	@Kroll.getProperty
	public String getApplicationDataDirectory()
	{
		return TiFileFactory.APPDATA_PRIVATE_URL_SCHEME + "://";
	}

	@Kroll.method
	@Kroll.getProperty
	public String getResRawDirectory()
	{
		return "android.resource://" + TiApplication.getInstance().getPackageName() + "/raw/";
	}

	@Kroll.method
	@Kroll.getProperty
	public String getApplicationCacheDirectory()
	{
		return "file://" + TiApplication.getInstance().getCacheDir().getAbsolutePath();
	}

	@Kroll.method
	@Kroll.getProperty
	public String getResourcesDirectory()
	{
		return TiC.URL_APP_PREFIX;
	}

	@Kroll.getProperty
	public String getExternalCacheDirectory()
	{
		return TiFileFactory.APPCACHE_EXTERNAL_URL_SCHEME + "://";
	}

	@Kroll.method
	@Kroll.getProperty
	public String getExternalStorageDirectory()
	{
		return TiFileFactory.APPDATA_URL_SCHEME + "://";
	}

	@Kroll.method
	@Kroll.getProperty
	public String getTempDirectory()
	{
		return "file://" + TiApplication.getInstance().getTiTempDir().getAbsolutePath();
	}

	@Kroll.method
	@Kroll.getProperty
	public String getSeparator()
	{
		return File.separator;
	}

	@Kroll.method
	@Kroll.getProperty
	public String getLineEnding()
	{
		return System.lineSeparator();
	}

	@Kroll.method
	public FileStreamProxy openStream(KrollInvocation invocation, int mode, Object[] parts) throws IOException
	{
		String[] sparts = TiConvert.toStringArray(parts);
		FileProxy fileProxy = new FileProxy(invocation.getSourceUrl(), sparts);
		fileProxy.getBaseFile().open(mode, true);

		return new FileStreamProxy(fileProxy);
	}

	@Override
	public String getApiName()
	{
		return "Ti.Filesystem";
	}
}
