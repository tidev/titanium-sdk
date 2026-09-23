/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.calendar;

// enum for matching Titanium frequency constants with Android recurrence rule words
public enum TiRecurrenceFrequencyType {

	DAILY(CalendarModule.RECURRENCEFREQUENCY_DAILY, "DAILY"),
	WEEKLY(CalendarModule.RECURRENCEFREQUENCY_WEEKLY, "WEEKLY"),
	MONTHLY(CalendarModule.RECURRENCEFREQUENCY_MONTHLY, "MONTHLY"),
	YEARLY(CalendarModule.RECURRENCEFREQUENCY_YEARLY, "YEARLY");

	private final int tiIntId;
	private final String rfcStringId;

	private TiRecurrenceFrequencyType(int tiIntId, String rfcStringId)
	{
		this.tiIntId = tiIntId;
		this.rfcStringId = rfcStringId;
	}

	public int toTiIntId()
	{
		return this.tiIntId;
	}

	public String toRfcStringId()
	{
		return this.rfcStringId;
	}

	public static TiRecurrenceFrequencyType fromTiIntId(int value)
	{
		for (TiRecurrenceFrequencyType nextObject : TiRecurrenceFrequencyType.values()) {
			if ((nextObject != null) && (nextObject.tiIntId == value)) {
				return nextObject;
			}
		}
		return null;
	}

	public static TiRecurrenceFrequencyType fromRfcStringId(String value)
	{
		for (TiRecurrenceFrequencyType nextObject : TiRecurrenceFrequencyType.values()) {
			if ((nextObject != null) && (nextObject.rfcStringId.equals(value))) {
				return nextObject;
			}
		}
		return null;
	}
}
