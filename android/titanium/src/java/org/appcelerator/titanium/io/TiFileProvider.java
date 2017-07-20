package org.appcelerator.titanium.io;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.util.TiMimeTypeHelper;

import java.io.File;
import java.io.FileNotFoundException;

/**
 * TiFileProvider is intended to expose filesystem resources to outside apps.
 */
public class TiFileProvider extends ContentProvider {
	private static final String TAG = "TiFileProvider";

	@Override
	public boolean onCreate() {
		return true;
	}

	public static Uri createUriFrom(File file) {
		final TiApplication tiApp = TiApplication.getInstance();
		if (tiApp == null) {
			return null;
		}

		try {
			String path = getUriPrefix() + file.getAbsolutePath();
			return Uri.parse(path);
		} catch (Exception e) {
			// ignore exception
		}

		return null;
	}

	@Override
	public int delete(Uri uri, String selection, String[] selectionArgs) {
		throw new UnsupportedOperationException("No external deletions");
	}

	/**
	 * Returns the type of a file assuming that it has an extension otherwise 'application/octet-stream' is returned.
	 */
	@Override
	public String getType(Uri uri) {
		return TiMimeTypeHelper.getMimeType(uri.getPath(), "application/octet-stream");
	}

	@Override
	public Uri insert(Uri uri, ContentValues values) {
		throw new UnsupportedOperationException("No external inserts");
	}

	@Override
	public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
		return ParcelFileDescriptor.open(getFileFrom(uri), getFileMode(mode));
	}

	@Override
	public Cursor query(Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder) {
		File file = getFileFrom(uri);
		if (file == null) {
			return null;
		}

		final String[] columns = { OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE };
		if (projection == null) {
			projection = columns;
		}

		String[] cols = new String[projection.length];
		Object[] values = new Object[projection.length];
		int i = 0;
		for (String col: projection) {
			if (OpenableColumns.DISPLAY_NAME.equals(col)) {
				cols[i] = OpenableColumns.DISPLAY_NAME;
				values[i++] = file.getName();
			} else if (OpenableColumns.SIZE.equals(col)) {
				cols[i] = OpenableColumns.SIZE;
				values[i++] = file.length();
			}
		}

		cols = copyOf(cols, i);
		values = copyOf(values, i);

		final MatrixCursor cursor = new MatrixCursor(cols, 1);
		cursor.addRow(values);
		return cursor;
	}

	@Override
	public int update(Uri uri, ContentValues values, String selection, String[] selectionArgs) {
		throw new UnsupportedOperationException("No external updates");
	}

	private static String[] copyOf(String[] original, int newLength) {
		final String[] result = new String[newLength];
		System.arraycopy(original, 0, result, 0, newLength);
		return result;
	}

	private static Object[] copyOf(Object[] original, int newLength) {
		final Object[] result = new Object[newLength];
		System.arraycopy(original, 0, result, 0, newLength);
		return result;
	}
	
	private static File getFileFrom(Uri uri) {
		if (uri == null) {
			return null;
		}
		String uriPath = uri.toString();
		String uriPrefix = getUriPrefix();
		if (uriPrefix != null && uriPath.startsWith(uriPrefix)) {
			uriPath = uriPath.substring(uriPrefix.length());
			return new File(uriPath);
		}
		return null;
	}
	
	private static int getFileMode(String mode) {
		if ("w".equals(mode) || "wt".equals(mode)) {
			return ParcelFileDescriptor.MODE_WRITE_ONLY
					| ParcelFileDescriptor.MODE_CREATE
					| ParcelFileDescriptor.MODE_TRUNCATE;
		} else if ("wa".equals(mode)) {
			return ParcelFileDescriptor.MODE_WRITE_ONLY
					| ParcelFileDescriptor.MODE_CREATE
					| ParcelFileDescriptor.MODE_APPEND;
		} else if ("rw".equals(mode)) {
			return ParcelFileDescriptor.MODE_READ_WRITE
					| ParcelFileDescriptor.MODE_CREATE;
		} else if ("rwt".equals(mode)) {
			return ParcelFileDescriptor.MODE_READ_WRITE
					| ParcelFileDescriptor.MODE_CREATE
					| ParcelFileDescriptor.MODE_TRUNCATE;
		} else {
			return ParcelFileDescriptor.MODE_READ_ONLY;
		}
	}

	private static String getUriPrefix() {
		final TiApplication tiApp = TiApplication.getInstance();
		if (tiApp == null) {
			return null;
		}

		return "content://" + tiApp.getPackageName() + ".tifileprovider/filesystem";
	}
}
