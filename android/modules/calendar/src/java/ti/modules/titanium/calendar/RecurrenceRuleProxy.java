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
import org.appcelerator.kroll.annotations.generator.JSONUtils;
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
public class RecurrenceRuleProxy extends KrollProxy {

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
	private int frequency = -1;
	private int interval = -1;
	private int[] daysOfTheMonth;
	private int[] daysOfTheYear;
	private int[] monthsOfTheYear;
	private int[] weeksOfTheYear;
	private String calendarID;
	private KrollDict endDictionary = new KrollDict();
	private KrollDict[] daysOfTheWeek;
	//endregion

	// Map matching frequency constants with their String counterparts in RRULE column.
	private static final Map<String, Integer> frequencyMap;
	static
	{
		frequencyMap = new HashMap<String, Integer>();
		frequencyMap.put("DAILY", CalendarModule.RECURRENCEFREQUENCY_DAILY);
		frequencyMap.put("WEEKLY", CalendarModule.RECURRENCEFREQUENCY_WEEKLY);
		frequencyMap.put("MONTHLY", CalendarModule.RECURRENCEFREQUENCY_MONTHLY);
		frequencyMap.put("YEARLY", CalendarModule.RECURRENCEFREQUENCY_YEARLY);
	}

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
	public RecurrenceRuleProxy(KrollDict creationDictionary) {
		if (creationDictionary.containsKey(TiC.PROPERTY_CALENDAR_ID)) {
			calendarID = TiConvert.toString(creationDictionary.get(TiC.PROPERTY_CALENDAR_ID));
		}
		if (creationDictionary.containsKey(TiC.PROPERTY_CALENDAR_DAYS_OF_THE_MONTH)) {
			daysOfTheMonth = creationDictionary.getIntArray(TiC.PROPERTY_CALENDAR_DAYS_OF_THE_MONTH);
		}
		if (creationDictionary.containsKey(TiC.PROPERTY_CALENDAR_DAYS_OF_THE_WEEK)) {
			daysOfTheWeek = creationDictionary.getKrollDictArray(TiC.PROPERTY_CALENDAR_DAYS_OF_THE_WEEK);
		}
		if (creationDictionary.containsKey(TiC.PROPERTY_CALENDAR_DAYS_OF_THE_YEAR)) {
			daysOfTheYear = creationDictionary.getIntArray(TiC.PROPERTY_CALENDAR_DAYS_OF_THE_YEAR);
		}
		if (creationDictionary.containsKey(TiC.PROPERTY_END)) {
			endDictionary = (KrollDict) creationDictionary.getKrollDict(TiC.PROPERTY_END);
		}
		if (creationDictionary.containsKey(TiC.PROPERTY_FREQUENCY)) {
			frequency = TiConvert.toInt(creationDictionary.get(TiC.PROPERTY_FREQUENCY));
		}
		if (creationDictionary.containsKey(TiC.PROPERTY_INTERVAL)) {
			interval = TiConvert.toInt(creationDictionary.get(TiC.PROPERTY_INTERVAL));
		}
		if (creationDictionary.containsKey(TiC.PROPERTY_CALENDAR_MONTHS_OF_THE_YEAR)) {
			monthsOfTheYear = creationDictionary.getIntArray(TiC.PROPERTY_CALENDAR_MONTHS_OF_THE_YEAR);
		}
		if (creationDictionary.containsKey(TiC.PROPERTY_CALENDAR_WEEKS_OF_THE_YEAR)) {
			weeksOfTheYear = creationDictionary.getIntArray(TiC.PROPERTY_CALENDAR_WEEKS_OF_THE_YEAR);
		}
	}

