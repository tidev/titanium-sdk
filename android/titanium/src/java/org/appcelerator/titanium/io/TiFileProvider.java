/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017-2019 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.io;

import android.content.ContentProvider;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.res.AssetFileDescriptor;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.Build;
import android.os.ParcelFileDescriptor;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import java.io.File;
import java.io.FileNotFoundException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.attribute.BasicFileAttributes;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiMimeTypeHelper;

/**
 * Titanium ContentProvider used to provide access to this app's sandboxed files to another app.
 * Can provide access to files in the file system or embedded files within the APK's "assets" and "res" folders.
 * <p>
 * A "content://" URI that works with this ContentProvider can be created via this class' createUriFrom() methods.
 * The returned content URI is intended to be passed to another app, such as via an Intent, which allows it to
 * access this app's sandboxed file via an Android "ContentResolver". Note that external apps must be granted
 * read access to this ContentProvider's files as well, such as via an intent's "FLAG_GRANT_READ_URI_PERMISSION".
 */
public class TiFileProvider extends ContentProvider
{
	private static final String TAG = "TiFileProvider";

	@Override
	public boolean onCreate()
	{
		return true;
	}

	@Override
	public AssetFileDescriptor openAssetFile(Uri uri, String mode) throws FileNotFoundException, SecurityException
	{
		// Validate.
		if (uri == null) {
			throw new IllegalArgumentException();
		}

		// Convert given URI to an absolute path in case it contains any "." or ".." segments.
		uri = makeAbsolute(uri);

		// Attempt to fetch a file descriptor for the given URI.
		AssetFileDescriptor descriptor = null;
		try {
			final String FILE_SYSTEM_URI_PREFIX = getFileSystemUriPrefix();
			final String APK_ASSETS_URI_PREFIX = getApkAssetsUriPrefix() + "/";
			final String EXTERNAL_RESOURCE_URI_PREFIX = getExternalResourceUriPrefix() + "/";

			String uriString = uri.toString();
			if (uriString.startsWith(FILE_SYSTEM_URI_PREFIX)) {
				// Received a "content://<PackageName>.tifilesystem/filesystem/" URL.
				ParcelFileDescriptor fileDescriptor = openFile(uri, mode);
				descriptor = new AssetFileDescriptor(fileDescriptor, 0, AssetFileDescriptor.UNKNOWN_LENGTH);
			} else if (uriString.startsWith(APK_ASSETS_URI_PREFIX)) {
				// Received a "content://<PackageName>.tifilesystem/assets/" URL.
				if ((mode != null) && (mode.indexOf('w') >= 0)) {
					throw new SecurityException("Cannot open APK asset file with write access.");
				}
				String assetPath = uriString.substring(APK_ASSETS_URI_PREFIX.length());
				assetPath = Uri.parse(assetPath).getPath();
				descriptor = getContext().getAssets().openFd(assetPath);
			} else if (uriString.startsWith(EXTERNAL_RESOURCE_URI_PREFIX)) {
				// Received a "content://<PackageName>.tifilesystem/external_resource/<PackageName>/" URL.
				// Note: The 2nd package name in the URL may reference another app for fetching its resource.
				String resourceUrl = ContentResolver.SCHEME_ANDROID_RESOURCE;
				resourceUrl += "://" + uriString.substring(EXTERNAL_RESOURCE_URI_PREFIX.length());
				descriptor = getContext().getContentResolver().openAssetFileDescriptor(Uri.parse(resourceUrl), mode);
			}
		} catch (SecurityException ex) {
			throw ex;
		} catch (Exception ex) {
		}

		// If we've failed to open/find the file, then we must throw a file-not-found exception.
		// This tells the caller to attempt to call openFile() next or give up.
		if (descriptor == null) {
			throw new FileNotFoundException();
		}

		// Return the request file descriptor.
		return descriptor;
	}

	@Override
	public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException
	{
		File file = getFileFrom(uri);
		if (file == null) {
			throw new FileNotFoundException();
		}
		return ParcelFileDescriptor.open(file, getFileMode(mode));
	}

