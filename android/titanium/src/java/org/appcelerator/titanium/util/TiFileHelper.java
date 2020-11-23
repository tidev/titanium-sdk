/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.util;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.ref.SoftReference;
import java.net.URI;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;

import android.content.ContentResolver;
import android.content.Context;
import android.content.res.AssetManager;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.webkit.URLUtil;

@SuppressWarnings("deprecation")
public class TiFileHelper
{
	private static final String TAG = "TiFileHelper";

	public static final String TI_DIR = "tiapp";
	public static final String TI_DIR_JS = "tijs";
	private static final String MACOSX_PREFIX = "__MACOSX";
	private static final String CONTENT_URL_PREFIX = ContentResolver.SCHEME_CONTENT + ":";
	private static final String ANDROID_RESOURCE_URL_PREFIX = ContentResolver.SCHEME_ANDROID_RESOURCE + ":";
	private static final String TI_RESOURCE_PREFIX = "ti:";
	public static final String RESOURCE_ROOT_ASSETS = "file:///android_asset/Resources";
	public static final String SD_CARD_PREFIX = "/sdcard/Ti.debug";

	static HashMap<String, Integer> systemIcons;

	private SoftReference<Context> softContext;
	private TiNinePatchHelper nph;

	private static HashSet<String> resourcePathCache;
	private static HashSet<String> foundResourcePathCache;
	private static HashSet<String> notFoundResourcePathCache;
	private static TiFileHelper _instance = null;

	public TiFileHelper(Context context)
	{
		softContext = new SoftReference<Context>(context);
		this.nph = new TiNinePatchHelper();
		if (resourcePathCache == null) {
			resourcePathCache = new HashSet<String>();
			foundResourcePathCache = new HashSet<String>();
			notFoundResourcePathCache = new HashSet<String>();
		}

		if (resourcePathCache == null) {
			resourcePathCache = new HashSet<String>();
			foundResourcePathCache = new HashSet<String>();
			notFoundResourcePathCache = new HashSet<String>();
		}

		synchronized (TI_DIR)
		{
			if (systemIcons == null) {
				systemIcons = new HashMap<String, Integer>();
				systemIcons.put("ic_menu_camera", android.R.drawable.ic_menu_camera);
				//systemIcons.put("ic_menu_compose", android.R.drawable.ic_menu_compose);
				systemIcons.put("ic_menu_search", android.R.drawable.ic_menu_search);
				systemIcons.put("ic_menu_add", android.R.drawable.ic_menu_add);
				systemIcons.put("ic_menu_delete", android.R.drawable.ic_menu_delete);
				//systemIcons.put("ic_menu_archive", android.R.drawable.ic_menu_archive);
				//systemIcons.put("ic_menu_stop", android.R.drawable.ic_menu_stop);
				//systemIcons.put("ic_menu_refresh", android.R.drawable.ic_menu_refresh);
				systemIcons.put("ic_media_play", android.R.drawable.ic_media_play);
				systemIcons.put("ic_media_ff", android.R.drawable.ic_media_ff);
				systemIcons.put("ic_media_pause", android.R.drawable.ic_media_pause);
				systemIcons.put("ic_media_rew", android.R.drawable.ic_media_rew);
				systemIcons.put("ic_menu_edit", android.R.drawable.ic_menu_edit);
				systemIcons.put("ic_menu_close_clear_cancel", android.R.drawable.ic_menu_close_clear_cancel);
				systemIcons.put("ic_menu_save", android.R.drawable.ic_menu_save);
				//systemIcons.put("ic_menu_mark", android.R.drawable.ic_menu_mark);
				//systemIcons.put("ic_menu_back", android.R.drawable.ic_menu_back);
				//systemIcons.put("ic_menu_forward", android.R.drawable.ic_menu_forward);
				systemIcons.put("ic_menu_help", android.R.drawable.ic_menu_help);
				//systemIcons.put("ic_menu_home", android.R.drawable.ic_menu_home);
				systemIcons.put("ic_media_next", android.R.drawable.ic_media_next);
				systemIcons.put("ic_menu_preferences", android.R.drawable.ic_menu_preferences);
				systemIcons.put("ic_media_previous", android.R.drawable.ic_media_previous);
				systemIcons.put("ic_menu_revert", android.R.drawable.ic_menu_revert);
				systemIcons.put("ic_menu_send", android.R.drawable.ic_menu_send);
				systemIcons.put("ic_menu_share", android.R.drawable.ic_menu_share);
				systemIcons.put("ic_menu_view", android.R.drawable.ic_menu_view);
				systemIcons.put("ic_menu_zoom", android.R.drawable.ic_menu_zoom);
			}
		}
	}

