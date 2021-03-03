/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.locale;

import android.os.Build;
import java.text.AttributedCharacterIterator;
import java.text.DateFormat;
import java.text.FieldPosition;
import java.text.Format;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiPlatformHelper;

/**
 * Implements the JavaScript "Intl.DateTimeFormat" type.
 * Used to generate localized date/time strings.
 */
@Kroll.proxy(creatableInModule = LocaleModule.class)
public class DateTimeFormatProxy extends KrollProxy
{
	private static final String TAG = "DateTimeFormatProxy";

	private static final String FULL_STRING_ID = "full";
	private static final String LONG_STRING_ID = "long";
	private static final String MEDIUM_STRING_ID = "medium";
	private static final String SHORT_STRING_ID = "short";
	private static final String NARROW_STRING_ID = "narrow";
	private static final String NUMERIC_STRING_ID = "numeric";
	private static final String TWO_DIGIT_STRING_ID = "2-digit";

	private static final String WEEKDAY_STRING_ID = "weekday";
	private static final String ERA_STRING_ID = "era";
	private static final String YEAR_STRING_ID = "year";
	private static final String MONTH_STRING_ID = "month";
	private static final String DAY_STRING_ID = "day";
	private static final String HOUR12_STRING_ID = "hour12";
	private static final String HOUR_CYCLE_STRING_ID = "hourCycle";
	private static final String HOUR_STRING_ID = "hour";
	private static final String MINUTE_STRING_ID = "minute";
	private static final String SECOND_STRING_ID = "second";
	private static final String FRACTIONAL_SECOND_DIGITS_STRING_ID = "fractionalSecondDigits";
	private static final String DAY_PERIOD_STRING_ID = "dayPeriod";
	private static final String TIME_ZONE_NAME_STRING_ID = "timeZoneName";

	private DateFormat dateFormat = DateFormat.getInstance();
	private KrollDict resolvedOptions = new KrollDict();
	private boolean hasUpdatedResolvedOptions;

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

		// Fetch main date/time component properties.
		String weekdayFormatId = TiConvert.toString(options.get(WEEKDAY_STRING_ID));
		String eraFormatId = TiConvert.toString(options.get(ERA_STRING_ID));
		String yearFormatId = TiConvert.toString(options.get(YEAR_STRING_ID));
		String monthFormatId = TiConvert.toString(options.get(MONTH_STRING_ID));
		String dayFormatId = TiConvert.toString(options.get(DAY_STRING_ID));
		String hourFormatId = TiConvert.toString(options.get(HOUR_STRING_ID));
		String minuteFormatId = TiConvert.toString(options.get(MINUTE_STRING_ID));
		String secondFormatId = TiConvert.toString(options.get(SECOND_STRING_ID));
		String dayPeriodFormatId = TiConvert.toString(options.get(DAY_PERIOD_STRING_ID));
		String timeZoneFormatId = TiConvert.toString(options.get(TIME_ZONE_NAME_STRING_ID));

		// Fetch hour handling.
		// Note: The "hour12" boolean must overriding the "hourCycle" property.
		String hourCycleFormatId = TiConvert.toString(options.get(HOUR_CYCLE_STRING_ID));
		if (options.containsKey(HOUR12_STRING_ID)) {
			if (TiConvert.toBoolean(options.get(HOUR12_STRING_ID), true)) {
				hourCycleFormatId = "h12";
			} else {
				hourCycleFormatId = "h23";
			}
		}

		// Fetch number of millisecond digits to display.
		int millisecondDigits = TiConvert.toInt(options.get(FRACTIONAL_SECOND_DIGITS_STRING_ID), 0);
		if (millisecondDigits < 0) {
			millisecondDigits = 0;
		} else if (millisecondDigits > 3) {
			millisecondDigits = 3;
		}

		// Fetch date/time styles. These are only used if above options are not provided.
		String dateStyleStringId = TiConvert.toString(options.get("dateStyle"));
		String timeStyleStringId = TiConvert.toString(options.get("timeStyle"));

		// Determine if at least 1 "date" componoent has been configured.
		boolean hasCustomDateSettings
			=  (weekdayFormatId != null)
			|| (eraFormatId != null)
			|| (yearFormatId != null)
			|| (monthFormatId != null)
			|| (dayFormatId != null);