	public String generateRRULEString() {
		StringBuilder finalRRule = new StringBuilder();
		// Handle frequency.
		if (frequency > -1) {
			String frequencyPart = "FREQ=" + frequencyMap.keySet().toArray()[frequency - 1];
			finalRRule.append(frequencyPart);
			finalRRule.append(";");
			// Handle frequency specific rules in different context.
			switch (frequency) {
				// Case for weekly recurring events.
				case CalendarModule.RECURRENCEFREQUENCY_WEEKLY:
					StringBuilder weeklyRecurrencesString = new StringBuilder("BYDAY=");
					int commaIndex = 0;
					for (KrollDict dict: daysOfTheWeek) {
						weeklyRecurrencesString.append(dict.get(dayOfWeekKey).toString());
						if (commaIndex < daysOfTheWeek.length) {
							weeklyRecurrencesString.append(",");
						}
					}
					finalRRule.append(weeklyRecurrencesString.toString());
					finalRRule.append(";");
					break;
				// Case for monthly recurring events.
				case CalendarModule.RECURRENCEFREQUENCY_MONTHLY:
					StringBuilder monthlyReccurencesString = new StringBuilder("BYDAY=");
					// daysOfTheWeek dictionary is with highest priority.
					if (daysOfTheWeek.length > 0) {
						monthlyReccurencesString.append(daysOfTheWeek[0].getInt(weekNumberKey));
						// Potentially add week start (Sunday or Monday) different from the default one.
						monthlyReccurencesString.append(weekdaysMap.keySet().toArray()[daysOfTheWeek[0].getInt(weekNumberKey)]);
					} else {
						// Case in which we do not have items in daysOfTheWeek array.
						monthlyReccurencesString.append(String.valueOf(daysOfTheMonth));
					}
					finalRRule.append(monthlyReccurencesString);
					finalRRule.append(";");
					break;
			} // end of switch
 		}
		// Handle interval.
		if (interval > -1) {
			finalRRule.append("INTERVAL=" + String.valueOf(interval));
			finalRRule.append(";");
		}
		// Handle end.
		if (endDictionary.containsKey(until)) {
			// Dictionary can contain only one of the keys,
			// so what's left is a specific date end rule.
			finalRRule.append("UNTIL=" + String.valueOf(endDictionary.get(until)));
			finalRRule.append(";");
		} else if (endDictionary.containsKey(count)) {
				// End rule is with occurrence count.
				finalRRule.append("COUNT=" + String.valueOf(endDictionary.get(count)));
				finalRRule.append(";");
			}

		return finalRRule.toString();
	}

	// Constructor for getting a recurrence rule from the Calendar.
	public RecurrenceRuleProxy(String nativeRRule, int calendarID, Date begin) {
		// Only create a proxy if we have a valid recurrence rule.
		if (nativeRRule != null && !nativeRRule.equals("")) {
			eventBegin = begin;
			parseRecurrenceRule(nativeRRule, calendarID);
		}
		calculateDaysOfTheMonth();
		calculateDaysOfTheWeek();
		calculateDaysOfTheYear();
		calculateEnd();
		calculateInterval();
		calculateMonthsOfTheYear();
		calculateWeeksOfTheYear();
	}

	//region Methods for converting native to Kroll values
	private void calculateDaysOfTheMonth(){
		String days = matchExpression(".*(BYMONTHDAY=[0-9]*).*", 11);
		if (days != null && frequency == CalendarModule.RECURRENCEFREQUENCY_MONTHLY) {
			daysOfTheMonth = new int[1];
			daysOfTheMonth[0] = Integer.valueOf(days);
		} else {
			daysOfTheMonth = new int[]{};
		}
	}

	private void calculateDaysOfTheWeek() {
		// Create a dictionary in the context of a month.
		if (frequency == CalendarModule.RECURRENCEFREQUENCY_MONTHLY) {
			String byDay = matchExpression(".*(BYDAY=[,0-9A-Z]*).*", 6);
			if (byDay != null) {
				KrollDict daysOfTheWeekDictionary = new KrollDict();
				daysOfTheWeek = new KrollDict[1];
				daysOfTheWeekDictionary.put(dayOfWeekKey, weekdaysMap.get(byDay.substring(byDay.length() - 2)));
				daysOfTheWeekDictionary.put(weekNumberKey, byDay.substring(0, byDay.length() - 2));
				daysOfTheWeek[0] = daysOfTheWeekDictionary;
			}
			return;
		}
		// Create a dictionary in the context of a week.
		if (frequency == CalendarModule.RECURRENCEFREQUENCY_WEEKLY) {
			String byDay = matchExpression(".*(BYDAY=[,0-9A-Z]*).*", 6);
			// Split the days from result.
			String[] days = byDay.split(",");
			daysOfTheWeek = new KrollDict[days.length];
			for (int i=0; i < daysOfTheWeek.length; i++) {
				KrollDict daysOfTheWeekDictionary = new KrollDict();
				daysOfTheWeekDictionary.put(dayOfWeekKey, weekdaysMap.get(days[i]));
				// In the context of a weekly recurrence week number is irrelevant.
				daysOfTheWeekDictionary.put(weekNumberKey, 0);
				daysOfTheWeek[i]=daysOfTheWeekDictionary;
			}
			return;
		}
		daysOfTheWeek = new KrollDict[]{};
	}