	/**
	 * Creates or retrieves the TiFileHelper instance.
	 * @return the TiFileHelper instance.
	 */
	public static TiFileHelper getInstance()
	{
		if (_instance == null) {
			_instance = new TiFileHelper(TiApplication.getInstance());
		}
		return _instance;
	}

	public InputStream openInputStream(String path, boolean report) throws IOException
	{
		InputStream is = null;

		Context context = softContext.get();
		if (context != null) {
			if (isTitaniumResource(path)) {
				String[] parts = path.split(":");
				if (parts.length != 3) {
					Log.w(TAG, "Malformed titanium resource url, resource not loaded: " + path);
					return null;
				}
				@SuppressWarnings("unused")
				String titanium = parts[0];
				String section = parts[1];
				String resid = parts[2];

				if (TI_RESOURCE_PREFIX.equals(section)) {
					try {
						is = TiApplication.getInstance().getResources().openRawResource(
							TiRHelper.getResource("drawable." + resid));
					} catch (Exception e) {
						Log.w(TAG, "Drawable not found for Titanium id: " + resid);
					}
				} else if ("Sys".equals(section)) {
					Log.e(TAG, "Accessing Android system icons is deprecated. Instead copy to res folder.");
					Integer id = systemIcons.get(resid);
					if (id != null) {
						is = Resources.getSystem().openRawResource(id);
					} else {
						Log.w(TAG, "Drawable not found for system id: " + path);
					}
				} else {
					Log.e(TAG, "Unknown section identifier: " + section);
				}
			} else if (URLUtil.isNetworkUrl(path)) {
				is = handleNetworkURL(path);
			} else if (path.startsWith(RESOURCE_ROOT_ASSETS)) {
				int len = "file:///android_asset/".length();
				path = path.substring(len);
				boolean found = false;

				if (foundResourcePathCache.contains(path)) {
					found = true;
				} else if (!notFoundResourcePathCache.contains(path)) {
					String base = path.substring(0, path.lastIndexOf("/"));

					synchronized (resourcePathCache)
					{
						if (!resourcePathCache.contains(base)) {
							String[] paths = context.getAssets().list(base);
							for (int i = 0; i < paths.length; i++) {
								foundResourcePathCache.add(base + '/' + paths[i]);
							}
							resourcePathCache.add(base);
							if (foundResourcePathCache.contains(path)) {
								found = true;
							}
						}
						if (!found) {
							notFoundResourcePathCache.add(path);
						}
					}
				}
				if (found) {
					is = context.getAssets().open(path);
				}
			} else if (path.startsWith(SD_CARD_PREFIX)) {
				is = new FileInputStream(new File(path));
			} else if (URLUtil.isFileUrl(path)) {
				URL u = new URL(path);
				is = u.openStream();
			} else if (path.startsWith(ANDROID_RESOURCE_URL_PREFIX) || path.startsWith(CONTENT_URL_PREFIX)) {
				ContentResolver contentResolver = context.getContentResolver();
				is = contentResolver.openInputStream(Uri.parse(path));
			} else {
				path = joinPaths("Resources", path);
				is = context.getAssets().open(path);
			}
		}

		return is;
	}

	private InputStream handleNetworkURL(String path) throws IOException
	{
		// Validate argument.
		if ((path == null) || path.isEmpty()) {
			return null;
		}

		// Do a blocking download.
		// Note: The download manager will attempt to read from TiResponseCache first before sending an HTTP request.
		InputStream inputStream = null;
		try {
			inputStream = TiDownloadManager.getInstance().blockingDownload(URI.create(path));
		} catch (Exception ex) {
			Log.e(TAG, "Problem pulling image data from " + path, ex);
		}
		return inputStream;
	}

	/**
	 * This is a wrapper method.
	 * Refer to {@link #loadDrawable(String, boolean, boolean)} for more details.
	 * @param path  url of the Drawable
	 * @param report  this is not being used.
	 * @return a Drawable instance.
	 */
	public Drawable loadDrawable(String path, boolean report)
	{
		return loadDrawable(path, report, false);
	}

