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
	private Collator caseCollator;
	private KrollDict resolvedOptions = new KrollDict();

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
		this.caseCollator = null;
		String sensitivityTypeId = TiConvert.toString(options.get("sensitivity"), "variant");
		switch (sensitivityTypeId) {
			case "accent":
				strengthId = Collator.SECONDARY;
				break;
			case "base":
				strengthId = Collator.PRIMARY;
				break;
			case "case":
				// This requires special handling since Java class does not have an equivalent option.
				// - Use PRIMARY strength so that similar accent characters will match.
				// - Then use separate case-sensitive collator to be used after stripping out accent chars.
				strengthId = Collator.PRIMARY;
				this.caseCollator = Collator.getInstance(locale);
				this.caseCollator.setStrength(Collator.IDENTICAL);
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
		this.resolvedOptions.putAll(options);
		this.resolvedOptions.put(TiC.PROPERTY_LOCALE, locale.toString().replace("_", "-"));
	}

	@Kroll.method
	public int compare(String string1, String string2)
	{
		// Compare strings used main collator.
		int result = this.collator.compare(string1, string2);

		// If using sensitivity "case", then strip out accent characters and do case-sensitive comparison.
		if ((this.caseCollator != null) && (result == 0)) {
			string1 = stripAccents(string1);
			string2 = stripAccents(string2);
			result = this.caseCollator.compare(string1, string2);
		}

		// Return the result.
		return result;
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
