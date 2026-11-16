package org.appcelerator.titanium.util;

import android.annotation.SuppressLint;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Build;
import android.os.Build.VERSION;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public final class TiSessionMeta
{
	private static final String TAG = "TiSessionMeta";
	private static String appId;
	private static String appName;
	private static String appVersion;
	private static String deployType;
	private static String sdkVersion;

	public TiSessionMeta()
	{
	}

	@NonNull
	public static String getArchitecture()
	{
		return Build.SUPPORTED_ABIS.length > 0 ? Build.SUPPORTED_ABIS[0] : "unknown";
	}

	@Nullable
	public static String getAppId()
	{
		return appId;
	}

	public static void setAppId(String newAppId)
	{
		appId = newAppId;
	}

	@Nullable
	public static String getAppName()
	{
		return appName;
	}

	public static void setAppName(String newAppName)
	{
		appName = newAppName;
	}

	@Nullable
	public static String getAppVersion()
	{
		return appVersion;
	}

	public static void setAppVersion(String newAppVersion)
	{
		appVersion = newAppVersion;
	}

	@Nullable
	public static String getDeployType()
	{
		return deployType;
	}

	public static void setDeployType(String newDeployType)
	{
		deployType = newDeployType;
	}

	@NonNull
	public static String getModel()
	{
		return Build.MODEL;
	}

	@NonNull
	@SuppressLint({ "MissingPermission" })
	public static String getNetworkType(@NonNull ConnectivityManager connectivityManager)
	{
		int type = -1;

		try {
			NetworkInfo ni = connectivityManager.getActiveNetworkInfo();
			if (ni != null && ni.isAvailable() && ni.isConnected()) {
				type = ni.getType();
			} else {
				type = -2;
			}
		} catch (SecurityException var3) {
		}

		switch (type) {
			case -1:
				return "NONE";
			case 0:
				return "MOBILE";
			case 1:
				return "WIFI";
			case 2:
				return "MOBILE_MMS";
			case 3:
				return "MOBILE_SUPL";
			case 4:
				return "MOBILE_DUN";
			case 5:
				return "MOBILE_HIPRI";
			case 6:
				return "WIMAX";
			case 7:
				return "BLUETOOTH";
			case 8:
				return "DUMMY";
			case 9:
				return "ETHERNET";
			case 10:
			case 11:
			case 12:
			case 13:
			case 14:
			case 15:
			case 16:
			default:
				return "UNKNOWN";
			case 17:
				return "VPN";
		}
	}

	@NonNull
	public static String getOsType()
	{
		return Build.SUPPORTED_64_BIT_ABIS.length <= 0 ? "32bit" : "64bit";
	}

	@NonNull
	public static String getOsVersion()
	{
		return VERSION.RELEASE;
	}

	@NonNull
	public static String getPlatform()
	{
		return "android";
	}

	public static int getProcessorCount()
	{
		return Runtime.getRuntime().availableProcessors();
	}

	@Nullable
	public static String getSdkVersion()
	{
		return sdkVersion;
	}

	public static void setSdkVersion(String newSdkVersion)
	{
		sdkVersion = newSdkVersion;
	}
}