	public Drawable loadDrawable(String path, boolean report, boolean checkForNinePatch)
	{
		return loadDrawable(path, report, checkForNinePatch, true);
	}

	/**
	 * This method creates a Drawable given the bitmap's path, and converts it to a NinePatch Drawable
	 * if checkForNinePatch param is true.
	 * @param path  the path/url of the Drawable
	 * @param report  this is not being used.
	 * @param checkForNinePatch  a boolean to determine whether the returning Drawable is a NinePatch Drawable.
	 * @param densityScaled  a boolean to determine whether the returning Drawable is scaled based on device density.
	 * @return  a Drawable instance.
	 */
	public Drawable loadDrawable(String path, boolean report, boolean checkForNinePatch, boolean densityScaled)
	{
		Drawable d = null;
		InputStream is = null;

		// Try to get Resource drawable first.
		d = TiUIHelper.getResourceDrawable(path);
		if (d != null) {
			return d;
		}

		try {
			if (checkForNinePatch && path != null && !URLUtil.isNetworkUrl(path)) {
				if (path.endsWith(".png")) {
					if (!path.endsWith(".9.png")) {
						String apath = null;
						// First See if it's in the root dir
						apath = path.substring(0, path.lastIndexOf(".")) + ".9.png";
						try {
							is = openInputStream(apath, false);
							if (is != null) {
								path = apath;
							}
						} catch (IOException e) {
							Log.d(TAG, "path not found: " + apath);
						}
					}
				}
				if (is == null) {
					is = openInputStream(path, report);
				}
				Bitmap b = null;
				if (densityScaled) {
					b = TiUIHelper.createDensityScaledBitmap(is);
				} else {
					b = TiUIHelper.createBitmap(is);
				}
				d = nph.process(b);
			} else {
				is = openInputStream(path, report);
				Bitmap b = null;
				if (densityScaled) {
					b = TiUIHelper.createDensityScaledBitmap(is);
				} else {
					b = TiUIHelper.createBitmap(is);
				}
				if (b != null) {
					d = new BitmapDrawable(b);
				}
			}
		} catch (IOException e) {
			Log.e(TAG, path + " not found.", e);
		} finally {
			if (is != null) {
				try {
					is.close();
				} catch (IOException e) {
					//Ignore
				}
			}
		}

		return d;
	}

	public boolean isTitaniumResource(String s)
	{
		boolean result = false;
		if (s != null && s.startsWith(TI_RESOURCE_PREFIX)) {
			result = true;
		}

		return result;
	}

	public Drawable getTitaniumResource(Context context, String s)
	{
		Drawable d = null;

		if (isTitaniumResource(s)) {

			String[] parts = s.split(":");
			if (parts.length != 2) {
				Log.w(TAG, "Malformed titanium resource url, resource not loaded: " + s);
				return null;
			}
			String section = parts[0];
			String resid = parts[1];

			if (TI_RESOURCE_PREFIX.equals(section)) {
				InputStream is = null;
				try {
					is = TiApplication.getInstance().getResources().openRawResource(
						TiRHelper.getResource("drawable." + resid));
					d = new BitmapDrawable(is);
				} catch (Exception e) {
					Log.w(TAG, "Resource not found for Titanium id: " + resid);
				} finally {
					if (is != null) {
						try {
							is.close();
						} catch (IOException e) {
							// Ignore
						}
					}
				}
			} else if ("Sys".equals(section)) {
				Log.e(TAG, "Accessing Android system icons is deprecated. Instead copy to res folder.");
				Integer id = systemIcons.get(resid);
				if (id != null) {
					d = Resources.getSystem().getDrawable(id);
				} else {
					Log.w(TAG, "Drawable not found for system id: " + s);
				}
			} else {
				Log.e(TAG, "Unknown section identifier: " + section);
			}

		} else {
			Log.w(TAG, "Ignoring non titanium resource string id: " + s);
		}

		return d;
	}

	public String getResourceUrl(String path)
	{
		return joinPaths(RESOURCE_ROOT_ASSETS, path);
	}

	public String joinPaths(String pre, String post)
	{
		StringBuilder sb = new StringBuilder();
		sb.append(pre);
		if (pre.endsWith("/") && !post.startsWith("/")) {
			sb.append(post);
		} else if (!pre.endsWith("/") && post.startsWith("/")) {
			sb.append(post);
		} else if (!pre.endsWith("/") && !post.startsWith("/")) {
			sb.append("/").append(post);
		} else {
			sb.append(post.substring(1));
		}
		return sb.toString();
	}

