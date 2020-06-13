/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.locale;

import java.text.Collator;
import java.text.Normalizer;
import java.util.Locale;
import java.util.Map;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiPlatformHelper;

/**
 * Implements the JavaScript "Intl.Collator" type.
 * Used to do localized string compares/sorts.
 */
@Kroll.proxy(creatableInModule = LocaleModule.class)
public class CollatorProxy extends KrollProxy
{
	private static final String TAG = "CollatorProxy";

	private Collator collator = Collator.getInstance();
	private KrollDict resolvedOptions = new KrollDict();
	private boolean isStrippingAccents;

	@Override
	public void handleCreationDict(KrollDict properties)
	{
		super.handleCreationDict(properties);

		// Fetch the optional "locale" and "options" properties.
		Locale locale = null;
		Map options = null;
		if (properties != null) {
			Object value = properties.get(TiC.PROPERTY_LOCALE);
			if (value instanceof String) {
				locale = TiPlatformHelper.getInstance().getLocale((String) value);
			}
			value = properties.get(TiC.PROPERTY_OPTIONS);
			if (value instanceof Map) {
				options = (Map) value;
			}
		}
		if (locale == null) {
			locale = Locale.getDefault();
		}
		if (options == null) {
			options = new KrollDict();
		}

		// Determine the collatior setting we need to use.
		int strengthId;
		int decompositionId = Collator.CANONICAL_DECOMPOSITION;
		this.isStrippingAccents = false;
		String sensitivityTypeId = TiConvert.toString(options.get("sensitivity"), "variant");
		switch (sensitivityTypeId) {
			case "accent":
				strengthId = Collator.SECONDARY;
				break;
			case "base":
				strengthId = Collator.PRIMARY;
				break;
			case "case":
				strengthId = Collator.IDENTICAL;
				this.isStrippingAccents = true;
				break;
			case "variant":
			default:
				strengthId = Collator.IDENTICAL;
				decompositionId = Collator.NO_DECOMPOSITION;
				break;
		}

		// Configure a new collator.
		this.collator = Collator.getInstance(locale);
		this.collator.setStrength(strengthId);
		this.collator.setDecomposition(decompositionId);

		// Store locale and options settings to be returned by this class' resolvedOptions() method.
		this.resolvedOptions = new KrollDict();
		this.resolvedOptions.put("usage", "sort");
		this.resolvedOptions.put("ignorePunctuation", false);
		this.resolvedOptions.put("numeric", false);
		this.resolvedOptions.put("caseFirst", "false");
		this.resolvedOptions.put("sensitivity", sensitivityTypeId);
		this.resolvedOptions.putAll(options);
		this.resolvedOptions.put(TiC.PROPERTY_LOCALE, locale.toString().replace("_", "-"));
	}

	@Kroll.method
	public int compare(String string1, String string2)
	{
		// If comparing by "case", replace accented chars with non-accented chars so they'll be treated the same.
		if (this.isStrippingAccents) {
			string1 = stripAccents(string1);
			string2 = stripAccents(string2);
		}

		// Compare strings using collator.
		return this.collator.compare(string1, string2);
	}

	@Kroll.method
	public KrollDict resolvedOptions()
	{
		return this.resolvedOptions;
	}

	private String stripAccents(String text)
	{
		if (text != null) {
			text = Normalizer.normalize(text, Normalizer.Form.NFD);
			text = text.replaceAll("[\\p{InCombiningDiacriticalMarks}]", "");
		}
		return text;
	}

	@Override
	public String getApiName()
	{
		return "Ti.Locale.Collator";
	}
}
