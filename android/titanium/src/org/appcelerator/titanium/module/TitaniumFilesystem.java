/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module;

import java.io.File;
import java.io.IOException;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumFile;
import org.appcelerator.titanium.api.ITitaniumFilesystem;
import org.appcelerator.titanium.api.ITitaniumInvoker;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.fs.TitaniumFile;
import org.appcelerator.titanium.module.fs.TitaniumFileFactory;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumDelegate;

import android.webkit.WebView;

class InternalFile {
	public File file;
	public String path;
	public InternalFile(File file, String path) {
		this.file = file;
		this.path = path;
	}
}

public class TitaniumFilesystem extends TitaniumBaseModule implements ITitaniumFilesystem
{
	private static final String LCAT = "TiFilesystem";
	private static final boolean DBG = TitaniumConfig.LOGD;

	public TitaniumFilesystem(TitaniumModuleManager moduleMgr, String name) {
		super(moduleMgr, name);
	}

	@Override
	public void register(WebView webView) {
		String name = getModuleName();
		if (DBG) {
			Log.d(LCAT, "Registering TitaniumFilesystem as " + name);
		}
		webView.addJavascriptInterface((ITitaniumFilesystem) this, name);
	}

	public ITitaniumFile createTempFile() throws IOException
	{
		File f = File.createTempFile("ti","tmp");
		return new TitaniumFile(tmm, f,f.getAbsolutePath(), false);
	}

	public ITitaniumFile createTempDirectory() throws IOException
	{
		String dir = String.valueOf(System.currentTimeMillis());
		File tmpdir = new File(System.getProperty("java.io.tmpdir"));
		File f = new File(tmpdir,dir);
		f.mkdirs();
		return new TitaniumFile(tmm, f,f.getAbsolutePath(), false);
	}

	public boolean isExternalStoragePresent()
	{
		return android.os.Environment.getExternalStorageState().equals(android.os.Environment.MEDIA_MOUNTED);
	}


	public ITitaniumInvoker getFile(String parts[]) throws IOException
	{
		if (parts==null)
		{
			throw new IOException("invalid file passed");
		}
		return new TitaniumDelegate(TitaniumFileFactory.createTitaniumFile(tmm, parts, false));
	}

	public ITitaniumInvoker getFileStream(String[] parts)  throws IOException
	{
		if (parts==null)
		{
			throw new IOException("invalid file passed");
		}
		return new TitaniumDelegate(TitaniumFileFactory.createTitaniumFile(tmm, parts, true));
	}

	public ITitaniumFile getApplicationDirectory()
	{
		return null;
	}

	public ITitaniumFile getApplicationDataDirectory(boolean privateStorage)
	{
		String[] parts = new String[1];
		if (privateStorage)
		{
			parts[0] = "appdata-private://";
		} else {
			parts[0] = "appdata://";
		}

		TitaniumFile f = (TitaniumFile) TitaniumFileFactory.createTitaniumFile(tmm, parts , false);
		f.createDirectory(true);
		return f;
	}

	public ITitaniumFile getResourcesDirectory()
	{
		return null;
	}

	public ITitaniumFile getUserDirectory()
	{
		return null;
	}

	public void asyncCopy (String files[], String callback)
	{
	}
}