	private void calculateDaysOfTheYear() {
		String days = matchExpression(".*(BYYEARDAY=[0-9]*).*", 10);
		if (days != null && frequencyMap.get(frequency).equals(CalendarModule.RECURRENCEFREQUENCY_YEARLY)) {
			daysOfTheYear = new int[1];
			daysOfTheYear[0] = Integer.valueOf(days);
		} else {
			daysOfTheYear = new int[]{};
		}
	}

	private void calculateEnd() {
		// Check for until specific date condition.
		String date = matchExpression(".*(UNTIL=[0-9A-Z]*).*", 6);
		SimpleDateFormat sDateFormat = new SimpleDateFormat("yyyyMMdd");
		if (date != null) {
			try {
				endDictionary.put(until, sDateFormat.parse(date.substring(0, 8)));
			} catch (ParseException e) {
				e.printStackTrace();
			}
		}

		// Check for repeat count.
		String until = matchExpression(".*(COUNT=[0-9]*).*", 6);
		if (until != null) {
			endDictionary.put(count, until);
		}
	}

	private void calculateInterval() {
		String interval = matchExpression(".*(INTERVAL=[0-9]*).*", 9);
		if (interval != null) {
			this.interval = Integer.valueOf(interval);
		}
	}

	private void calculateMonthsOfTheYear() {
		if (frequency == CalendarModule.RECURRENCEFREQUENCY_YEARLY) {
			Calendar cal = Calendar.getInstance();
			cal.setTime(eventBegin);
			monthsOfTheYear = new int[1];
			monthsOfTheYear[0] = cal.get(Calendar.MONTH);
		} else {
			monthsOfTheYear = new int[]{};
		}
	}

	private void calculateWeeksOfTheYear() {
		if (frequency == CalendarModule.RECURRENCEFREQUENCY_YEARLY) {
			Calendar cal = Calendar.getInstance();
			cal.setTime(eventBegin);
			weeksOfTheYear = new int[1];
			weeksOfTheYear[0] = cal.get(Calendar.WEEK_OF_YEAR);
		} else {
			weeksOfTheYear = new int[]{};
		}
	}
	//endregion

	//region kroll proxy methods
	@Kroll.getProperty @Kroll.method
	public String getCalendarID() {
		return calendarID;
	}

	@Kroll.getProperty @Kroll.method
	public int[] getDaysOfTheMonth() {
		return daysOfTheMonth;
	}

	@Kroll.getProperty @Kroll.method
	public KrollDict[] getDaysOfTheWeek() {
		return daysOfTheWeek;
	}

	@Kroll.getProperty @Kroll.method
	public int[] getDaysOfTheYear() {
		return daysOfTheYear;
	}

	@Kroll.getProperty @Kroll.method
	public KrollDict getEnd() {
		return endDictionary;
	}

	@Kroll.getProperty @Kroll.method
	public int getFrequency() {
		return frequency;
	}

	@Kroll.getProperty @Kroll.method
	public int getInterval() {
		return interval;
	}

	@Kroll.getProperty @Kroll.method
	public int[] monthsOfTheYear() {
		return monthsOfTheYear;
	}

	@Kroll.getProperty @Kroll.method
	public int[] getWeeksOfTheYear() {
		return weeksOfTheYear;
	}
	//endregion


	private void parseRecurrenceRule(String rrule, int calendarID) {
		if (rrule == null) {
			return;
		}
		// Set the recurrence rule for future use.
		this.rRule = rrule;

		// Set the ID of the calendar.
		this.calendarID = String.valueOf(calendarID);

		// Set the frequency in constructor, because it is required for other properties.
		String frequency = matchExpression(".*(FREQ=[A-Z]*).*", 5);
		if (frequency != null) {
			this.frequency = frequencyMap.get(frequency);
		}
	}

	private String matchExpression(String regEx, int length) {
		Pattern pattern = Pattern.compile(regEx);
		Matcher matcher = pattern.matcher(rRule);
		if (matcher.matches()) {
			return matcher.group(1).substring(length);
		}
		return null;
	}
}


