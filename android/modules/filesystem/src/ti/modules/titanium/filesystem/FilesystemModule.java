/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.filesystem;

import java.io.File;
import java.io.IOException;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;

public class FilesystemModule extends TiModule
{
	private static final String LCAT = "TiFilesystem";
	private static final boolean DBG = TiConfig.LOGD;

	public static int MODE_READ = 0;
	public static int MODE_WRITE = 1;
	public static int MODE_APPEND = 2;

	private static String[] RESOURCES_DIR = { "app://" };
	private static KrollDict constants;

	public FilesystemModule(TiContext tiContext) {
		super(tiContext);
	}

	@Override
	public KrollDict getConstants()
	{
		if (constants == null) {
			constants = new KrollDict();

			constants.put("MODE_READ", MODE_READ);
			constants.put("MODE_WRITE", MODE_WRITE);
			constants.put("MODE_APPEND", MODE_APPEND);
		}

		return constants;
	}

	// Methods
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

	public FileProxy getFile(Object[] parts)
	{
		String[] sparts = TiConvert.toStringArray(parts);
		return new FileProxy(getTiContext(), sparts);
	}

	public FileProxy getApplicationDirectory()
	{
		return null;
	}

	public String getApplicationDataDirectory() {
		return "appdata-private://";
	}

	public String getResourcesDirectory()
	{
		return "app://";
	}

	public String getExternalStorageDirectory() {
		return "appdata://";
	}

	public String getSeparator() {
		return File.separator;
	}

	public String getLineEnding() {
		return System.getProperty("line.separator");
	}
}
