/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.locale;

import java.util.Locale;
import java.text.NumberFormat;

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

	@Kroll.method
	@Kroll.getProperty
	public String getCurrentLanguage()
	{
		return Locale.getDefault().getLanguage();
	}

	@Kroll.method
	@Kroll.getProperty
	public String getCurrentCountry()
	{
		return Locale.getDefault().getCountry();
	}

	@Kroll.method
	@Kroll.getProperty
	public String getCurrentLocale()
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

	@Kroll.method
	public double parseDecimal(String text, @Kroll.argument(optional = true) String localeString)
	{
		double result = Double.NaN;
		try {
			// Create a number format parser using given locale if provided or current locale.
			Locale locale = TiPlatformHelper.getInstance().getLocale(localeString);
			NumberFormat numberFormat;
			if (locale != null) {
				numberFormat = NumberFormat.getInstance(locale);
			} else {
				numberFormat = NumberFormat.getInstance();
			}

			// Enable thousands separator parsing support. (ex: "1,234,567")
			numberFormat.setGroupingUsed(true);

			// Remove leading spaces and plus sign. Number format will fail to parse if there.
			text = text.trim();
			if ((text != null) && text.startsWith("+")) {
				text = text.substring(1);
			}

			// Attempt to parse a decimal value from given string.
			Number number = numberFormat.parse(text);
			if (number != null) {
				result = number.doubleValue();
			}
		} catch (Exception ex) {
		}
		return result;
	}

	@Kroll.method
	@Kroll.setProperty
	public void setLanguage(String language)
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

	@Kroll.method
	@Kroll.topLevel("L")
	public String getString(String key, @Kroll.argument(optional = true) String defaultValue)
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
