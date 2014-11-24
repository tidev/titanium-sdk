package ti.modules.titanium.media;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiMessenger;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;

import android.annotation.SuppressLint;
import android.content.res.AssetFileDescriptor;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Handler;
import android.os.Message;
import android.webkit.URLUtil;

public class TiThumbnailRetriever implements Handler.Callback{

	public static final int MSG_FIRST_ID = 100;
	public static final int MSG_GET_BITMAP = MSG_FIRST_ID + 1;
	public static final int MSG_LAST_ID = MSG_FIRST_ID + 2;
	private static final String TAG = "TiMediaMetadataRetriever";
	
	private Uri mUri;
	private TiMediaMetadataRetriever mTiMediaMetadataRetriever;
	private Handler runtimeHandler;
	private AsyncTask<Object, Void, Integer> task;

	public TiThumbnailRetriever() {
		runtimeHandler = new Handler(TiMessenger.getRuntimeMessenger().getLooper(), this);
	}
	
	public void setUri(Uri uri){
		this.mUri = uri;
	}
	
	public void cancelAnyRequestsAndRelease(){
		task.cancel(true);
		mTiMediaMetadataRetriever.release();
		mTiMediaMetadataRetriever = null;
	}
	
	public void getBitmap(int[] arrayOfTimes, int optionSelected, ThumbnailResponseHandler thumbnailResponseHandler)
	{
		if(mUri == null){
			KrollDict event = new KrollDict();
			event.putCodeAndMessage(TiC.ERROR_CODE_UNKNOWN, "Error getting Thumbnail. Url is null.");
			thumbnailResponseHandler.handleThumbnailResponse(event);
			return;
		}
		Message message = runtimeHandler.obtainMessage(MSG_GET_BITMAP);
		message.getData().putInt(TiC.PROPERTY_OPTIONS, optionSelected);
		message.getData().putIntArray(TiC.PROPERTY_TIME, arrayOfTimes);
		message.obj = thumbnailResponseHandler;
		message.sendToTarget();
	
	}
	
	public interface ThumbnailResponseHandler
	{
		public abstract void handleThumbnailResponse(KrollDict bitmapResponse);
	}

	@Override
	public boolean handleMessage(Message msg) 
	{
		if (msg.what == MSG_GET_BITMAP) {
			if(mTiMediaMetadataRetriever == null){
				mTiMediaMetadataRetriever = new TiMediaMetadataRetriever();
			}
			int option = msg.getData().getInt(TiC.PROPERTY_OPTIONS);
			int[] arrayOfTimes = msg.getData().getIntArray(TiC.PROPERTY_TIME);
			if(task != null){
				task.cancel(true);
			}
			task = getBitmapTask();
			task.execute(mUri, arrayOfTimes, option, msg.obj, mTiMediaMetadataRetriever);
			return true;
		}
		return false;
	}
	
