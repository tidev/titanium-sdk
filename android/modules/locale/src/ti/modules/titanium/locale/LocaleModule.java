/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.locale;

import java.util.Locale;

import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiPlatformHelper;
import org.appcelerator.titanium.util.TiRHelper;

import android.telephony.PhoneNumberUtils;

@Kroll.module
public class LocaleModule extends KrollModule
{
	private static final String LCAT = "LocaleModule";
	
	public LocaleModule(TiContext tiContext)
	{
		super(tiContext);
	}
	
	@Kroll.method @Kroll.getProperty
	public String getCurrentLanguage()
	{
		return Locale.getDefault().getLanguage();
	}
	
	@Kroll.method @Kroll.getProperty
	public String getCurrentCountry()
	{
		return Locale.getDefault().getCountry();
	}
	
	@Kroll.method @Kroll.getProperty
	public String getCurrentLocale()
	{
		return TiPlatformHelper.getLocale();
	}
	
	@Kroll.method
	public String getCurrencyCode(String localeString) 
	{
		if (localeString == null) {
			return null;
		}
		Locale locale = TiPlatformHelper.getLocale(localeString);
		return TiPlatformHelper.getCurrencyCode(locale);
	}
	
	@Kroll.method
	public String getCurrencySymbol(String currencyCode)
	{
		return TiPlatformHelper.getCurrencySymbol(currencyCode);
	}
	
	@Kroll.method
	public String getLocaleCurrencySymbol(String localeString)
	{
		if (localeString == null) {
			return null;
		}
		Locale locale = TiPlatformHelper.getLocale(localeString);
		return TiPlatformHelper.getCurrencySymbol(locale);
	}
	
	@Kroll.method
	public String formatTelephoneNumber(String telephoneNumber)
	{
		return PhoneNumberUtils.formatNumber(telephoneNumber);
	}
	
	@Kroll.method @Kroll.setProperty
	public void setLanguage(String language) 
	{
		Log.w(LCAT, "Locale.setLanguage not supported for Android.");
	}

	@Kroll.method
	public String getString(KrollInvocation invocation, String key, @Kroll.argument(optional=true) String defaultValue)
	{
		try {
			return invocation.getTiContext().getActivity().getString(TiRHelper.getResource("string." + key));
		} catch (TiRHelper.ResourceNotFoundException e) {
			return defaultValue;
		}
	}
}