	public void deployFromAssets(File dest) throws IOException
	{
		Context ctx = softContext.get();
		if (ctx != null) {
			ArrayList<String> paths = new ArrayList<String>();
			AssetManager am = ctx.getAssets();
			walkAssets(am, "", paths);

			// Delete all files and subdirectories under given directory.
			emptyDirectory(dest);

			// copy from assets to dest dir
			BufferedInputStream bis = null;
			FileOutputStream fos = null;
			byte[] buf = new byte[8096];
			try {
				int len = paths.size();
				for (int i = 0; i < len; i++) {
					String path = paths.get(i);
					File f = new File(path);
					if (f.getName().indexOf(".") > -1) {
						bis = new BufferedInputStream(am.open(path), 8096);
						File df = new File(dest, path);
						Log.d(TAG, "Copying to: " + df.getAbsolutePath(), Log.DEBUG_MODE);
						fos = new FileOutputStream(df);

						int read = 0;
						while ((read = bis.read(buf)) != -1) {
							fos.write(buf, 0, read);
						}

						bis.close();
						bis = null;
						fos.close();
						fos = null;
					} else {
						File d = new File(dest, path);
						Log.d(TAG, "Creating directory: " + d.getAbsolutePath());
						d.mkdirs();
					}
				}
			} finally {
				if (bis != null) {
					try {
						bis.close();
					} catch (IOException e) {
						//Ignore
					}
					bis = null;
				}
				if (fos != null) {
					try {
						fos.close();
					} catch (IOException e) {
						//Ignore
					}
					fos = null;
				}
			}
		}
	}