	@Override
	public Cursor query(Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder)
	{
		// Validate.
		if (uri == null) {
			return null;
		}

		// Convert given URI to an absolute path in case it contains any "." or ".." segments.
		uri = makeAbsolute(uri);
		String uriString = uri.toString();

		// If "content://" references an external file, then fetch it.
		final File file = getFileFrom(uri);

		// Set up the columns to return data for.
		String[] columnNames;
		if ((projection != null) && (projection.length > 0)) {
			// Given projection provides the columns the caller is interested in.
			columnNames = projection.clone();
		} else {
			// Have this query provide the following column data by default since caller did not specify.
			columnNames = new String[] {
				OpenableColumns.DISPLAY_NAME,
				OpenableColumns.SIZE,
				MediaStore.MediaColumns.MIME_TYPE
			};
		}

		// Fetch file info based on the given column names.
		Object[] columnValues = new Object[columnNames.length];
		for (int index = 0; index < columnNames.length; index++) {
			String nextColumnName = columnNames[index];
			Object nextColumnValue = null;
			if (nextColumnName != null) {
				switch (nextColumnName) {
					case OpenableColumns.DISPLAY_NAME:
					case MediaStore.MediaColumns.TITLE: {
						// Fetch the file name.
						nextColumnValue = (new File(uri.getPath())).getName();
						break;
					}
					case MediaStore.MediaColumns.DATA: {
						// Fetch the file system path if it's an external file.
						// Note: Android 7.0 and above no longer allows direct file access between apps.
						if (Build.VERSION.SDK_INT < 24) {
							if (file != null) {
								nextColumnValue = file.getAbsolutePath();
							}
						}
						break;
					}
					case OpenableColumns.SIZE: {
						// Fetch the file's byte count.
						if (file != null) {
							try {
								nextColumnValue = file.length();
							} catch (Exception ex) {
							}
						}
						if (nextColumnValue == null) {
							try (AssetFileDescriptor descriptor = openAssetFile(uri, "r")) {
								nextColumnValue = descriptor.getLength();
							} catch (Exception ex) {
							}
						}
						break;
					}
					case MediaStore.MediaColumns.MIME_TYPE: {
						// Fetch the file's mime type. (Typically based on its extension.)
						nextColumnValue = getType(uri);
						break;
					}
					case MediaStore.MediaColumns.DATE_ADDED:
					case MediaStore.MediaColumns.DATE_MODIFIED: {
						// Fetch the file's timestamp.
						// Note: If file is embedded within APK, then use APK file's timestamp.
						File targetFile = file;
						if (targetFile == null) {
							boolean useApkFile = false;
							String packageName = getContext().getPackageName();
							if (uriString.startsWith(getApkAssetsUriPrefix())) {
								useApkFile = true;
							} else if (uriString.startsWith(getExternalResourceUriPrefix() + "/" + packageName)) {
								useApkFile = true;
							}
							if (useApkFile) {
								targetFile = new File(getContext().getPackageCodePath());
							}
						}
						if (targetFile != null) {
							try {
								nextColumnValue = targetFile.lastModified() / 1000L;
								if (Build.VERSION.SDK_INT >= 26) {
									if (nextColumnName.equals(MediaStore.MediaColumns.DATE_ADDED)) {
										BasicFileAttributes attr = Files.readAttributes(
											targetFile.toPath(), BasicFileAttributes.class);
										nextColumnValue = attr.creationTime().toMillis() / 1000L;
									}
								}
							} catch (Exception ex) {
							}
						}
						break;
					}
				}
			}
			columnValues[index] = nextColumnValue;
		}

		// Return the requested file data via a single row added to the following matrix cursor.
		MatrixCursor cursor = new MatrixCursor(columnNames);
		cursor.addRow(columnValues);
		return cursor;
	}

	/**
	 * Gets the mime type of the file reference by the given "content://" URI.
	 * @param uri A content URI returned by this class' createUriFrom() method. Cannot be null.
	 * @return Returns a mime type string for the URI's referenced file.
	 */
	@Override
	public String getType(Uri uri)
	{
		if (uri == null) {
			throw new IllegalArgumentException();
		}
		return TiMimeTypeHelper.getMimeType(uri);
	}

	@Override
	public Uri insert(Uri uri, ContentValues values)
	{
		throw new UnsupportedOperationException();
	}

	@Override
	public int update(Uri uri, ContentValues values, String selection, String[] selectionArgs)
	{
		throw new UnsupportedOperationException();
	}

	/**
	 * Deletes the file referenced by the given "content://" URI.
	 * @param uri A content URI returned by this class' createUriFrom() method. Cannot be null.
	 * @param selection Not used.
	 * @param selectionArgs Not used.
	 * @return Returns 1 if the file was deleted. Returns 0 if file not found or could not be deleted.
	 */
	@Override
	public int delete(Uri uri, String selection, String[] selectionArgs)
	{
		boolean wasDeleted = false;
		try {
			File file = getFileFrom(uri);
			if (file != null) {
				wasDeleted = file.delete();
			}
		} catch (Exception ex) {
		}
		return wasDeleted ? 1 : 0;
	}