		// Determine if at least 1 "time" componoent has been configured.
		boolean hasCustomTimeSettings
			=  (hourFormatId != null)
			|| (minuteFormatId != null)
			|| (secondFormatId != null)
			|| (dayPeriodFormatId != null)
			|| (timeZoneFormatId != null)
			|| (millisecondDigits > 0);

		// If no date/time components or styles were assigned, then default to "numeric" month/day/year.
		if (!hasCustomDateSettings && !hasCustomTimeSettings
			&& (dateStyleStringId == null) && (timeStyleStringId == null)) {
			monthFormatId = NUMERIC_STRING_ID;
			dayFormatId = NUMERIC_STRING_ID;
			yearFormatId = NUMERIC_STRING_ID;
			hasCustomDateSettings = true;
		}

		// Create a custom date/time formatter using a string pattern.
		this.dateFormat = null;
		if (hasCustomDateSettings || hasCustomTimeSettings) {
			try {
				// Generate a "skeleton" pattern without any separators using given options.
				StringBuilder stringBuilder = new StringBuilder(32);
				stringBuilder.append(getPatternForWeekdayId(weekdayFormatId));
				stringBuilder.append(getPatternForYearId(yearFormatId));
				stringBuilder.append(getPatternForMonthId(monthFormatId));
				stringBuilder.append(getPatternForDayId(dayFormatId));
				stringBuilder.append(getPatternForEraId(eraFormatId));
				stringBuilder.append(getPatternForHourId(hourFormatId, hourCycleFormatId));
				stringBuilder.append(getPatternForMinuteId(minuteFormatId));
				stringBuilder.append(getPatternForSecondId(secondFormatId));
				stringBuilder.append(getPatternForMillisecondDigits(millisecondDigits));
				stringBuilder.append(getPatternForDayPeriodId(dayPeriodFormatId));
				stringBuilder.append(getPatternForTimeZoneId(timeZoneFormatId));

				// Have Android generate a localized date/time pattern string from above skeleton pattern.
				// This will inject needed separators and auto-swap components like month/day according to locale.
				// Note: Android 8 sometimes inserts invalid pattern char 'b' for AM/PM. Should be 'a' instead.
				String datePattern = android.text.format.DateFormat.getBestDateTimePattern(
					locale, stringBuilder.toString());
				datePattern = datePattern.replace('b', 'a');
				this.dateFormat = new SimpleDateFormat(datePattern, locale);
			} catch (Exception ex) {
				Log.e(TAG, "Failed to generate 'best' date pattern.", ex);
			}
		}

