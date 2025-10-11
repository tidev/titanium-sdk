package org.appcelerator.titanium.util;

import android.content.ContentResolver;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.provider.Settings.Secure;

import androidx.annotation.NonNull;

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
		try {
			String packageName = ctx.getPackageName();
			PackageManager packageManager = ctx.getPackageManager();
			ApplicationInfo ai = packageManager.getApplicationInfo(packageName, 128);
			PackageInfo pi = packageManager.getPackageInfo(packageName, 0);

			if (pi != null && APSAnalyticsMeta.getAppVersion() == null) {
				APSAnalyticsMeta.setAppVersion(pi.versionName);
			}
		} catch (PackageManager.NameNotFoundException _ex) {
			return;
		}

		if (this.machineId == null) {
			this.setMachineId(ctx);
		}
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
}