	/**
	 * Creates a Titanium "content://" URI for the given file path or file URL.
	 * Used to expose this app's sandboxed files to other apps via this ContentProvider.
	 * @param filePath
	 * Path to the file to be converted to a "content://" URI. Can be:
	 * <ul>
	 *  <li>A file system path.</li>
	 *  <li>A "file://" URL.</li>
	 *  <li>An "app://" URL which is relative to "Ti.Filesystem.resourcesDirectory".</li>
	 *  <li>An "appdata://" URL which is relative to "Ti.Filesystem.externalStorageDirectory".</li>
	 *  <li>An "appdata-private://" URL which is relative to "Ti.Filesystem.applicationDataDirectory".</li>
	 *  <li>An "android.resource://<PackageName>/" URL to an APK's "res" file.</li>
	 *  <li>A "content://" URL. In this case, the given path is returned as-is.</li>
	 * </ul>
	 * @return
	 * Returns a "content://" URI which provides access to the given file via a ContentResolver.
	 * <p>
	 * Returns null if given an invalid file path or null/empty string.
	 */
	public static Uri createUriFrom(String filePath)
	{
		// Validate argument.
		if ((filePath == null) || filePath.isEmpty()) {
			return null;
		}

		// Attempt to create a "content://" URL for the given file path or file URL.
		return createUriFrom(TiFileFactory.createTitaniumFile(filePath, false));
	}

	/**
	 * Creates a Titanium "content://" URI for the given file.
	 * Used to expose this app's sandboxed files to other apps via this ContentProvider.
	 * @param tiFile
	 * A Titanium file object reference a file in the file system or internal file within the APK. Can be null.
	 * @return
	 * Returns a "content://" URI which provides access to the given file via a ContentResolver.
	 * <p>
	 * Returns null if given a null argument or if referencing a Titanium encrypted JavaScript file.
	 */
	public static Uri createUriFrom(TiBaseFile tiFile)
	{
		// Validate argument.
		if (tiFile == null) {
			return null;
		}

		// Fetch a native URL to the given file.
		// Note: This does not return Titanium's internal URL schemes such as "app:", "appdata:", etc.
		String fileUrl = tiFile.nativePath();
		if ((fileUrl == null) || fileUrl.isEmpty()) {
			return null;
		}

		// Create a "content://" URL for the given file object, if possible.
		String contentUrl = null;
		if (fileUrl.startsWith(TiC.URL_ANDROID_ASSET)) {
			// We were given a "file:///android_asset/" URL.
			contentUrl = getApkAssetsUriPrefix() + "/" + fileUrl.substring(TiC.URL_ANDROID_ASSET.length());
		} else if (fileUrl.startsWith(ContentResolver.SCHEME_FILE)) {
			// We were given a "file:///" URL.
			File file = new File(Uri.parse(fileUrl).getPath());
			contentUrl = getFileSystemUriPrefix() + file.getAbsolutePath();
		} else if (fileUrl.startsWith(ContentResolver.SCHEME_ANDROID_RESOURCE)) {
			// We were given an "android.resource://" URL.
			String prefixToRemove = ContentResolver.SCHEME_ANDROID_RESOURCE + "://";
			contentUrl = getExternalResourceUriPrefix() + "/" + fileUrl.substring(prefixToRemove.length());
		} else if (fileUrl.startsWith(ContentResolver.SCHEME_CONTENT)) {
			// We were given a "content://" URL. Keep it as-is.
			contentUrl = fileUrl;
		}

		// Do not continue if we can't convert given TiBaseFile to a "content://" URL.
		if (contentUrl == null) {
			return null;
		}

		// Success! Return the requested "content://" URL.
		contentUrl = Uri.encode(contentUrl, ":/\\");
		return Uri.parse(contentUrl);
	}

	/**
	 * Creates a Titanium "content://" URI for the given file.
	 * Used to expose this app's sandboxed files to other apps via this ContentProvider.
	 * @param file The file to be referenced via a "content://" URI. Can be null.
	 * @return
	 * Returns a "content://" URI which provides access to the given file via a ContentResolver.
	 * <p>
	 * Returns null if given a null argument.
	 */
	public static Uri createUriFrom(File file)
	{
		Uri uri = null;
		try {
			if (file != null) {
				uri = Uri.parse(getFileSystemUriPrefix() + Uri.encode(file.getAbsolutePath(), ":/\\"));
			}
		} catch (Exception ex) {
			Log.e(TAG, "File to create content URI for file.", ex);
		}
		return uri;
	}

	/**
	 * Determines if the given URI is a "content://" URI belonging to this Titanium ContentProvider.
	 * Will only return true for URIs returned by this class' createUriFrom() methods.
	 * @param uri The URI to check. Can be null.
	 * @return
	 * Returns true if given "content://" URI can be opened by this Titanium app's ContentProvider.
	 * <p>
	 * Returns false if given an invalid URI or given "content://" URI belongs to another ContentProvider.
	 */
	public static boolean isMyUri(Uri uri)
	{
		if (uri != null) {
			String uriString = uri.toString();
			if (uriString != null) {
				return uriString.startsWith(getBaseUriPrefix());
			}
		}
		return false;
	}

