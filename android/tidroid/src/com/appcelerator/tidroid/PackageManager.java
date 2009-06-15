// Copyright(c) 2009 by Appcelerator, Inc. All Rights Reserved.
// This is proprietary software. Do not redistribute without express
// written permission.

package com.appcelerator.tidroid;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import android.content.Context;
import android.net.Uri;
import android.util.Log;

public class PackageManager
{
	public static final String TI_DIR = "ti";

	private static final String MACOSX_PREFIX = "__MACOSX";
	private static final String ASSET_PREFIX = "/android_asset/";
	private static final String LCAT = "TiPkgMgr";
	private static final String TITANIUM_JS_FILE = "ti.js";

	public static final String INDEX_DOCUMENT = "content://titanium/index.html";

	protected File tidir;
	protected Context context;
	protected PackageManagerListener pmlistener;

	public PackageManager(Context context) {
		this.context = context;
		tidir = context.getDir(TI_DIR, Context.MODE_PRIVATE);
	}

	public boolean isAppInstalled() {
		boolean installed = false;
		InputStream is = null;
		try  {
			// Consider the application installed if the index_document exists.
			is = context.getContentResolver().openInputStream(Uri.parse(INDEX_DOCUMENT));
			installed = true;
		} catch (FileNotFoundException e) {
			Log.d(LCAT, "Couldn't locate " + INDEX_DOCUMENT + ", application is not installed.");
		} finally {
			if (is != null) {
				try {
					is.close();
				} catch (IOException e) {
					// Ignore
				}
			}
		}

		return installed;
	}

	public String getAppInstallDirectory() {
		return tidir.getAbsolutePath();
	}

	public void addPackageManagerListener(PackageManagerListener listener) {
		if (pmlistener == null) {
			pmlistener = listener;
		} else {
			throw new IllegalStateException("Multiple Listeners Not Supported");
		}
	}

	public void removePackageManagerListener(PackageManagerListener listener) {
		if (pmlistener != null) {
			if (pmlistener == listener) {
				pmlistener = null;
			} else {
				throw new IllegalStateException("Attempt to remove listener registered by another class.");
			}
		}
	}

	public boolean uninstall()
	{
		boolean result = false;

		Log.d(LCAT, "Uninstalling Titanium App");
		fireOnItemProcessed("Removing Application from \n  " + tidir.toString(), null);
		try {
			rm(tidir.listFiles());
			Log.d(LCAT, "Uninstall complete.");
			fireOnItemProcessed("Application Successfully Removed", null);
			result = true;
		} catch (IOException e) {
			Log.e(LCAT, "Unable to uninstall app", e);
			fireOnItemProcessed("Application Removal Failed, see logcat", null);
		}

		return result;
	}

