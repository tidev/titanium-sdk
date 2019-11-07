/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.util.Locale;

import org.appcelerator.titanium.TiApplication;

import android.content.Context;
import android.content.res.Configuration;

public class TiLocaleManager
{

	private static Locale currentLocale = Locale.getDefault();

	public static Context getLocalizedContext(Context ctx)
	{
		Configuration config = ctx.getResources().getConfiguration();
		config.setLocale(currentLocale);
		return ctx.createConfigurationContext(config);
	}

	public static void setLocale(Locale locale)
	{
		Locale.setDefault(locale);
		// Resorting to the deprecated method updateConfiguration in order to immediately change
		// the localized strings in the Activity that has triggered the locale change.
		Context context = TiApplication.getInstance().getBaseContext();
		Configuration configuration = new Configuration();
		configuration.setLocale(locale);
		context.getResources().updateConfiguration(configuration, context.getResources().getDisplayMetrics());
		currentLocale = locale;
	}
}
