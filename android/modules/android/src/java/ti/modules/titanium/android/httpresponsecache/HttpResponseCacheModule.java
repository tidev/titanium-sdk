package ti.modules.titanium.android.httpresponsecache;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;

import ti.modules.titanium.android.AndroidModule;
import android.app.Activity;
import android.app.Notification;
import android.net.http.HttpResponseCache;

import java.io.File;
import java.io.IOException;

@Kroll.module(parentModule = AndroidModule.class)
public class HttpResponseCacheModule extends KrollModule
{
	private static final String CACHE_SIZE_KEY = "ti.android.cache.size.max";
	private static final int DEFAULT_CACHE_SIZE = 25 * 1024; // 25MB

	private String httpCachePath;
	private long httpCacheSize;

	public HttpResponseCacheModule()
	{
		super();
		httpCachePath = "http";
		httpCacheSize =
			TiApplication.getInstance().getAppProperties().getInt(CACHE_SIZE_KEY, DEFAULT_CACHE_SIZE) * 1024;
	}

	@Kroll.method
	public void install() throws IOException
	{
		HttpResponseCache cache = HttpResponseCache.getInstalled();
		if (cache != null) {
			cache.flush();
			cache.close();
		}
		TiApplication tiApp = TiApplication.getInstance();
		File dir = tiApp.getApplicationContext().getExternalCacheDir();
		if (dir == null) {
			dir = tiApp.getApplicationContext().getCacheDir();
		}
		File httpCacheDir = new File(dir, httpCachePath);
		cache = HttpResponseCache.install(httpCacheDir, httpCacheSize);
	}

	@Kroll.method
	public void flush()
	{
		HttpResponseCache cache = HttpResponseCache.getInstalled();
		if (cache != null) {
			cache.flush();
		}
	}

	@Kroll.method
	public void remove() throws IOException
	{
		HttpResponseCache cache = HttpResponseCache.getInstalled();
		if (cache != null) {
			cache.delete();
		}
	}

	@Kroll.method
	public void close() throws IOException
	{
		HttpResponseCache cache = HttpResponseCache.getInstalled();
		if (cache != null) {
			cache.close();
		}
	}

	@Kroll.method
	public int getHitCount()
	{
		HttpResponseCache cache = HttpResponseCache.getInstalled();
		if (cache != null) {
			return cache.getHitCount();
		}
		return 0;
	}

	@Kroll.method
	public int getNetworkCount()
	{
		HttpResponseCache cache = HttpResponseCache.getInstalled();
		if (cache != null) {
			cache.getNetworkCount();
		}
		return 0;
	}

	@Kroll.method
	public int getRequestCount()
	{
		HttpResponseCache cache = HttpResponseCache.getInstalled();
		if (cache != null) {
			return cache.getRequestCount();
		}
		return 0;
	}

	@Kroll.method
	public long size()
	{
		HttpResponseCache cache = HttpResponseCache.getInstalled();
		if (cache != null) {
			return cache.size();
		}
		return 0;
	}

	@Kroll.method
	public String getHttpCachePath()
	{
		return httpCachePath;
	}

	@Kroll.method
	public long getHttpCacheSize()
	{
		return httpCacheSize;
	}

	@Kroll.method
	public void setHttpCachePath(String value)
	{
		httpCachePath = value;
	}

	@Kroll.method
	public void setHttpCacheSize(long value)
	{
		httpCacheSize = value;
	}

	@Override
	public String getApiName()
	{
		return "Ti.Android.HttpResponseCache";
	}
}