	private AsyncTask<Object, Void, Integer> getBitmapTask()
	{
		task = new AsyncTask<Object, Void, Integer>() {
			@Override
			protected Integer doInBackground(Object... args) {
				ThumbnailResponseHandler mThumbnailResponseHandler = null;
				TiMediaMetadataRetriever mTiMediaMetadataRetriever = null;
				KrollDict event = null;
				Uri mUri = (Uri) args[0];
				int[] arrayOfTimes = (int[]) args [1];
				int option = (Integer) args[2];
				mThumbnailResponseHandler = (ThumbnailResponseHandler) args[3];
				mTiMediaMetadataRetriever = (TiMediaMetadataRetriever) args[4];
				
				try {	
					int response = setDataSource(mUri, mTiMediaMetadataRetriever);
					if(response < 0){
						//Setting Data Source of MediaMetadataRetriever failed
						return null;
					}

					for (int sec : arrayOfTimes){
						//If request is cancelled, do not continue with fetching thumbnail
						if(isCancelled()){
							return null;
						}
						
						Bitmap mBitmapFrame = getFrameAtTime(mUri, sec, option, mTiMediaMetadataRetriever);
						if(mBitmapFrame != null){	
							event = new KrollDict();
							event.put(TiC.PROPERTY_TIME, sec);
							event.put(TiC.ERROR_PROPERTY_CODE, TiC.ERROR_CODE_NO_ERROR);
							event.put(TiC.PROPERTY_SUCCESS, true);
							event.put(TiC.PROPERTY_IMAGE, TiBlob.blobFromImage(mBitmapFrame));
						}						
						if (mThumbnailResponseHandler != null) {
							if (event == null) {
								event = new KrollDict();
								event.putCodeAndMessage(TiC.ERROR_CODE_UNKNOWN, "Error getting Thumbnail");
							}
							mThumbnailResponseHandler.handleThumbnailResponse(event);
						}
					}
					
				} catch (Throwable t) {
					Log.e(TAG, "Error retrieving thumbnail [" + t.getMessage() + "]", t, Log.DEBUG_MODE);
				}
				return -1;
			}
			
			public Bitmap getFrameAtTime(Uri mUri, int sec, int option, TiMediaMetadataRetriever mMediaMetadataRetriever){
				if(mUri != null){
					// getFrameAtTime uses Microseconds.
					// Multiplying sec with 1000000 to get Microseconds.
					Bitmap bm = mMediaMetadataRetriever.getFrameAtTime(sec*1000000, option);
					return bm;
				}
				return null;
			}
			
			@SuppressLint("NewApi")
			private int setDataSource(Uri mUri, TiMediaMetadataRetriever mTiMediaMetadataRetriever){
				int returnCode = 0;
				if(mUri == null){
					return -1;
				}
				if(mTiMediaMetadataRetriever.isDataSourceSet()){
					// DataSource is already set. Do not set it again.
					return returnCode;
				}
				
				try {
					if (URLUtil.isAssetUrl(mUri.toString())) { // DST: 20090606 detect
																// asset url
						AssetFileDescriptor afd = null;
						try {
							String path = mUri.toString().substring("file:///android_asset/".length());
							afd = TiApplication.getAppCurrentActivity().getAssets().openFd(path);
							mTiMediaMetadataRetriever.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
						} catch (FileNotFoundException ex){
							Log.e(TAG, "Unable to open content: " + mUri, ex);			
							returnCode = -1;
						} finally {
							if (afd != null) {
								afd.close();
							}
						} 
					} else {
						if (Build.VERSION.SDK_INT < TiC.API_LEVEL_HONEYCOMB &&
								("http".equals(mUri.getScheme()) || "https".equals(mUri.getScheme()))) {
							// Using the same redirect handling as Media player
							// (Redirects work fine without this in ICS.)
							while (true) {
								// java.net.URL doesn't handle rtsp
								if (mUri.getScheme() != null && mUri.getScheme().equals("rtsp"))
									break;
								URL url = new URL(mUri.toString());
								HttpURLConnection cn = (HttpURLConnection) url.openConnection();
								cn.setInstanceFollowRedirects(false);
								String location = cn.getHeaderField("Location");
								if (location != null) {
									String host = mUri.getHost();
									int port = mUri.getPort();
									String scheme = mUri.getScheme();
									mUri = Uri.parse(location);
									if (mUri.getScheme() == null) {
										// Absolute URL on existing host/port/scheme
										if (scheme == null) {
											scheme = "http";
										}
										String authority = port == -1 ? host : host + ":" + port;
										mUri = mUri.buildUpon().scheme(scheme).encodedAuthority(authority).build();
									}
								} else {
									break;
								}
							}
						}
						if (Build.VERSION.SDK_INT >= 14){
							mTiMediaMetadataRetriever.setDataSource(mUri.toString(), new HashMap<String, String>());
						}
						else{
							mTiMediaMetadataRetriever.setDataSource(mUri.toString());
						}
					}
				} catch (IOException ex) {
					Log.e(TAG, "Unable to open content: " + mUri, ex);
					return -1;
				} catch (IllegalArgumentException ex) {
					Log.e(TAG, "Unable to open content: " + mUri, ex);
					return -1;
				}
				return returnCode;
			}
		};
		return task;
	}
	


}
