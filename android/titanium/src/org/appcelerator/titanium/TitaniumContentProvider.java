/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;

import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumFileHelper;
import org.appcelerator.titanium.util.TitaniumUrlHelper;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;

public class TitaniumContentProvider extends ContentProvider
{
	public static final String LCAT = "TiContent";
	private static final boolean DBG = TitaniumConfig.LOGD;

	protected File tidir;
	protected String uriPrefix;

	public TitaniumContentProvider() {
		// TODO Auto-generated constructor stub
	}

	@Override
	public ParcelFileDescriptor openFile(Uri uri, String mode)
			throws FileNotFoundException
	{
		ParcelFileDescriptor pfd = null;
		if (DBG) {
			Log.d(LCAT, "openFile: " + uri.toString() + " as: " + mode);
		}
		File f = new File(tidir, uri.getPath());
		if (DBG) {
			Log.d(LCAT, "Absolute path:" + f.toString());
		}
		if (f.exists()) {
			int pfdmode = 0;
			if (mode == null) {
				mode = "r";
			}

			if (mode.indexOf("r") > -1) {
				pfdmode |= ParcelFileDescriptor.MODE_READ_ONLY;
			}
			if (mode.indexOf("w") > -1) {
				pfdmode |= (ParcelFileDescriptor.MODE_READ_WRITE | ParcelFileDescriptor.MODE_CREATE);
			}

			pfd = ParcelFileDescriptor.open(f, pfdmode);
			return pfd;
		} else {

			String path = "file:///android_asset/Resources" + uri.toString().substring(uriPrefix.length());
			if (DBG) {
				Log.d(LCAT, "Trying asset folder: " + path);
			}
			try {
				pfd = ParcelFileDescriptor.open(new File(path), ParcelFileDescriptor.MODE_READ_ONLY);
			} catch (IOException e) {
				Log.e(LCAT, "IOError: ", e);
			}
		}
		if (pfd == null) {
			throw new FileNotFoundException("Can't find file for " + uri.toString());
		}
		return pfd;
	}

	@Override
	public int delete(Uri uri, String selection, String[] selectionArgs) {
		// TODO Auto-generated method stub
		return 0;
	}

	@Override
	public String getType(Uri uri) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public Uri insert(Uri uri, ContentValues values) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public boolean onCreate() {
		boolean succeeded = false;

		if (DBG) {
			Log.d(LCAT, "Checking for storage.");
		}
		Context ctx = getContext();
		tidir = ctx.getDir(TitaniumFileHelper.TI_DIR, Context.MODE_PRIVATE);
		uriPrefix = TitaniumUrlHelper.getContentUrlRoot(ctx);
		if (uriPrefix.endsWith("/")) {
			uriPrefix = uriPrefix.substring(0, uriPrefix.length() - 1);
		}

		return succeeded;
	}

	@Override
	public Cursor query(Uri uri, String[] projection, String selection,
			String[] selectionArgs, String sortOrder) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public int update(Uri uri, ContentValues values, String selection,
			String[] selectionArgs) {
		// TODO Auto-generated method stub
		return 0;
	}

}
