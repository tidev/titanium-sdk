package ti.modules.titanium.media.android;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiDrawableReference;

import ti.modules.titanium.media.MediaModule;
import android.app.WallpaperManager;
import android.content.Context;
import android.graphics.Bitmap;
import android.media.MediaScannerConnection;
import android.media.MediaScannerConnection.MediaScannerConnectionClient;
import android.net.Uri;

@Kroll.module(parentModule=MediaModule.class)
public class AndroidModule extends KrollModule
{
	private static final String LCAT = "TiMedia.Android";

	@Kroll.method
	public void scanMediaFiles(Object[] paths, Object[] mimeTypes, KrollFunction callback)
	{
		String mediaPaths[] = new String[paths.length];
		for (int i = 0; i < paths.length; i++) {
			mediaPaths[i] = resolveUrl(null, TiConvert.toString(paths[i]));
		}

		(new MediaScannerClient(mediaPaths, mimeTypes, callback)).scan();
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
				Log.e(LCAT, "Unable to set wallpaper bitmap", e);
			}
		} else {
			Log.w(LCAT, "Unable to get bitmap to set wallpaper");
		}
	}

	public static class MediaScannerClient implements MediaScannerConnectionClient
	{
		private String[] paths;
		private Object[] mimeTypes;
		private KrollFunction callback;
		private MediaScannerConnection connection;
		private AtomicInteger completedScanCount = new AtomicInteger(0);

		public MediaScannerClient(String[] paths, Object[] mimeTypes, KrollFunction callback)
		{
			this.paths = paths;
			this.mimeTypes = mimeTypes;
			this.callback = callback;
		}

		public MediaScannerClient(String[] paths, Object[] mimeTypes)
		{
			this.paths = paths;
			this.mimeTypes = mimeTypes;
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
				((KrollObject) callback).callAsync(callback, new Object[] { properties });
			}
		}

		public void scan()
		{
			if (paths == null || paths.length == 0) {
				return;
			}
			connection = new MediaScannerConnection(TiApplication.getInstance().getCurrentActivity(), this);
			connection.connect();
		}
	}
}
