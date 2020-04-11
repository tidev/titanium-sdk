/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.calendar;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Kroll.proxy
public class RecurrenceRuleProxy extends KrollProxy
{

	private static final String TAG = "RecurrenceRule";

	// Keys for daysOfTheWeek dictionary.
	private final String dayOfWeekKey = "daysOfWeek";
	private final String weekNumberKey = "week";

	// Keys for end dictionary.
	private final String until = "endDate";
	private final String count = "occurrenceCount";

	// Field with the Date of the event begin to provide parity with iOS.
	// Some information exposed can't be get solely from the recurrence rule.
	private Date eventBegin;
	private String rRule;

	//region values that can be set from a Creation Dictionary
	private TiRecurrenceFrequencyType frequency;
	private Integer interval = 1;
	private int[] daysOfTheMonth = new int[] {};
	private int[] daysOfTheYear = new int[] {};
	private int[] monthsOfTheYear = new int[] {};
	private int[] weeksOfTheYear = new int[] {};
	private String calendarID;
	private KrollDict endDictionary = new KrollDict();
	private KrollDict[] daysOfTheWeek = new KrollDict[] {};
	//endregion

	// Map matching days of the week constants from Titanium docs with their String counterparts in RRULE column.
	private static final Map<String, Integer> weekdaysMap;
	static
	{
		weekdaysMap = new HashMap<String, Integer>();
		weekdaysMap.put("SU", 1);
		weekdaysMap.put("MO", 2);
		weekdaysMap.put("TU", 3);
		weekdaysMap.put("WE", 4);
		weekdaysMap.put("TH", 5);
		weekdaysMap.put("FR", 6);
		weekdaysMap.put("SA", 7);
	}

	// Constructor for creating a recurrence rule from a Kroll creation dictionary.
	public RecurrenceRuleProxy(KrollDict creationDictionary)
	{
		if (creationDictionary.containsKey(TiC.PROPERTY_CALENDAR_ID)) {
			this.calendarID = TiConvert.toString(creationDictionary.get(TiC.PROPERTY_CALENDAR_ID));
		}
		if (creationDictionary.containsKey(TiC.PROPERTY_CALENDAR_DAYS_OF_THE_MONTH)) {
			this.daysOfTheMonth = creationDictionary.getIntArray(TiC.PROPERTY_CALENDAR_DAYS_OF_THE_MONTH);
		}
		if (creationDictionary.containsKey(TiC.PROPERTY_CALENDAR_DAYS_OF_THE_WEEK)) {
			this.daysOfTheWeek = creationDictionary.getKrollDictArray(TiC.PROPERTY_CALENDAR_DAYS_OF_THE_WEEK);
		}
		if (creationDictionary.containsKey(TiC.PROPERTY_CALENDAR_DAYS_OF_THE_YEAR)) {
			this.daysOfTheYear = creationDictionary.getIntArray(TiC.PROPERTY_CALENDAR_DAYS_OF_THE_YEAR);
		}
		if (creationDictionary.containsKey(TiC.PROPERTY_END)) {
			this.endDictionary = (KrollDict) creationDictionary.getKrollDict(TiC.PROPERTY_END);
		}
		if (creationDictionary.containsKey(TiC.PROPERTY_FREQUENCY)) {
			this.frequency =
				TiRecurrenceFrequencyType.fromTiIntId(TiConvert.toInt(creationDictionary.get(TiC.PROPERTY_FREQUENCY)));
		}
		if (this.frequency == null) {
			this.frequency = TiRecurrenceFrequencyType.DAILY;
		}
		if (creationDictionary.containsKey(TiC.PROPERTY_INTERVAL)
			&& TiConvert.toInt(creationDictionary.get(TiC.PROPERTY_INTERVAL)) > 0) {
			this.interval = TiConvert.toInt(creationDictionary.get(TiC.PROPERTY_INTERVAL));
		} else {
			Log.e(TAG, "Interval must be greater than 0.\n");
			TiApplication.terminateActivityStack();
		}
		if (creationDictionary.containsKey(TiC.PROPERTY_CALENDAR_MONTHS_OF_THE_YEAR)) {
			this.monthsOfTheYear = creationDictionary.getIntArray(TiC.PROPERTY_CALENDAR_MONTHS_OF_THE_YEAR);
		}
		if (creationDictionary.containsKey(TiC.PROPERTY_CALENDAR_WEEKS_OF_THE_YEAR)) {
			this.weeksOfTheYear = creationDictionary.getIntArray(TiC.PROPERTY_CALENDAR_WEEKS_OF_THE_YEAR);
		}
	}

