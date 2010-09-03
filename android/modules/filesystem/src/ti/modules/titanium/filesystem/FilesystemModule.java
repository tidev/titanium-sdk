/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.filesystem;

import java.io.File;
import java.io.IOException;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;

@Kroll.module
public class FilesystemModule extends KrollProxy
{
	private static final String LCAT = "TiFilesystem";
	private static final boolean DBG = TiConfig.LOGD;

	@Kroll.constant public static int MODE_READ = 0;
	@Kroll.constant public static int MODE_WRITE = 1;
	@Kroll.constant public static int MODE_APPEND = 2;

	private static String[] RESOURCES_DIR = { "app://" };
	
	public FilesystemModule(TiContext tiContext) {
		super(tiContext);
	}

	// Methods
	@Kroll.method
	public FileProxy createTempFile()
	{
		try {
			File f = File.createTempFile("tifile", "tmp");
			String[] parts = { f.getAbsolutePath() };
			return new FileProxy(getTiContext(), parts, false);
		} catch (IOException e) {
			Log.e(LCAT, "Unable to create tmp file: " + e.getMessage(), e);
			return null;
		}
	}

	@Kroll.method
	public FileProxy createTempDirectory()
	{
		String dir = String.valueOf(System.currentTimeMillis());
		File tmpdir = new File(System.getProperty("java.io.tmpdir"));
		File f = new File(tmpdir,dir);
		f.mkdirs();
		String[] parts = { f.getAbsolutePath() };
		return new FileProxy(getTiContext(), parts);
	}

	public boolean getIsExternalStoragePresent() {
		return android.os.Environment.getExternalStorageState().equals(android.os.Environment.MEDIA_MOUNTED);
	}

	@Kroll.method
	public FileProxy getFile(Object[] parts)
	{
		String[] sparts = TiConvert.toStringArray(parts);
		return new FileProxy(getTiContext(), sparts);
	}

	@Kroll.getProperty @Kroll.method
	public FileProxy getApplicationDirectory()
	{
		return null;
	}

	@Kroll.getProperty @Kroll.method
	public String getApplicationDataDirectory() {
		return "appdata-private://";
	}

	@Kroll.getProperty @Kroll.method
	public String getResourcesDirectory()
	{
		return "app://";
	}

	@Kroll.getProperty @Kroll.method
	public String getExternalStorageDirectory() {
		return "appdata://";
	}

	@Kroll.getProperty @Kroll.method
	public String getSeparator() {
		return File.separator;
	}

	@Kroll.getProperty @Kroll.method
	public String getLineEnding() {
		return System.getProperty("line.separator");
	}
}