	public void deployFromZip(File fname, File dest) throws IOException
	{
		emptyDirectory(dest);

		ZipInputStream zis = null;
		ZipEntry ze = null;
		byte[] buf = new byte[8096];

		try {
			// See if we need to strip off parent dir.
			zis = getZipInputStream(new FileInputStream(fname));
			String root = getRootDir(zis);
			int rootLen = root.length();
			zis.close();

			Log.d(TAG, "Zip file root: " + root, Log.DEBUG_MODE);

			// Process the file
			zis = getZipInputStream(new FileInputStream(fname));
			while ((ze = zis.getNextEntry()) != null) {
				String name = ze.getName();
				if (name.startsWith(MACOSX_PREFIX)) {
					zis.closeEntry();
					continue;
				}

				name = name.substring(rootLen);

				if (name.length() > 0) {
					Log.d(TAG, "Extracting " + name, Log.DEBUG_MODE);
					if (ze.isDirectory()) {
						File d = new File(dest, name);
						d.mkdirs();
						Log.d(TAG, "Created directory " + d.toString(), Log.DEBUG_MODE);
						d = null;
					} else {
						FileOutputStream fos = null;
						try {
							fos = new FileOutputStream(new File(dest, name));
							int read = 0;
							while ((read = zis.read(buf)) != -1) {
								fos.write(buf, 0, read);
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
				}

				zis.closeEntry();
			}
		} finally {
			if (zis != null) {
				try {
					zis.close();
				} catch (Throwable t) {
					//Ignore
				}
			}
		}
	}

	/**
	 * Recursively deletes the given directory tree.
	 * Will never throw an exception and will return the result as a boolean instead.
	 * @param file Reference to a file or directory. Can be null.
	 * @return
	 * Returns true if successfully deleted all files and folders under given directory tree.
	 * Returns false if at least 1 deletion failed or if given a null argument.
	 */
	public boolean tryDeleteTree(File file)
	{
		try {
			return deleteTree(file);
		} catch (Throwable ex) {
			Log.e(TAG, "Failed to delete directory tree: " + file, ex);
		}
		return false;
	}

	/**
	 * Recursively deletes the given directory tree.
	 * @param file Reference to a directory or a single file. Can be null, in which case this method no-ops.
	 * @return
	 * Returns true if successfully deleted all files and folders under given directory tree.
	 * Returns false if at least 1 deletion failed or if given a null argument.
	 * @exception SecurityException Thrown if don't have permission to delete at least 1 file in the tree.
	 */
	public boolean deleteTree(File file) throws SecurityException
	{
		// Validate argument.
		if (file == null) {
			return false;
		}

		// If given a directory, then recursively delete the entire tree.
		boolean wasDeleted = true;
		if (file.isDirectory()) {
			for (File nextFile : file.listFiles()) {
				wasDeleted = deleteTree(nextFile) && wasDeleted;
			}
		}

		// Delete the given directory/file.
		return (wasDeleted && file.delete());
	}

	/**
	 * Deletes all files and subdirectories under the given directory while leaving the given directory intact.
	 * If given directory does not exist, then it is created.
	 * @param directory The directory to be emptied. Can be null.
	 * @return
	 * Returns true if successfully deleted all files and folders under given directory.
	 * Returns false if at least 1 deletion failed or if given a null argument.
	 * @exception SecurityException Thrown if don't have permission to delete at least 1 file in the tree.
	 */
	public boolean emptyDirectory(File directory) throws SecurityException
	{
		// Validate argument.
		if (directory == null) {
			return false;
		}

		// If directory does not exist, then create it and stop here.
		if (!directory.exists()) {
			return directory.mkdirs();
		}

		// Do not continue if referencing a file instead of a directory.
		if (!directory.isDirectory()) {
			return false;
		}

		// Delete all file and subdirectories under given directory.
		boolean wasSuccessful = true;
		for (File nextFile : directory.listFiles()) {
			wasSuccessful = deleteTree(nextFile) && wasSuccessful;
		}
		return wasSuccessful;
	}

	public File getTempFile(String suffix, boolean destroyOnExit) throws IOException
	{
		TiApplication tiApp = TiApplication.getInstance();
		File parentDir = destroyOnExit ? tiApp.getTiTempDir() : tiApp.getCacheDir();
		return File.createTempFile("tia", suffix, parentDir);
	}

	public File getTempFileFromInputStream(InputStream is, String suffix, boolean destroyOnExit)
	{
		try {
			File tempFile = getTempFile(suffix, destroyOnExit);
			try (FileOutputStream os = new FileOutputStream(tempFile)) {
				byte[] bytes = new byte[1024];
				int length;
				while ((length = is.read(bytes)) != -1) {
					os.write(bytes, 0, length);
				}
			}
			return tempFile;
		} catch (FileNotFoundException e) {
			Log.w(TAG, "Could not find temp file: " + suffix);
		} catch (Exception e) {
			Log.w(TAG, "Error occurred while creating output stream from temp file: " + suffix);
		}
		return null;
	}

	/**
	 * Creates/retrieves a data directory in which the application can place its own custom data files.
	 * @param privateStorage  determines the location of the data directory. If this is true, the location is internal(app-data://),
	 * and external (SD) otherwise.
	 * @return  the data directory.
	 */
	public File getDataDirectory(boolean privateStorage)
	{
		File f = null;
		Context context = softContext.get();
		if (context != null) {
			if (privateStorage) {
				f = context.getDir("appdata", 0);
			} else {
				f = context.getExternalFilesDir(null);
			}
		}
		return f;
	}

	private void walkAssets(AssetManager am, String path, ArrayList<String> paths) throws IOException
	{
		if (titaniumPath(path)) {
			String[] files = am.list(path);
			if (files.length > 0) {
				for (int i = 0; i < files.length; i++) {
					String newPath = files[i];
					String todo = path;
					if (path.length() > 0) {
						todo = todo + "/" + newPath;
					} else {
						todo = newPath;
					}
					if (titaniumPath(todo)) {
						//Log.e(LCAT, todo);
						paths.add(todo);
						walkAssets(am, todo, paths);
					}
				}
			}
		}
	}

	private boolean titaniumPath(String path)
	{
		return path.isEmpty() || path.equals("tiapp.xml") || path.startsWith("Resources");
	}

	private ZipInputStream getZipInputStream(InputStream is) throws FileNotFoundException, IOException
	{
		return new ZipInputStream(is);
	}

	private String getRootDir(ZipInputStream zis) throws FileNotFoundException, IOException
	{
		String root = "";

		ZipEntry ze = null;
		while ((ze = zis.getNextEntry()) != null) {
			String name = ze.getName();
			zis.closeEntry();

			if (name.startsWith(MACOSX_PREFIX)) {
				continue;
			} else {
				if (name.indexOf("tiapp.xml") > -1) {
					String[] segments = name.split("\\/");
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
}