	public String generateRRULEString()
	{
		StringBuilder finalRRule = new StringBuilder();
		// Handle frequency.
		if (this.frequency != null) {
			String frequencyPart = "FREQ=" + frequency.toRfcStringId();
			finalRRule.append(frequencyPart);
			finalRRule.append(";");
			// Handle frequency specific rules in different context.
			switch (this.frequency) {
				case DAILY:
					break;
				// Case for weekly recurring events.
				case WEEKLY:
					StringBuilder weeklyRecurrencesString = new StringBuilder("BYDAY=");
					int commaIndex = 0;
					for (KrollDict dict : this.daysOfTheWeek) {
						weeklyRecurrencesString.append(dict.get(this.dayOfWeekKey).toString());
						if (commaIndex < this.daysOfTheWeek.length) {
							weeklyRecurrencesString.append(",");
						}
					}
					finalRRule.append(weeklyRecurrencesString.toString());
					finalRRule.append(";");
					break;
				// Case for monthly recurring events.
				case MONTHLY:
					StringBuilder monthlyReccurencesString = new StringBuilder();
					// daysOfTheWeek dictionary is with highest priority.
					if (this.daysOfTheWeek.length > 0) {
						monthlyReccurencesString.append("BYDAY=");
						monthlyReccurencesString.append(this.daysOfTheWeek[0].getInt(this.weekNumberKey));
						// Potentially add week start (Sunday or Monday) different from the default one.
						monthlyReccurencesString.append(
							this.weekdaysMap.keySet().toArray()[this.daysOfTheWeek[0].getInt(this.weekNumberKey)]);
					} else {
						monthlyReccurencesString.append("BYMONTHDAY=");
						// Case in which we do not have items in daysOfTheWeek array.
						monthlyReccurencesString.append(String.valueOf(this.daysOfTheMonth[0]));
					}
					finalRRule.append(monthlyReccurencesString);
					finalRRule.append(";");
					break;
				case YEARLY:
					break;
			} // end of switch
		}
		// Handle interval.
		if (this.interval != null) {
			finalRRule.append("INTERVAL=" + String.valueOf(this.interval));
			finalRRule.append(";");
		}
		// Handle end.
		if (this.endDictionary.containsKey(this.until)) {
			// Dictionary can contain only one of the keys,
			// so what's left is a specific date end rule.
			finalRRule.append("UNTIL=" + String.valueOf(this.endDictionary.get(this.until)));
			finalRRule.append(";");
		} else if (this.endDictionary.containsKey(this.count)) {
			// End rule is with occurrence count.
			finalRRule.append("COUNT=" + String.valueOf(this.endDictionary.get(this.count)));
			finalRRule.append(";");
		}

		return finalRRule.toString();
	}

	// Constructor for getting a recurrence rule from the Calendar.
	public RecurrenceRuleProxy(String nativeRRule, int calendarID, Date begin)
	{
		// Only create a proxy if we have a valid recurrence rule.
		if (nativeRRule != null && !nativeRRule.equals("")) {
			this.eventBegin = begin;
			parseRecurrenceRule(nativeRRule, calendarID);
		}
		calculateEnd();
		calculateInterval();
		fillFrequencyFields();
	}