	public boolean install(Uri uri)
	{
		boolean result = false;
		ZipInputStream zis = null;
		ZipEntry ze = null;
		byte[] buf = new byte[8096];

		boolean tiJavscriptInstalled = false;

		try {

			// See if we need to strip off parent dir.
			zis = getZipInputStream(uri);
			String root = getRootDir(zis);
			int rootLen = root.length();
			zis.close();

			fireOnItemProcessed("Installing Application to \n  " + tidir.toString(), null);
			// Process the file
			zis = getZipInputStream(uri);
			while((ze = zis.getNextEntry()) != null) {
				String name = ze.getName();
				if (name.startsWith(MACOSX_PREFIX)) {
					zis.closeEntry();
					continue;
				}

				name = name.substring(rootLen);

				if(name.length() > 0) {
					Log.d(LCAT, "Extracting " + name);
					if (ze.isDirectory()) {
						File d = new File(tidir, name);
						d.mkdirs();
						Log.d(LCAT, "Created directory " + d.toString());
						d = null;
					} else {
						FileOutputStream fos = null;
						try {
							fos = new FileOutputStream(new File(tidir,name));
							int read = 0;
							while((read = zis.read(buf)) != -1) {
								fos.write(buf, 0, read);
							}
							if (name.endsWith(TITANIUM_JS_FILE)) {
								tiJavscriptInstalled = true;
							}
						} finally {
							if (fos != null) {
								try {
									fos.close();
								} catch (Throwable t) {
									//Ignore
								}
							}
						}
					}

					fireOnItemProcessed(null, name);
				}

				zis.closeEntry();
			}

			if (!tiJavscriptInstalled) {
				// Copy shipping ti.js fill into install dir
				InputStream jsis = null;
				FileOutputStream jsos = null;

				try {
					jsis = context.getAssets().open(TITANIUM_JS_FILE);
					jsos = new FileOutputStream(new File(tidir, TITANIUM_JS_FILE));
					int read = 0;
					while((read = jsis.read(buf)) != -1) {
						jsos.write(buf, 0, read);
					}
					tiJavscriptInstalled = true;
					fireOnItemProcessed("Copied shipping " + TITANIUM_JS_FILE + " to application directory", null);
				} finally {
					if (jsis != null) {
						try {
							jsis.close();
						} catch (IOException e) {
							// Ignore
						}
						jsis = null;
					}
					if (jsos != null) {
						try {
							jsos.close();
						} catch (IOException e) {
							// Ignore
						}
						jsos = null;
					}
				}
			}
			result = true;
			fireOnItemProcessed("Application Installation Complete", null);
		} catch (FileNotFoundException e) {
			String msg = "Unable to find zip archive: " + uri.toString();
			Log.e(LCAT, msg); //TODO report to user?
			fireOnItemProcessed(msg, null);
		} catch (IOException e) {
			Log.e(LCAT, "Unable to read archive entry: ", e);
			fireOnItemProcessed("Possibly corrupt application archive, see logcat for details.", null);
		} finally {
			if (zis != null) {
				try {
					zis.close();
				}catch (Throwable t) {
					//Ignore
				}
			}
		}

		return result;
	}

	public InputStream openInputStream(Uri uri)
		throws IOException
	{
		InputStream is = null;

		String path = uri.getPath();
		if (path.startsWith(ASSET_PREFIX)) {
			path = path.substring(ASSET_PREFIX.length());
			is = context.getAssets().open(path);
		} else {
			is = context.getContentResolver().openInputStream(uri);
		}

		Log.d(LCAT, "Opening stream at " + path);
		return is;
	}

	private void rm(File[] files) throws IOException
	{
		if (files != null) {
			int len = files.length;
			for (int i = 0; i < len; i++) {
				File f = files[i];

				Log.d(LCAT, "Processing file: " + f.getCanonicalPath());
				if (f.isDirectory()) {
					rm(f.listFiles());
				}

				String item = f.getCanonicalPath();
				Log.d(LCAT, "rm " + item);

				if (!f.delete()) {
					throw new IOException("Unable to delete file: " + item);
				}
				fireOnItemProcessed(null, item);
			}
		}
	}

	private ZipInputStream getZipInputStream(Uri uri)
		throws FileNotFoundException, IOException
	{
		return new ZipInputStream(openInputStream(uri));
	}

	private String getRootDir(ZipInputStream zis)
		throws FileNotFoundException, IOException
	{
		String root = "";

		ZipEntry ze = null;
		while((ze = zis.getNextEntry()) != null) {
			String name = ze.getName();
			zis.closeEntry();

			if (name.startsWith(MACOSX_PREFIX)) {
				continue;
			} else {
				if(name.indexOf("index.html") > -1) {
					String [] segments = name.split("\\/");
					if (segments.length == 2) {
						root = segments[0] + "/";
						break;
					} else if (segments.length == 1) {
						break;
					}
				}
			}
		}
		return root;
	}

	private void fireOnItemProcessed(String msg, String item) {
		if (pmlistener != null) {
			pmlistener.onItemProcessed(msg, item);
		}
	}
}
