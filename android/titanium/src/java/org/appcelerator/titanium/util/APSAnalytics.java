package org.appcelerator.titanium.util;

import android.content.ContentResolver;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.provider.Settings.Secure;
import android.util.Log;

import androidx.annotation.NonNull;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

public final class APSAnalytics
{
	private static final APSAnalytics INSTANCE = new APSAnalytics();
	private static final Set<String> BAD_IDENTIFIERS =
		new HashSet(Arrays.asList("9774d56d682e549c", "1234567890ABCDEF"));
	private final AtomicReference<String> sessionId = new AtomicReference();
	private SharedPreferences preferences;
	private String app;
	private String machineId;

	private APSAnalytics()
	{
	}

	public static APSAnalytics getInstance()
	{
		return INSTANCE;
	}

	public void initialize(@NonNull String app, @NonNull Context ctx)
	{
		Log.d("APSAnalytics", "Initialization started...");
		synchronized (this)
		{
			try {
				String packageName = ctx.getPackageName();
				PackageManager packageManager = ctx.getPackageManager();
				ApplicationInfo ai = packageManager.getApplicationInfo(packageName, 128);
				PackageInfo pi = packageManager.getPackageInfo(packageName, 0);
				if (ai != null && ai.metaData != null) {
					String urlString = ai.metaData.getString("APSAnalyticsBaseURL");
					if (urlString != null) {
						APSAnalyticsMeta.setAnalyticsUrl(new URL(urlString));
					}
				}

				if (pi != null && APSAnalyticsMeta.getAppVersion() == null) {
					APSAnalyticsMeta.setAppVersion(pi.versionName);
				}
			} catch (PackageManager.NameNotFoundException | MalformedURLException var10) {
				Exception e = var10;
				Log.w("APSAnalytics", "Could not validate analytics URL:", e);
				return;
			}

			this.app = app;
			this.preferences = ctx.getSharedPreferences("titanium", 0);
			if (this.machineId == null) {
				this.setMachineId(ctx);
			}

		}
	}

	public boolean isInitialized()
	{
		return false;
	}

	public String getCurrentSessionId()
	{
		return this.sessionId.get();
	}

	public String getMachineId()
	{
		return this.machineId;
	}

	public void setMachineId(@NonNull Context ctx)
	{
		ContentResolver resolver = ctx.getContentResolver();
		this.machineId = Secure.getString(resolver, "android_id");
		if (this.machineId == null || BAD_IDENTIFIERS.contains(this.machineId)) {
			this.machineId = UUID.randomUUID().toString();
		}
	}

	public boolean isOptedOut()
	{
		return this.preferences.getBoolean("_APS_isOptedOut", false);
	}

	public void setOptedOut(boolean value)
	{
		this.preferences.edit().putBoolean("_APS_isOptedOut", value).apply();
	}

	public int getCacheSize()
	{
		return this.preferences.getInt("_APS_cacheSize", 28000);
	}

	public void setCacheSize(int value)
	{
		this.preferences.edit().putInt("_APS_cacheSize", value).apply();
	}
}