	//region Methods for converting native to Kroll values
	private void fillFrequencyFields()
	{
		//reused variables in different cases
		String days;
		String byDay;
		if (this.frequency != null) {
			switch (this.frequency) {
				case YEARLY:
					Calendar cal = Calendar.getInstance();
					cal.setTime(this.eventBegin);
					//weeksOfTheYear
					this.weeksOfTheYear = new int[] { cal.get(Calendar.WEEK_OF_YEAR) };
					//monthsOfTheYear
					this.monthsOfTheYear = new int[] { cal.get(Calendar.MONTH) };
					days = matchExpression(".*(BYYEARDAY=[0-9]*).*", 10);
					if (days != null) {
						//daysOfTheYear
						this.daysOfTheYear = new int[] { Integer.valueOf(days) };
					}
					break;
				case MONTHLY:
					//daysOfTheMonth
					days = matchExpression(".*(BYMONTHDAY=(-)*[0-9]*).*", 11);
					if (days != null) {
						this.daysOfTheMonth = new int[] { Integer.valueOf(days) };
					}
					//daysOfTheWeek
					byDay = matchExpression(".*(BYDAY=[,0-9A-Z]*).*", 6);
					if (byDay != null) {
						KrollDict daysOfTheWeekDictionary = new KrollDict();
						daysOfTheWeekDictionary.put(this.dayOfWeekKey,
													this.weekdaysMap.get(byDay.substring(byDay.length() - 2)));
						daysOfTheWeekDictionary.put(this.weekNumberKey, byDay.substring(0, byDay.length() - 2));
						this.daysOfTheWeek = new KrollDict[] { daysOfTheWeekDictionary };
					}
					break;
				case WEEKLY:
					//daysOfTheWeek
					byDay = matchExpression(".*(BYDAY=[,0-9A-Z]*).*", 6);
					if (byDay != null) {
						// Split the days from result.
						String[] daysArray = byDay.split(",");
						this.daysOfTheWeek = new KrollDict[daysArray.length];
						for (int i = 0; i < this.daysOfTheWeek.length; i++) {
							KrollDict daysOfTheWeekDictionary = new KrollDict();
							daysOfTheWeekDictionary.put(this.dayOfWeekKey, this.weekdaysMap.get(daysArray[i]));
							// In the context of a weekly recurrence week number is irrelevant.
							daysOfTheWeekDictionary.put(this.weekNumberKey, 0);
							this.daysOfTheWeek[i] = daysOfTheWeekDictionary;
						}
					}
					break;
			}
		}
	}

	private void calculateEnd()
	{
		// Check for until specific date condition.
		String date = matchExpression(".*(UNTIL=[0-9A-Z]*).*", 6);
		SimpleDateFormat sDateFormat = new SimpleDateFormat("yyyyMMdd");
		if (date != null) {
			try {
				this.endDictionary.put(this.until, sDateFormat.parse(date.substring(0, 8)));
			} catch (ParseException e) {
				e.printStackTrace();
			}
		}

		// Check for repeat count.
		String until = matchExpression(".*(COUNT=[0-9]*).*", 6);
		if (until != null) {
			this.endDictionary.put(this.count, until);
		}
	}

	private void calculateInterval()
	{
		String interval = matchExpression(".*(INTERVAL=[0-9]*).*", 9);
		if (interval != null) {
			this.interval = Integer.valueOf(interval);
		}
	}
	//endregion

	//region kroll proxy methods
	@Kroll.getProperty
	@Kroll.method
	public String getCalendarID()
	{
		return this.calendarID;
	}

	@Kroll.getProperty
	@Kroll.method
	public int[] getDaysOfTheMonth()
	{
		return this.daysOfTheMonth;
	}

	@Kroll.getProperty
	@Kroll.method
	public KrollDict[] getDaysOfTheWeek()
	{
		return this.daysOfTheWeek;
	}

	@Kroll.getProperty
	@Kroll.method
	public int[] getDaysOfTheYear()
	{
		return this.daysOfTheYear;
	}

	@Kroll.getProperty
	@Kroll.method
	public KrollDict getEnd()
	{
		return this.endDictionary;
	}

	@Kroll.getProperty
	@Kroll.method
	public int getFrequency()
	{
		return this.frequency.toTiIntId();
	}

	@Kroll.getProperty
	@Kroll.method
	public int getInterval()
	{
		return this.interval;
	}

	@Kroll.getProperty
	@Kroll.method
	public int[] monthsOfTheYear()
	{
		return this.monthsOfTheYear;
	}

	@Kroll.getProperty
	@Kroll.method
	public int[] getWeeksOfTheYear()
	{
		return this.weeksOfTheYear;
	}
	//endregion

	private void parseRecurrenceRule(String rrule, int calendarID)
	{
		if (rrule == null) {
			return;
		}
		// Set the recurrence rule for future use.
		this.rRule = rrule;

		// Set the ID of the calendar.
		this.calendarID = String.valueOf(calendarID);

		// Set the frequency in constructor, because it is required for other properties.
		String frequency = matchExpression(".*(FREQ=[A-Z]*).*", 5);
		if (frequency == null) {
			this.frequency = TiRecurrenceFrequencyType.DAILY;
		} else {
			this.frequency = TiRecurrenceFrequencyType.fromRfcStringId(frequency);
		}
	}

	private String matchExpression(String regEx, int length)
	{
		Pattern pattern = Pattern.compile(regEx);
		Matcher matcher = pattern.matcher(this.rRule);
		if (matcher.matches()) {
			return matcher.group(1).substring(length);
		}
		return null;
	}
}
