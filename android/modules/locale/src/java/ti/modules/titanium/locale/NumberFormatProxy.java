/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.locale;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.text.FieldPosition;
import java.text.Format;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.Currency;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiPlatformHelper;

/**
 * Implements the JavaScript "Intl.NumberFormat" type.
 * Used to generate localized numeric values.
 */
@Kroll.proxy(creatableInModule = LocaleModule.class)
public class NumberFormatProxy extends KrollProxy
{
	private static final String TAG = "NumberFormatProxy";

	private NumberFormat numberFormat = NumberFormat.getInstance();
	private MathContext maxSignificantDigitsContext;
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

		// Create a format object based on given "style" option.
		String styleStringId = TiConvert.toString(options.get("style"), "decimal");
		switch (styleStringId) {
			case "currency": {
				this.numberFormat = NumberFormat.getCurrencyInstance(locale);
				String currencyStringCode = TiConvert.toString(options.get("currency"), null);
				if (currencyStringCode != null) {
					this.numberFormat.setCurrency(Currency.getInstance(currencyStringCode));
				}
				break;
			}
			case "percent":
				this.numberFormat = NumberFormat.getPercentInstance(locale);
				break;
			default:
				this.numberFormat = NumberFormat.getInstance(locale);
				break;
		}

		// Round positive numbers towards positive infinity and negative numbers towards negative infinity.
		// Note: By default, Java always rounds towards positive infinity, including negative numbers.
		if (this.numberFormat instanceof DecimalFormat) {
			this.numberFormat.setRoundingMode(RoundingMode.HALF_UP);
		}

		// Enable/disable thousands separators.
		this.numberFormat.setGroupingUsed(TiConvert.toBoolean(
			options.get("useGrouping"),
			this.numberFormat.isGroupingUsed()));

		// Set the number of whole digits and fractional digits to use.
		this.numberFormat.setMinimumIntegerDigits(TiConvert.toInt(
			options.get("minimumIntegerDigits"),
			this.numberFormat.getMinimumIntegerDigits()));
		this.numberFormat.setMaximumFractionDigits(TiConvert.toInt(
			options.get("maximumFractionDigits"),
			this.numberFormat.getMaximumFractionDigits()));
		this.numberFormat.setMinimumFractionDigits(TiConvert.toInt(
			options.get("minimumFractionDigits"),
			this.numberFormat.getMinimumFractionDigits()));

		// Fetch the max number of significant digits to use.
		// We'll apply this setting by rounding the value given to the format() method via MathContext.
		int maxSignificantDigits = TiConvert.toInt(options.get("maximumSignificantDigits"), 0);
		maxSignificantDigits = Math.min(maxSignificantDigits, 21);
		if (maxSignificantDigits > 0) {
			this.maxSignificantDigitsContext = new MathContext(maxSignificantDigits, RoundingMode.HALF_UP);
		} else {
			this.maxSignificantDigitsContext = null;
		}

		// Set up exponent notation if configured. Can only be done via a pattern string.
		// Note: Exponent notation does not support thousands separators. Will throw an exception if enabled.
		String notationStringId = TiConvert.toString(options.get("notation"), null);
		if ((notationStringId != null) && (this.numberFormat instanceof DecimalFormat)) {
			boolean isEngineering = false;
			StringBuilder patternBuilder = new StringBuilder();
			switch (notationStringId) {
				case "engineering":
					isEngineering = true;
				case "scientific": {
					if (isEngineering) {
						patternBuilder.append("##0.");
					} else {
						patternBuilder.append("0.");
					}
					for (int index = this.numberFormat.getMinimumFractionDigits(); index > 0; index--) {
						patternBuilder.append('0');
					}
					int remainingDigits = this.numberFormat.getMaximumFractionDigits();
					remainingDigits -= this.numberFormat.getMinimumFractionDigits();
					if (isEngineering) {
						remainingDigits += 2; // We must add 2 out of the 3 integer digits: "##0."
					}
					for (int index = remainingDigits; index > 0; index--) {
						patternBuilder.append('#');
					}
					if (patternBuilder.charAt(patternBuilder.length() - 1) == '.') {
						patternBuilder.append("###");
					}
				}
				case "compact":
					try {
						this.numberFormat.setGroupingUsed(false);
						if (patternBuilder.length() <= 0) {
							patternBuilder.append(((DecimalFormat) this.numberFormat).toPattern());
						}
						patternBuilder.append("E0");
						((DecimalFormat) this.numberFormat).applyPattern(patternBuilder.toString());
					} catch (Exception ex) {
						Log.e(TAG, "Failed to apply exponent notation.", ex);
					}
					break;
			}
		}

