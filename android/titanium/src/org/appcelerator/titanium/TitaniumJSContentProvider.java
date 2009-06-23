/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;

import org.appcelerator.titanium.config.TitaniumAppInfo;
import org.appcelerator.titanium.util.TitaniumFileHelper;
import org.appcelerator.titanium.util.TitaniumUrlHelper;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.PackageManager.NameNotFoundException;
import android.database.Cursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.util.Config;
import android.util.Log;

public class TitaniumJSContentProvider extends ContentProvider
{
	private static final String LCAT = "TiJSContent";
	private static final boolean DBG = Config.LOGD;

	protected File tijsdir;
	protected Thread cacheBuilderThread;

	public TitaniumJSContentProvider() {
	}

	@Override
	public ParcelFileDescriptor openFile(Uri uri, String mode)
			throws FileNotFoundException
	{
		if (cacheBuilderThread != null) {
			try {
				if(DBG) {
					Log.d(LCAT, "Waiting on caching builder to finish.");
				}
				cacheBuilderThread.join();
				if(DBG) {
					Log.d(LCAT, "Cache builder finished.");
				}
				cacheBuilderThread = null; // No longer needed
			} catch (InterruptedException e) {
				//Ignore
			}
		}
		ParcelFileDescriptor pfd = null;
		//File f = new File(tijsdir, uri.getPath());
		File f = new File("file:///android_asset/Resources/ti", uri.getPath());
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

		} else {
			String msg = "Can't find file for " + uri.toString();
			Log.e(LCAT, msg);
			throw new FileNotFoundException(msg);
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
			Log.d(LCAT, "Building javascript cache.");
		}
		final Context ctx = getContext();
		tijsdir = ctx.getDir(TitaniumFileHelper.TI_DIR_JS, Context.MODE_PRIVATE);

		cacheBuilderThread = new Thread(new Runnable(){

			public void run() {
				int version = 0; //TODO Use titanium version instead of app version?
				boolean writeVersionFile = true;

				try {
					Context appContext = ctx.getApplicationContext();
					synchronized(appContext) {
						Log.i(LCAT, "Need information from tiapp.xml, waiting.");
						ctx.getApplicationContext().wait();
					}
				} catch (InterruptedException e) {
					Log.w(LCAT, "Interrupted");
				}

				PackageManager pm = ctx.getPackageManager();
				try {
					PackageInfo pi = pm.getPackageInfo(ctx.getPackageName(), 0);
					version = pi.versionCode;
				} catch (NameNotFoundException e) {
					Log.e(LCAT, "Package not found: " + ctx.getPackageName(), e);
				}


				final SharedPreferences systemPrefs = ctx.getSharedPreferences(TitaniumAppInfo.TISYS_PREFS, Context.MODE_PRIVATE);
				boolean alwaysFlushJSCache = systemPrefs.getBoolean(TitaniumAppInfo.PROP_ANDROID_FLUSHJSCACHE, false);
				final boolean debuggable = !systemPrefs.getBoolean(TitaniumAppInfo.PROP_ANDROID_MINIFYJS, true);
				final File tiversion = new File(tijsdir, "version-" + version + (debuggable ? "-D" : "-P"));

				if (alwaysFlushJSCache || !tiversion.exists())
				{
					final boolean fDebuggable = debuggable;
					if (alwaysFlushJSCache) {
						Log.e(LCAT, "ALWAYS_FLUSH_JS_CACHE is on, turn off for production.");
					}

					TitaniumFileHelper tfh = new TitaniumFileHelper(ctx);
					if (DBG) {
						Log.d(LCAT, "Flushing JS cache.");
					}
					tfh.wipeDirectoryTree(tijsdir);
					tijsdir = ctx.getDir(TitaniumFileHelper.TI_DIR_JS, Context.MODE_PRIVATE); // Re-get/create

					String[] files = TitaniumUrlHelper.DEFAULT_JS_FILES;
					for(int i = 0; i < files.length; i++) {

						InputStream is = null;
						FileOutputStream fos = null;
						String file = files[i];

						byte[] buf = new byte[16192];
						int len = 0;
						try {
							String resPath = "/org/appcelerator/titanium/js/" + file;
							is = getClass().getResourceAsStream(resPath);
							if (is == null) {
								throw new FileNotFoundException("Unable to locate resource: " + resPath);
							}

							fos = new FileOutputStream(new File(tijsdir, file));
							if (!fDebuggable) {

							} else {
								while((len = is.read(buf)) != -1) {
									fos.write(buf, 0, len);
								}
							}
							if (debuggable) {
								Log.i(LCAT, "Cached javascript file: " + file);
							} else {
								Log.i(LCAT, "Cached minified javascript file: " + file);
							}
						} catch (FileNotFoundException e) {
							Log.e(LCAT, e.getMessage());
							writeVersionFile = false;
						} catch (IOException e) {
							Log.e(LCAT, "Unable to cache javascript: " + file);
							writeVersionFile = false;
						} finally {
							if (is != null) {
								try {
									is.close();
								} catch (IOException e) {
									// Ignore
								}
								is = null;
							}
							if (fos != null) {
								try {
									fos.close();
								} catch (IOException e) {
									// Ignore
								}
							}
						}
					}

					if (writeVersionFile) {
						// Touch version filename
						FileOutputStream vfile = null;
						try {
							vfile = new FileOutputStream(tiversion);
							vfile.write(0);
						} catch (IOException e) {
							Log.e(LCAT, "Error writing version file");
						} finally {
							if (vfile != null) {
								try {
									vfile.close();
								} catch(IOException e) {
									//Ignore
								}
							}
						}
					} else {
						Log.e(LCAT, "Not writing cached js version file, due to error writing javascript");
					}
				} else {
					Log.i(LCAT, "Using cached javascript.");
				}
			}
		});
		cacheBuilderThread.start();

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
