package ti.modules.titanium.android;

import android.annotation.TargetApi;

import androidx.core.os.LocaleListCompat;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;

import java.util.Iterator;
import java.util.Locale;

@Kroll.module(parentModule = AndroidModule.class)
public class AppCompatDelegateModule extends KrollModule
{
	private static final String TAG = "TiAndroid";

	@Kroll.method
	public void setDefaultNightMode(@Kroll.argument int mode)
	{
		androidx.appcompat.app.AppCompatDelegate.setDefaultNightMode(mode);
	}

	@Kroll.method
	public int getDefaultNightMode()
	{
		return androidx.appcompat.app.AppCompatDelegate.getDefaultNightMode();
	}

	@Kroll.method
	public boolean isCompatVectorFromResourcesEnabled()
	{
		return androidx.appcompat.app.AppCompatDelegate.isCompatVectorFromResourcesEnabled();
	}

	@Kroll.method
	public void setCompatVectorFromResourcesEnabled(@Kroll.argument boolean enabled)
	{
		androidx.appcompat.app.AppCompatDelegate.setCompatVectorFromResourcesEnabled(enabled);
	}

	@TargetApi(33)
	@Kroll.method
	public void setApplicationLocales(String locales)
	{
		LocaleListCompat appLocale = LocaleListCompat.forLanguageTags(locales);
		androidx.appcompat.app.AppCompatDelegate.setApplicationLocales(appLocale);
	}

	@TargetApi(33)
	@Kroll.method
	public KrollDict[] getApplicationLocales()
	{
		LocaleListCompat localeListCompat = androidx.appcompat.app.AppCompatDelegate.getApplicationLocales();
		int size = localeListCompat.size();
		KrollDict[] locales = new KrollDict[size];
		for (int i = 0; i < size; i++) {
			Locale locale = localeListCompat.get(i);
			if (locale != null) {
				KrollDict localeObj = new KrollDict();
				localeObj.put("country", locale.getCountry());
				localeObj.put("iso3_country", locale.getISO3Country());
				localeObj.put("display_country", locale.getDisplayCountry());
				localeObj.put("language", locale.getLanguage());
				localeObj.put("iso3_language", locale.getISO3Language());
				localeObj.put("display_language", locale.getDisplayLanguage());
				localeObj.put("variant", locale.getVariant());
				localeObj.put("display_variant", locale.getDisplayVariant());
				localeObj.put("script", locale.getScript());
				localeObj.put("display_script", locale.getDisplayScript());
				localeObj.put("display_name", locale.getDisplayName());
				localeObj.put("language_tag", locale.toLanguageTag());
				Character[] extensionKeys = new Character[locale.getExtensionKeys().size()];
				String[] extensions = new String[locale.getExtensionKeys().size()];
				Iterator<Character> extensionKeysSize = locale.getExtensionKeys().iterator();
				int l = 0;
				while (extensionKeysSize.hasNext()) {
					extensionKeys[l] = extensionKeysSize.next();
					extensions[l] = locale.getExtension(extensionKeys[l]);
					l++;
				}
				localeObj.put("extension_keys", extensionKeys);
				localeObj.put("extensions", extensions);
				locales[i] = localeObj;
			} else {
				locales[i] = null;
			}
		}
		return locales;
	}
}