		// Store locale and options settings to be returned by this class' resolvedOptions() method.
		this.resolvedOptions = new KrollDict();
		this.resolvedOptions.putAll(options);
		this.resolvedOptions.put(TiC.PROPERTY_LOCALE, locale.toString().replace("_", "-"));
		this.resolvedOptions.put("signDisplay", "auto");
		this.resolvedOptions.put("useGrouping", this.numberFormat.isGroupingUsed());
		this.resolvedOptions.put("minimumIntegerDigits", this.numberFormat.getMinimumIntegerDigits());
		this.resolvedOptions.put("maximumFractionDigits", this.numberFormat.getMaximumFractionDigits());
		this.resolvedOptions.put("minimumFractionDigits", this.numberFormat.getMinimumFractionDigits());
	}

	@Kroll.method
	public String format(double value)
	{
		// Round given value to "maximumSignificantDigits" if configured.
		if (this.maxSignificantDigitsContext != null) {
			value = BigDecimal.valueOf(value).round(this.maxSignificantDigitsContext).doubleValue();
		}

		// Format value to string.
		return this.numberFormat.format(value);
	}

	@Kroll.method
	public KrollDict[] formatToParts(double value)
	{
		// Round given value to "maximumSignificantDigits" if configured.
		if (this.maxSignificantDigitsContext != null) {
			value = BigDecimal.valueOf(value).round(this.maxSignificantDigitsContext).doubleValue();
		}

		// Format value to a string buffer and obtain all of its field positions.
		// Note: Skip fetching the "GROUPING_SEPARATOR" field since it can't fetch more than one separator.
		StringBuffer stringBuffer = new StringBuffer(64);
		FieldPosition[] fieldPositionArray = new FieldPosition[] {
			new FieldPosition(NumberFormat.Field.CURRENCY),
			new FieldPosition(NumberFormat.Field.DECIMAL_SEPARATOR),
			new FieldPosition(NumberFormat.Field.EXPONENT),
			new FieldPosition(NumberFormat.Field.EXPONENT_SIGN),
			new FieldPosition(NumberFormat.Field.EXPONENT_SYMBOL),
			new FieldPosition(NumberFormat.Field.FRACTION),
			new FieldPosition(NumberFormat.Field.INTEGER),
			new FieldPosition(NumberFormat.Field.PERCENT),
			new FieldPosition(NumberFormat.Field.PERMILLE),
			new FieldPosition(NumberFormat.Field.SIGN)
		};
		HashMap<Integer, FieldPosition> fieldPositionIndexMap = new HashMap<>();
		for (FieldPosition fieldPosition : fieldPositionArray) {
			// Fetch the next field position by formatting value to string.
			// Unfortunately, we have to recreate string every time. There's no way to do this in one shot.
			stringBuffer.delete(0, stringBuffer.length());
			this.numberFormat.format(value, stringBuffer, fieldPosition);

			// Add field to map if it exists in string.
			int beginIndex = fieldPosition.getBeginIndex();
			if ((beginIndex >= 0) && (beginIndex != fieldPosition.getEndIndex())) {
				fieldPositionIndexMap.put(beginIndex, fieldPosition);
			}
		}

		// Fetch the localized symbols used by this formatter.
		DecimalFormatSymbols symbols = null;
		if (this.numberFormat instanceof DecimalFormat) {
			symbols = ((DecimalFormat) this.numberFormat).getDecimalFormatSymbols();
		}
		if (symbols == null) {
			symbols = DecimalFormatSymbols.getInstance();
		}
		final char GROUP_SEPARATOR_CHAR = symbols.getGroupingSeparator();
		final char MINUS_CHAR = symbols.getMinusSign();

		// Create the parts list.
		ArrayList<KrollDict> partList = new ArrayList<>(32);
		for (int index = 0; index < stringBuffer.length();) {
			String typeName = null;
			String substring = null;

			// Fetch the next field.
			FieldPosition fieldPosition = fieldPositionIndexMap.get(index);
			if (fieldPosition != null) {
				// Extract the field's string.
				substring = stringBuffer.substring(fieldPosition.getBeginIndex(), fieldPosition.getEndIndex());

				// Get the JavaScript "Intl.NumberFormat" part type equivalent.
				Format.Field formatField = fieldPosition.getFieldAttribute();
				if (formatField == NumberFormat.Field.CURRENCY) {
					typeName = "currency";
				} else if (formatField == NumberFormat.Field.DECIMAL_SEPARATOR) {
					typeName = "decimal";
				} else if (formatField == NumberFormat.Field.EXPONENT_SYMBOL) {
					typeName = "literal";
				} else if (formatField == NumberFormat.Field.FRACTION) {
					typeName = "fraction";
				} else if (formatField == NumberFormat.Field.GROUPING_SEPARATOR) {
					typeName = "group";
				} else if ((formatField == NumberFormat.Field.INTEGER)
						|| (formatField == NumberFormat.Field.EXPONENT)) {
					typeName = "integer";
				} else if ((formatField == NumberFormat.Field.PERCENT)
						|| (formatField == NumberFormat.Field.PERMILLE)) {
					typeName = "percentSign";
				} else if ((formatField == NumberFormat.Field.SIGN)
						|| (formatField == NumberFormat.Field.EXPONENT_SIGN)) {
					if (substring.equals(Character.toString(MINUS_CHAR))) {
						typeName = "minusSign";
					} else {
						typeName = "plusSign";
					}
				} else if (substring.equals(symbols.getNaN())) {
					typeName = "nan";
				} else if (substring.equals(symbols.getInfinity())) {
					typeName = "infinity";
				} else {
					typeName = "literal";
				}

				// Update index past this field position.
				index = fieldPosition.getEndIndex();
			} else {
				// A field object was not found. So, assume string literal.
				typeName = "literal";

				// Extract all of the characters up to the next field or end of string.
				int endIndex = index;
				for (; (endIndex < stringBuffer.length()) && !fieldPositionIndexMap.containsKey(endIndex); endIndex++);
				substring = stringBuffer.substring(index, endIndex);

				// Update index past this literal substring.
				index = endIndex;
			}

			// Add the substring part enttry to the collection.
			if (typeName.equals("integer") && (substring.indexOf(GROUP_SEPARATOR_CHAR) >= 0)) {
				// For the whole number portion, we need to split it by thousands separators ourselves.
				final String GROUP_SEPARATOR_STRING = Character.toString(GROUP_SEPARATOR_CHAR);
				String[] stringArray = substring.split(Pattern.quote(GROUP_SEPARATOR_STRING));
				for (int stringIndex = 0; stringIndex < stringArray.length; stringIndex++) {
					String nextString = stringArray[stringIndex];
					if (nextString.length() > 0) {
						// Add the integer part.
						KrollDict entry = new KrollDict();
						entry.put(TiC.PROPERTY_TYPE, typeName);
						entry.put(TiC.PROPERTY_VALUE, nextString);
						partList.add(entry);
					}
					if ((stringIndex + 1) < stringArray.length) {
						// Add the group/thousands separator part.
						KrollDict entry = new KrollDict();
						entry.put(TiC.PROPERTY_TYPE, "group");
						entry.put(TiC.PROPERTY_VALUE, GROUP_SEPARATOR_STRING);
						partList.add(entry);
					}
				}
			} else {
				// Add the part entry as-is.
				KrollDict entry = new KrollDict();
				entry.put(TiC.PROPERTY_TYPE, typeName);
				entry.put(TiC.PROPERTY_VALUE, substring);
				partList.add(entry);
			}
		}

		// Return the parts list as an array.
		return partList.toArray(new KrollDict[0]);
	}

	@Kroll.method
	public KrollDict resolvedOptions()
	{
		return this.resolvedOptions;
	}

	@Override
	public String getApiName()
	{
		return "Ti.Locale.NumberFormat";
	}
}
