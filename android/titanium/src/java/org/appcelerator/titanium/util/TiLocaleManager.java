/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import android.app.LocaleManager;
import android.content.res.Configuration;
import android.content.res.Resources;
import android.os.Build;

import androidx.appcompat.app.AppCompatDelegate;
import androidx.core.os.LocaleListCompat;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.common.TiMessenger;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;

import java.util.Locale;

public class TiLocaleManager
{
	private static boolean didUserChangeLanguage = false;
	private static final boolean isPerAppLanguageSupported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU;
	public static Locale systemLocale = getSystemLocale(); // Always keeps the system locale updated.
	private static final String KEY_LOCALE = "currentLocale";

	/**
	 * Returns the application's configured locale if set.
	 */
	private static String getAppLocaleFromProperties()
	{
		try {
			return TiApplication.getInstance().getAppProperties().getString(KEY_LOCALE, null);
		} catch (Exception ignoredException) {
			return null;
		}
	}

	/**
	 * Returns the current locale set on the device, could be different than the app's one.
	 * Retrieving the system locale approach changed in API 33 or above.
	 */
	public static Locale getSystemLocale()
	{
		try {
			if (isPerAppLanguageSupported) {
				LocaleManager lm = TiApplication.getInstance().getBaseContext().getSystemService(LocaleManager.class);
				return lm.getSystemLocales().get(0);
			} else {
				if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
					return Resources.getSystem().getConfiguration().getLocales().get(0);
				}

				return Locale.getDefault();
			}
		} catch (Exception ignoredException) {
			return Locale.getDefault();
		}
	}

	/**
	 * Configure locale at app startup for API ≤ 32. Must be called from TiApplication.onCreate() only.
	 */
	public static void init()
	{
		if (isPerAppLanguageSupported) {
			return;
		}

		String appSavedLocale = getAppLocaleFromProperties();
		if (appSavedLocale == null) {
			return;
		}

		setLocaleForPreApi33(Locale.forLanguageTag(appSavedLocale), false);
	}

	private static void setLocaleForApi33(Locale locale)
	{
		// Skip if the requested language is already set.
		Locale previousLocale = AppCompatDelegate.getApplicationLocales().get(0);
		if (previousLocale != null && previousLocale.getLanguage().equals(locale.getLanguage())) {
			return;
		}

		// This will trigger & receive updates via the `onSystemLocaleChanged` route.
		didUserChangeLanguage = true;
		LocaleListCompat appLocales = LocaleListCompat.forLanguageTags(locale.toLanguageTag());
		AppCompatDelegate.setApplicationLocales(appLocales);
	}

	private static void setLocaleForPreApi33(Locale locale, boolean shouldRestartApp)
	{
		Locale.setDefault(locale);

		Resources resources = TiApplication.getInstance().getBaseContext().getResources();
		Configuration configuration = resources.getConfiguration();

		configuration.setLocale(locale);
		resources.updateConfiguration(configuration, resources.getDisplayMetrics());

		if (shouldRestartApp) {
			softRestartAppIfNeeded();
		}
	}

	private static void softRestartAppIfNeeded()
	{
		final KrollModule localeModule = TiApplication.getInstance().getModuleByName("Locale");
		boolean hasLocaleChangeListener = localeModule.hasListeners(TiC.EVENT_CHANGE);

		if (hasLocaleChangeListener) {
			localeModule.fireEvent(TiC.EVENT_CHANGE, null);
		} else {
			TiMessenger.postOnMain(new Runnable() {
				@Override
				public void run()
				{
					TiApplication.getInstance().softRestart();
				}
			});
		}
	}

	public static void handleSystemLocaleUpdates()
	{
		systemLocale = getSystemLocale();

		// Handle user initiated language changes.
		if (didUserChangeLanguage) {
			didUserChangeLanguage = false;
			softRestartAppIfNeeded();
			return;
		}

		// System language changes onwards.
		if (isPerAppLanguageSupported) {
			// OS force destroys the activities, leaving the app hard to fully recover safely.
			// The safest way is to hard-restart the app to properly initialize the Kroll and JS Runtime.
			TiApplication.getInstance().relaunchApp();
			return;
		}

		// System resets the language for the application, restore the user selected one if set.
		String appSavedLocale = getAppLocaleFromProperties();
		Locale locale = appSavedLocale == null ? systemLocale : Locale.forLanguageTag(appSavedLocale);
		setLocaleForPreApi33(locale, true);
	}

	/**
	 * To change app's locale to a custom one, overriding system locale until reset.
	 */
	public static void setLocale(Locale locale)
	{
		TiApplication.getInstance().getAppProperties().setString(KEY_LOCALE, locale.toLanguageTag());

		if (isPerAppLanguageSupported) {
			setLocaleForApi33(locale);
		} else {
			setLocaleForPreApi33(locale, true);
		}
	}
}