		// Create a basic date/time formatter if no custom components were configured
		// or if we failed to create the custom formatter above.
		if (this.dateFormat == null) {
			if (hasCustomDateSettings && hasCustomTimeSettings) {
				this.dateFormat = DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT, locale);
			} else if (!hasCustomDateSettings && hasCustomTimeSettings) {
				this.dateFormat = DateFormat.getTimeInstance(DateFormat.SHORT, locale);
			} else if (hasCustomDateSettings && !hasCustomTimeSettings) {
				this.dateFormat = DateFormat.getDateInstance(DateFormat.SHORT, locale);
			} else {
				// We only use "dateStyle" and "timeStyle" if no other options are defined.
				int dateStyleIntId = getIntIdForStyleId(dateStyleStringId);
				int timeStyleIntId = getIntIdForStyleId(timeStyleStringId);
				if ((dateStyleStringId != null) && (timeStyleStringId != null)) {
					this.dateFormat = DateFormat.getDateTimeInstance(dateStyleIntId, timeStyleIntId, locale);
				} else if ((dateStyleStringId == null) && (timeStyleStringId != null)) {
					this.dateFormat = DateFormat.getTimeInstance(timeStyleIntId, locale);
				} else {
					this.dateFormat = DateFormat.getDateInstance(dateStyleIntId, locale);
				}
			}
		}

		// Configure the time zone if set. (Ex: "UTC", "GMT", "GMT-8:00", "PST", etc.)
		String timeZoneStringId = TiConvert.toString(options.get("timeZone"));
		if (timeZoneStringId != null) {
			this.dateFormat.setTimeZone(TimeZone.getTimeZone(timeZoneStringId));
		}

		// Store locale and options settings to be returned by this class' resolvedOptions() method.
		this.resolvedOptions = new KrollDict();
		this.resolvedOptions.putAll(options);
		this.resolvedOptions.put(TiC.PROPERTY_LOCALE, locale.toString().replace("_", "-"));
		this.resolvedOptions.put("timeZone", this.dateFormat.getTimeZone().getID());
		NumberingSystem numberingSystem = NumberingSystem.from(locale);
		if (numberingSystem == null) {
			numberingSystem = NumberingSystem.LATN;
		}
		this.resolvedOptions.put(TiC.PROPERTY_NUMBERING_SYSTEM, numberingSystem.toLdmlStringId());
		String calendarStringId = "gregory";
		if (Build.VERSION.SDK_INT >= 26) {
			calendarStringId = this.dateFormat.getCalendar().getCalendarType();
		}
		this.resolvedOptions.put("calendar", calendarStringId);
	}

	@Kroll.method
	public String format(Date date)
	{
		return this.dateFormat.format(date);
	}

	@Kroll.method
	public KrollDict[] formatToParts(Date value)
	{
		// Format date to a string buffer and obtain all of its field positions.
		StringBuilder stringBuilder = new StringBuilder(64);
		HashMap<Integer, FieldPosition> fieldPositionIndexMap = new HashMap<>();
		AttributedCharacterIterator charIter = this.dateFormat.formatToCharacterIterator(value);
		for (char nextChar = charIter.first(); nextChar != charIter.DONE; nextChar = charIter.next()) {
			stringBuilder.append(nextChar);
			for (Map.Entry<AttributedCharacterIterator.Attribute, Object> entry : charIter.getAttributes().entrySet()) {
				// Skip attributes that are not format fields.
				if (!(entry.getKey() instanceof Format.Field)) {
					continue;
				}

				// Add field position to map if not done already.
				Format.Field formatField = (Format.Field) entry.getKey();
				int beginIndex = charIter.getRunStart(formatField);
				if ((beginIndex >= 0) && !fieldPositionIndexMap.containsKey(beginIndex)) {
					FieldPosition fieldPosition = new FieldPosition(formatField);
					fieldPosition.setBeginIndex(beginIndex);
					fieldPosition.setEndIndex(charIter.getRunLimit(formatField));
					fieldPositionIndexMap.put(beginIndex, fieldPosition);
				}
			}
		}
		String stringValue = stringBuilder.toString();

		// Create the parts list.
		ArrayList<KrollDict> partList = new ArrayList<>(32);
		for (int index = 0; index < stringValue.length();) {
			String typeName = null;
			String substring = null;

			// Fetch the next field.
			FieldPosition fieldPosition = fieldPositionIndexMap.get(index);
			if (fieldPosition != null) {
				// Extract the field's string.
				substring = stringValue.substring(fieldPosition.getBeginIndex(), fieldPosition.getEndIndex());

				// Get the JavaScript "Intl.DateTimeFormat" part type equivalent.
				Format.Field formatField = fieldPosition.getFieldAttribute();
				if (formatField == DateFormat.Field.AM_PM) {
					typeName = DAY_PERIOD_STRING_ID;
				} else if (formatField == DateFormat.Field.DAY_OF_MONTH) {
					typeName = DAY_STRING_ID;
				} else if ((formatField == DateFormat.Field.DAY_OF_WEEK)
						|| (formatField == DateFormat.Field.DAY_OF_WEEK_IN_MONTH)) {
					typeName = WEEKDAY_STRING_ID;
				} else if (formatField == DateFormat.Field.ERA) {
					typeName = ERA_STRING_ID;
				} else if ((formatField == DateFormat.Field.HOUR0)
						|| (formatField == DateFormat.Field.HOUR1)
						|| (formatField == DateFormat.Field.HOUR_OF_DAY0)
						|| (formatField == DateFormat.Field.HOUR_OF_DAY1)) {
					typeName = HOUR_STRING_ID;
				} else if (formatField == DateFormat.Field.MILLISECOND) {
					typeName = "fractionalSecond";
				} else if (formatField == DateFormat.Field.MINUTE) {
					typeName = MINUTE_STRING_ID;
				} else if (formatField == DateFormat.Field.MONTH) {
					typeName = MONTH_STRING_ID;
				} else if (formatField == DateFormat.Field.SECOND) {
					typeName = SECOND_STRING_ID;
				} else if (formatField == DateFormat.Field.TIME_ZONE) {
					typeName = TIME_ZONE_NAME_STRING_ID;
				} else if (formatField == DateFormat.Field.YEAR) {
					typeName = YEAR_STRING_ID;
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
				for (; (endIndex < stringValue.length()) && !fieldPositionIndexMap.containsKey(endIndex); endIndex++);
				substring = stringValue.substring(index, endIndex);

				// Update index past this literal substring.
				index = endIndex;
			}

			// Add the substring part enttry to the collection.
			KrollDict entry = new KrollDict();
			entry.put(TiC.PROPERTY_TYPE, typeName);
			entry.put(TiC.PROPERTY_VALUE, substring);
			partList.add(entry);
		}

		// Return the parts list as an array.
		return partList.toArray(new KrollDict[0]);
	}

	@Kroll.method
	public KrollDict resolvedOptions()
	{
		// Parse for the rest of the options from the date/time pattern, if not done already.
		if (!this.hasUpdatedResolvedOptions) {
			if (this.dateFormat instanceof SimpleDateFormat) {
				updateResolvedOptionsWithPattern(((SimpleDateFormat) this.dateFormat).toPattern());
			}
			this.hasUpdatedResolvedOptions = true;
		}

		// Return a dictionary describing how date/time is formatted.
		return this.resolvedOptions;
	}

	private void updateResolvedOptionsWithPattern(String pattern)
	{
		// Validate.
		if ((this.resolvedOptions == null) || (pattern == null)) {
			return;
		}

		// First, remove all date/time options before parsing for them down below.
		// We do this in case these options are not found in the pattern.
		this.resolvedOptions.remove(ERA_STRING_ID);
		this.resolvedOptions.remove(YEAR_STRING_ID);
		this.resolvedOptions.remove(MONTH_STRING_ID);
		this.resolvedOptions.remove(DAY_STRING_ID);
		this.resolvedOptions.remove(WEEKDAY_STRING_ID);
		this.resolvedOptions.remove(DAY_PERIOD_STRING_ID);
		this.resolvedOptions.remove(HOUR12_STRING_ID);
		this.resolvedOptions.remove(HOUR_CYCLE_STRING_ID);
		this.resolvedOptions.remove(HOUR_STRING_ID);
		this.resolvedOptions.remove(MINUTE_STRING_ID);
		this.resolvedOptions.remove(SECOND_STRING_ID);
		this.resolvedOptions.remove(FRACTIONAL_SECOND_DIGITS_STRING_ID);
		this.resolvedOptions.remove(TIME_ZONE_NAME_STRING_ID);

		// Parse pattern and update resolved options for each date/time component found.
		int charCount = 0;
		char lastChar = '\0';
		final int PATTERN_LENGTH = pattern.length();
		for (int index = 0; index <= PATTERN_LENGTH; index++) {
			// Fetch next character in pattern.
			char nextChar = (index < PATTERN_LENGTH) ? pattern.charAt(index) : '\0';

			// Skip to next character until duplicate character sequence has ended.
			if (charCount <= 0) {
				lastChar = nextChar;
				charCount = 1;
				continue;
			} else if (nextChar == lastChar) {
				charCount++;
				continue;
			}

			// The duplicate character sequence has ended.
			// Check if it's a known pattern and update resolved options dictionary.
			switch (lastChar) {
				case 'G':
					if (charCount >= 3) {
						this.resolvedOptions.put(ERA_STRING_ID, LONG_STRING_ID);
					} else if (charCount == 2) {
						this.resolvedOptions.put(ERA_STRING_ID, SHORT_STRING_ID);
					} else {
						this.resolvedOptions.put(ERA_STRING_ID, NARROW_STRING_ID);
					}
					break;
				case 'y':
				case 'Y':
					this.resolvedOptions.put(YEAR_STRING_ID, charCount == 2 ? TWO_DIGIT_STRING_ID : NUMERIC_STRING_ID);
					break;
				case 'M':
				case 'L':
					if (charCount >= 5) {
						this.resolvedOptions.put(MONTH_STRING_ID, NARROW_STRING_ID);
					} else if (charCount == 4) {
						this.resolvedOptions.put(MONTH_STRING_ID, LONG_STRING_ID);
					} else if (charCount == 3) {
						this.resolvedOptions.put(MONTH_STRING_ID, SHORT_STRING_ID);
					} else if (charCount == 2) {
						this.resolvedOptions.put(MONTH_STRING_ID, TWO_DIGIT_STRING_ID);
					} else {
						this.resolvedOptions.put(MONTH_STRING_ID, NUMERIC_STRING_ID);
					}
					break;
				case 'd':
					this.resolvedOptions.put(DAY_STRING_ID, charCount == 2 ? TWO_DIGIT_STRING_ID : NUMERIC_STRING_ID);
					break;
				case 'E':
				case 'c':
					if (charCount >= 5) {
						this.resolvedOptions.put(WEEKDAY_STRING_ID, NARROW_STRING_ID);
					} else if (charCount == 4) {
						this.resolvedOptions.put(WEEKDAY_STRING_ID, LONG_STRING_ID);
					} else {
						this.resolvedOptions.put(WEEKDAY_STRING_ID, SHORT_STRING_ID);
					}
					break;
				case 'a':
					if (charCount >= 3) {
						this.resolvedOptions.put(DAY_PERIOD_STRING_ID, LONG_STRING_ID);
					} else if (charCount == 2) {
						this.resolvedOptions.put(DAY_PERIOD_STRING_ID, SHORT_STRING_ID);
					} else {
						this.resolvedOptions.put(DAY_PERIOD_STRING_ID, NARROW_STRING_ID);
					}
					break;
				case 'H':
					this.resolvedOptions.put(HOUR12_STRING_ID, false);
					this.resolvedOptions.put(HOUR_CYCLE_STRING_ID, "h23");
					this.resolvedOptions.put(HOUR_STRING_ID, charCount == 2 ? TWO_DIGIT_STRING_ID : NUMERIC_STRING_ID);
					break;
				case 'h':
					this.resolvedOptions.put(HOUR12_STRING_ID, true);
					this.resolvedOptions.put(HOUR_CYCLE_STRING_ID, "h12");
					this.resolvedOptions.put(HOUR_STRING_ID, charCount == 2 ? TWO_DIGIT_STRING_ID : NUMERIC_STRING_ID);
					break;
				case 'K':
					this.resolvedOptions.put(HOUR12_STRING_ID, true);
					this.resolvedOptions.put(HOUR_CYCLE_STRING_ID, "h11");
					this.resolvedOptions.put(HOUR_STRING_ID, charCount == 2 ? TWO_DIGIT_STRING_ID : NUMERIC_STRING_ID);
					break;
				case 'k':
					this.resolvedOptions.put(HOUR12_STRING_ID, false);
					this.resolvedOptions.put(HOUR_CYCLE_STRING_ID, "h24");
					this.resolvedOptions.put(HOUR_STRING_ID, charCount == 2 ? TWO_DIGIT_STRING_ID : NUMERIC_STRING_ID);
					break;
				case 'm':
					this.resolvedOptions.put(
						MINUTE_STRING_ID, (charCount == 2) ? TWO_DIGIT_STRING_ID : NUMERIC_STRING_ID);
					break;
				case 's':
					this.resolvedOptions.put(
						SECOND_STRING_ID, (charCount == 2) ? TWO_DIGIT_STRING_ID : NUMERIC_STRING_ID);
					break;
				case 'S':
					this.resolvedOptions.put(FRACTIONAL_SECOND_DIGITS_STRING_ID, charCount);
					break;
				case 'z':
				case 'Z':
				case 'X':
					this.resolvedOptions.put(
						TIME_ZONE_NAME_STRING_ID, (charCount > 1) ? LONG_STRING_ID : SHORT_STRING_ID);
					break;
			}

			// Start counting the next character sequence.
			charCount = 1;
			lastChar = nextChar;
		}
	}

	private int getIntIdForStyleId(String stringId)
	{
		if (stringId != null) {
			switch (stringId) {
				case FULL_STRING_ID:
					return DateFormat.FULL;
				case LONG_STRING_ID:
					return DateFormat.LONG;
				case MEDIUM_STRING_ID:
					return DateFormat.MEDIUM;
				case SHORT_STRING_ID:
					return DateFormat.SHORT;
			}
		}
		return DateFormat.SHORT;
	}

	private String getPatternForWeekdayId(String stringId)
	{
		if (stringId != null) {
			switch (stringId) {
				case LONG_STRING_ID:
					return "EEEE";
				case SHORT_STRING_ID:
					return "EEE";
				case NARROW_STRING_ID:
					return "EEEEE";
			}
		}
		return "";
	}

	private String getPatternForEraId(String stringId)
	{
		if (stringId != null) {
			switch (stringId) {
				case LONG_STRING_ID:
					return "GGG";
				case SHORT_STRING_ID:
					return "GG";
				case NARROW_STRING_ID:
					return "G";
			}
		}
		return "";
	}

	private String getPatternForYearId(String stringId)
	{
		if (stringId != null) {
			switch (stringId) {
				case NUMERIC_STRING_ID:
					return "yyyy";
				case TWO_DIGIT_STRING_ID:
					return "yy";
			}
		}
		return "";
	}

	private String getPatternForMonthId(String stringId)
	{
		if (stringId != null) {
			switch (stringId) {
				case NUMERIC_STRING_ID:
					return "M";
				case TWO_DIGIT_STRING_ID:
					return "MM";
				case SHORT_STRING_ID:
					return "MMM";
				case LONG_STRING_ID:
					return "MMMM";
				case NARROW_STRING_ID:
					return "MMMMM";
			}
		}
		return "";
	}

	private String getPatternForDayId(String stringId)
	{
		if (stringId != null) {
			switch (stringId) {
				case NUMERIC_STRING_ID:
					return "d";
				case TWO_DIGIT_STRING_ID:
					return "dd";
			}
		}
		return "";
	}

	private String getPatternForHourId(String hourId, String cycleId)
	{
		String patternChar = "h";
		if (cycleId != null) {
			switch (cycleId) {
				case "h11":
					patternChar = "K";
					break;
				case "h12":
					patternChar = "h";
					break;
				case "h23":
					patternChar = "H";
					break;
				case "h24":
					patternChar = "k";
					break;
			}
		}

		if (hourId != null) {
			switch (hourId) {
				case NUMERIC_STRING_ID:
					return patternChar;
				case TWO_DIGIT_STRING_ID:
					return patternChar + patternChar;
			}
		}
		return "";
	}

	private String getPatternForMinuteId(String stringId)
	{
		if (stringId != null) {
			switch (stringId) {
				case NUMERIC_STRING_ID:
					return "m";
				case TWO_DIGIT_STRING_ID:
					return "mm";
			}
		}
		return "";
	}

	private String getPatternForSecondId(String stringId)
	{
		if (stringId != null) {
			switch (stringId) {
				case NUMERIC_STRING_ID:
					return "s";
				case TWO_DIGIT_STRING_ID:
					return "ss";
			}
		}
		return "";
	}

	private String getPatternForDayPeriodId(String stringId)
	{
		if (stringId != null) {
			switch (stringId) {
				case NARROW_STRING_ID:
					return "a";
				case SHORT_STRING_ID:
					return "aa";
				case LONG_STRING_ID:
					return "aaa";
			}
		}
		return "";
	}

	private String getPatternForMillisecondDigits(int count)
	{
		switch (count) {
			case 1:
				return "S";
			case 2:
				return "SS";
			case 3:
				return "SSS";
		}
		return "";
	}

	private String getPatternForTimeZoneId(String stringId)
	{
		if (stringId != null) {
			switch (stringId) {
				case LONG_STRING_ID:
					return "zzzz";
				case SHORT_STRING_ID:
					return "z";
			}
		}
		return "";
	}

	@Override
	public String getApiName()
	{
		return "Ti.Locale.DateTimeFormat";
	}
}
