package ti.modules.titanium.media.android;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.kroll.KrollCallback;
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
	public AndroidModule(TiContext context)
	{
		super(context);
	}

	@Kroll.method
	public void scanMediaFiles(KrollInvocation invocation, Object[] paths, Object[] mimeTypes, KrollCallback callback)
	{
		(new MediaScannerClient(invocation.getTiContext(), paths, mimeTypes, callback)).scan();
	}
	@Kroll.method
	public void setSystemWallpaper(KrollInvocation invocation, TiBlob image, boolean scale)
	{
		Context ctx = invocation.getActivity();
		WallpaperManager wm = WallpaperManager.getInstance(ctx);
		TiDrawableReference ref = TiDrawableReference.fromBlob(invocation.getTiContext(), image);
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
		private TiContext context;
		private Object[] paths;
		private Object[] mimeTypes;
		private KrollCallback callback;
		private MediaScannerConnection connection;
		private AtomicInteger completedScanCount = new AtomicInteger(0);

		MediaScannerClient(TiContext context, Object[] paths, Object[] mimeTypes, KrollCallback callback)
		{
			this.context = context;
			this.paths = paths;
			this.mimeTypes = mimeTypes;
			this.callback = callback;
		}

		public MediaScannerClient(TiContext context, Object[] paths, Object[] mimeTypes)
		{
			this.context = context;
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
				String path = context.resolveUrl(TiConvert.toString(paths[i]));
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
				callback.callAsync(properties);
			}
		}
		public void scan()
		{
			if (paths == null || paths.length == 0) {
				return;
			}
			connection = new MediaScannerConnection(context.getAndroidContext(), this);
			connection.connect();
		}
	}
}
