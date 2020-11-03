/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.locale;

import java.text.DecimalFormatSymbols;
import java.util.HashMap;
import java.util.Locale;

/**
 * Enum type indicating a specific numbering system such as LATN for latin system which uses 0-9 digits.
 * <p>
 * Provides methods to acquire a numbering system's standard Unicode LDML string ID
 * and the ability to fetch the numbering system from a given locale.
 */
public enum NumberingSystem {
	ARAB("arab", '\u0660'),
	ARABEXT("arabext", '\u06f0'),
	BALI("bali", '\u1b50'),
	BENG("beng", '\u09e6'),
	CHAM("cham", '\uaa50'),
	DEVA("deva", '\u0996'),
	FULLWIDE("fullwide", '\uff10'),
	GUJR("gujr", '\u0ae6'),
	GURU("guru", '\u0a66'),
	JAVA("java", '\ua9d0'),
	KALI("kali", '\ua900'),
	KHMR("khmr", '\u17e0'),
	KNDA("knda", '\u0ce0'),
	LANA("lana", '\u1a80'),
	LANATHAM("lanatham", '\u1a90'),
	LAOO("laoo", '\u0ed0'),
	LATN("latn", '0'),
	LEPC("lepc", '\u1c40'),
	LIMB("limb", '\u1946'),
	MLYM("mlym", '\u0d66'),
	MONG("mong", '\u1810'),
	MTEI("mtei", '\uabf0'),
	MYMR("mymr", '\u1040'),
	MYMRSHAN("mymrshan", '\u1090'),
	NKOO("nkoo", '\u07c0'),
	OLCK("olck", '\u1c50'),
	ORYA("orya", '\u0b66'),
	SAUR("saur", '\ua8d0'),
	SUND("sund", '\u1bb0'),
	TALU("talu", '\u19d0'),
	TAMLDEC("tamldec", '\u0be6'),
	TELU("telu", '\u0c66'),
	THAI("thai", '\u0e50'),
	TIBT("tibt", '\u0f20'),
	VAII("vaii", '\ua620');

	/** Mapping of zero digit characters to NumberingSystem instances for fast lookup. */
	private static HashMap<Character, NumberingSystem> sZeroCharMap;

	/** Unicode LDML (Locale Data Markup Language) BCP-47 string ID. */
	private String ldmlStringId;

	/** Character used to represent the zero digit. */
	private char zeroChar;

	/**
	 * Creates a new numbering system type using the given data.
	 * @param ldmlStringId The Unicode LDML (Locale Data Markup Language) BCP-47 string ID.
	 * @param zeroChar The character used to represent the zero digit.
	 */
	private NumberingSystem(String ldmlStringId, char zeroChar)
	{
		this.ldmlStringId = ldmlStringId;
		this.zeroChar = zeroChar;
	}

	/**
	 * Gets the Unicode LDML (Locale Data Markup Language) BCP-47 string ID for the numbering system.
	 * @return Returns the numbering system's unique string ID.
	 */
	public String toLdmlStringId()
	{
		return this.ldmlStringId;
	}

	/**
	 * Gets the Unicode LDML (Locale Data Markup Language) BCP-47 string ID for the numbering system.
	 * @return Returns the numbering system's unique string ID.
	 */
	@Override
	public String toString()
	{
		return this.ldmlStringId;
	}

	/**
	 * Gets the numbering system used by the given locale.
	 * @param locale The locale to fetch the numbering system from. Can be null.
	 * @return
	 * Returns an existing NumberingSystem enum instance for the given locale.
	 * <p>
	 * Returns null if given a null argument or if locale has an unknown numbering system.
	 */
	public static NumberingSystem from(Locale locale)
	{
		// Validate argument.
		if (locale == null) {
			return null;
		}

		// Initialize mapping of zero digit characters to NumberingSystem types, if not done already.
		if (sZeroCharMap == null) {
			HashMap<Character, NumberingSystem> map = new HashMap<>(64);
			for (NumberingSystem nextObject : NumberingSystem.values()) {
				map.put(nextObject.zeroChar, nextObject);
			}
			sZeroCharMap = map;
		}

		// Fetch numbering system from given locale.
		DecimalFormatSymbols decimalFormatSymbols = DecimalFormatSymbols.getInstance(locale);
		return sZeroCharMap.get(decimalFormatSymbols.getZeroDigit());
	}
}