	/**
	 * Gets a File object from the given "content://" URI if possible.
	 * Will only work if URI belongs to this provider, which can be identified via the isMyUri() method.
	 * @param uri A "content://" URI generated by this class' createUriFrom() method for an external file.
	 * @return Returns a file object if given URI references a file in the file system. Returns null if not.
	 */
	public static File getFileFrom(Uri uri)
	{
		// Validate argument.
		if (uri == null) {
			return null;
		}

		// If given content URL reference an external file, then return a File object for it.
		String uriString = uri.toString();
		final String FILE_SYSTEM_URI_PREFIX = getFileSystemUriPrefix();
		if (uriString.startsWith(FILE_SYSTEM_URI_PREFIX)) {
			Uri fileUri = Uri.parse(uriString.substring(FILE_SYSTEM_URI_PREFIX.length()));
			return new File(fileUri.getPath());
		}
		return null;
	}

	/**
	 * Converts the given file mode string to its equivalent integer file mode flags.
	 * @param mode The file mode string to be converted such as "r" for read-only or "rw" for read/write.
	 * @return Returns integer file mode flags matching given mode. Returns MODE_READ_ONLY if given an invalid string.
	 */
	private static int getFileMode(String mode)
	{
		int flags;
		if ("w".equals(mode) || "wt".equals(mode)) {
			flags = ParcelFileDescriptor.MODE_WRITE_ONLY;
			flags |= ParcelFileDescriptor.MODE_CREATE;
			flags |= ParcelFileDescriptor.MODE_TRUNCATE;
		} else if ("wa".equals(mode)) {
			flags = ParcelFileDescriptor.MODE_WRITE_ONLY;
			flags |= ParcelFileDescriptor.MODE_CREATE;
			flags |= ParcelFileDescriptor.MODE_APPEND;
		} else if ("rw".equals(mode)) {
			flags = ParcelFileDescriptor.MODE_READ_WRITE;
			flags |= ParcelFileDescriptor.MODE_CREATE;
		} else if ("rwt".equals(mode)) {
			flags = ParcelFileDescriptor.MODE_READ_WRITE;
			flags |= ParcelFileDescriptor.MODE_CREATE;
			flags |= ParcelFileDescriptor.MODE_TRUNCATE;
		} else {
			flags = ParcelFileDescriptor.MODE_READ_ONLY;
		}
		return flags;
	}

	/**
	 * Converts the given URI to an absolute path, if not already.
	 * @param uri The URI to be converted. Can be null.
	 * @return
	 * Returns a new URI having an absolute path. Will not contain any "." or ".." in the path section.
	 * <p>
	 * Returns null if given a null argument.
	 */
	private static Uri makeAbsolute(Uri uri)
	{
		// Convert given URI to an absolute path in case it contains any "." or ".." segments.
		try {
			if (uri != null) {
				URI normalizedUri = URI.create(uri.toString()).normalize();
				Uri newUri = Uri.parse(normalizedUri.toString());
				if (newUri != null) {
					uri = newUri;
				}
			}
		} catch (Exception ex) {
		}
		return uri;
	}

	/**
	 * Gets the URI prefix "content://<PackageName>.tifileprovider/" that all URIs this ContentProvider supports.
	 * @return Returns this ContentProvider's base URI prefix.
	 */
	private static String getBaseUriPrefix()
	{
		final TiApplication tiApp = TiApplication.getInstance();
		return "content://" + tiApp.getPackageName() + ".tifileprovider/";
	}

	/**
	 * Gets URI prefix "content://<PackageName>.tifileprovider/filesystem" that this ContentProvider uses
	 * to reference files in the file system.
	 * @return Returns this ContentProvider's URI prefix for files in the file system.
	 */
	private static String getFileSystemUriPrefix()
	{
		return getBaseUriPrefix() + "filesystem";
	}

	/**
	 * Gets URI prefix "content://<PackageName>.tifileprovider/assets" that this ContentProvider uses
	 * to reference embedded files under the APK's "assets" directory.
	 * @return Returns this ContentProvider's URI prefix for the APK's asset files.
	 */
	private static String getApkAssetsUriPrefix()
	{
		return getBaseUriPrefix() + "assets";
	}

	/**
	 * Gets URI prefix "content://<PackageName>.tifileprovider/external_resource" that this ContentProvider uses
	 * to reference embedded files under an APK's "res" directory (ie: the Android resource files).
	 * Can be used to access another APK's "res" files if given permission.
	 * @return Returns this ContentProvider's URI prefix for an APK's "res" files.
	 */
	private static String getExternalResourceUriPrefix()
	{
		return getBaseUriPrefix() + "external_resource";
	}
}
