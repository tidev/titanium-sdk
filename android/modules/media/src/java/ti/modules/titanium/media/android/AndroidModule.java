/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media.android;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiDrawableReference;

import ti.modules.titanium.media.MediaModule;
import android.app.Activity;
import android.app.WallpaperManager;
import android.content.Context;
import android.graphics.Bitmap;
import android.media.MediaScannerConnection;
import android.media.MediaScannerConnection.MediaScannerConnectionClient;
import android.net.Uri;

@Kroll.module(parentModule=MediaModule.class)
public class AndroidModule extends KrollModule
{
	private static final String TAG = "TiMedia.Android";

	protected static AndroidModule _instance = null;


	public AndroidModule()
	{
		super();
		_instance = this;
	}

	public AndroidModule(TiContext tiContext)
	{
		this();
	}

	@Kroll.method
	public void scanMediaFiles(Object[] paths, Object[] mimeTypes, KrollFunction callback)
	{
		String mediaPaths[] = new String[paths.length];
		for (int i = 0; i < paths.length; i++) {
			mediaPaths[i] = resolveUrl(null, TiConvert.toString(paths[i]));
		}

		Activity activity = TiApplication.getInstance().getCurrentActivity();
		(new MediaScannerClient(activity, mediaPaths, mimeTypes, callback)).scan();
	}

	@Kroll.method
	public void setSystemWallpaper(TiBlob image, boolean scale)
	{
		Context ctx = TiApplication.getInstance().getCurrentActivity();
		WallpaperManager wm = WallpaperManager.getInstance(ctx);
		TiDrawableReference ref = TiDrawableReference.fromBlob(getActivity(), image);
		Bitmap b = null;
		if (scale) {
			b = ref.getBitmap(wm.getDesiredMinimumWidth());
		} else {
			b = ref.getBitmap();
		}
		if (b != null) {
			try {
				wm.setBitmap(b);
			} catch (IOException e) {
				Log.e(TAG, "Unable to set wallpaper bitmap", e);
			}
		} else {
			Log.w(TAG, "Unable to get bitmap to set wallpaper");
		}
	}

	public static class MediaScannerClient implements MediaScannerConnectionClient
	{
		private String[] paths;
		private Object[] mimeTypes;
		private KrollFunction callback;
		private MediaScannerConnection connection;
		private AtomicInteger completedScanCount = new AtomicInteger(0);
		private Activity activity;

		public MediaScannerClient(Activity activity, String[] paths, Object[] mimeTypes, KrollFunction callback)
		{
			this.activity = activity;
			this.paths = paths;
			this.mimeTypes = mimeTypes;
			this.callback = callback;
		}

		public MediaScannerClient(TiContext tiContext, String[] paths, Object[] mimeTypes, KrollFunction callback)
		{
			this(tiContext.getActivity(), paths, mimeTypes, callback);
		}

		public MediaScannerClient(TiContext tiContext, String[] paths, Object[] mimeTypes)
		{
			this(tiContext, paths, mimeTypes, null);
		}

		@Override
		public void onMediaScannerConnected()
		{
			if (paths == null || paths.length == 0){
				connection.disconnect();
				return;
			}
			for (int i = 0; i < paths.length; i++) {
				String path = paths[i];
				if (path.startsWith("file://")) {
					path = path.substring("file://".length()); // the service doesn't like file://
				}
				String mimeType = null;
				if (mimeTypes != null && mimeTypes.length > i){
					mimeType = TiConvert.toString(mimeTypes[i]);
				}
				connection.scanFile(path, mimeType);
			}
		}
		@Override
		public void onScanCompleted(String path, Uri uri)
		{
			if (completedScanCount.incrementAndGet() >= paths.length) {
				connection.disconnect();
			}

			if (callback != null) {
				KrollDict properties = new KrollDict(2);
				properties.put("path", path);
				properties.put("uri", uri == null ? null : uri.toString());
				callback.callAsync(AndroidModule._instance.getKrollObject(), new Object[] { properties });
			}
		}

		public void scan()
		{
			if (paths == null || paths.length == 0) {
				return;
			}

			connection = new MediaScannerConnection(activity, this);
			connection.connect();
		}
	}
}
