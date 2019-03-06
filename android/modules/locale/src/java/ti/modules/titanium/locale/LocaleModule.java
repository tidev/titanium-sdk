/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.locale;

import java.util.Locale;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.util.TiLocaleManager;
import org.appcelerator.titanium.util.TiPlatformHelper;
import org.appcelerator.titanium.util.TiRHelper;

import android.telephony.PhoneNumberUtils;

@Kroll.module
public class LocaleModule extends KrollModule
{
	private static final String TAG = "LocaleModule";

	public LocaleModule()
	{
		super("Locale");
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getCurrentLanguage()
	// clang-format on
	{
		return Locale.getDefault().getLanguage();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getCurrentCountry()
	// clang-format on
	{
		return Locale.getDefault().getCountry();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getCurrentLocale()
	// clang-format on
	{
		return TiPlatformHelper.getInstance().getLocale();
	}

	@Kroll.method
	public String getCurrencyCode(String localeString)
	{
		if (localeString == null) {
			return null;
		}
		Locale locale = TiPlatformHelper.getInstance().getLocale(localeString);
		return TiPlatformHelper.getInstance().getCurrencyCode(locale);
	}

	@Kroll.method
	public String getCurrencySymbol(String currencyCode)
	{
		return TiPlatformHelper.getInstance().getCurrencySymbol(currencyCode);
	}

	@Kroll.method
	public String getLocaleCurrencySymbol(String localeString)
	{
		if (localeString == null) {
			return null;
		}
		Locale locale = TiPlatformHelper.getInstance().getLocale(localeString);
		return TiPlatformHelper.getInstance().getCurrencySymbol(locale);
	}

	@SuppressWarnings("deprecation")
	@Kroll.method
	public String formatTelephoneNumber(String telephoneNumber)
	{
		return PhoneNumberUtils.formatNumber(telephoneNumber);
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setLanguage(String language)
	// clang-format on
	{
		try {
			String[] parts = language.split("-");
			Locale locale = null;

			if (parts.length > 1) {
				locale = new Locale(parts[0], parts[1]);
			} else {
				locale = new Locale(parts[0]);
			}

			TiLocaleManager.setLocale(locale);

		} catch (Exception e) {
			Log.e(TAG, "Error trying to set language '" + language + "':", e);
		}
	}

	// clang-format off
	@Kroll.method
	@Kroll.topLevel("L")
	public String getString(String key, @Kroll.argument(optional = true) String defaultValue)
	// clang-format on
	{
		if (defaultValue == null) {
			defaultValue = key;
		}

		try {
			int resid = TiRHelper.getResource("string." + key.replace(".", "_"));
			if (resid != 0) {
				return TiApplication.getInstance().getString(resid);
			} else {
				return defaultValue;
			}
		} catch (TiRHelper.ResourceNotFoundException e) {
			Log.d(TAG, "Resource string with key '" + key + "' not found.  Returning default value.", Log.DEBUG_MODE);
			return defaultValue;
		} catch (Exception e) {
			Log.e(TAG, "Error trying to get resource string with key '" + key + "':", e);
			return defaultValue;
		}
	}

	@Override
	public String getApiName()
	{
		return "Ti.Locale";
	}
}
