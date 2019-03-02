/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

/**
 * Provides a safe means of casting an object via an as() method, similar to how the "as" keyword is
 * used in C#, Swift, Rust, etc. This means if the object cannot be cast to the given type, then
 * the as() method will return null.
 * <p>
 * Example Usage:
 * <pre>
 *	String result;
 * 
 *	result = TiCast.as("Test", String.class);
 *	if (result != null) {
 *		// Was safely cast to a String type.
 *	}
 *
 *	result = TiCast.as(new Integer(1), String.class);
 *	if (result == null) {
 *		// Will be null since Integer cannot be cast to a String.
 *	}
 * </pre>
 */
public class TiCast
{
	/** Object value boxed by this class to be casted by the as() method. Can be null. */
	private Object value;

	/**
	 * Private constructor used to box a given object value to be casted later.
	 * @param value Object value to be casted by the as() method later. Can be null.
	 */
	private TiCast(Object value)
	{
		this.value = value;
	}

	/**
	 * Gets the object value given to the TiCast.from() static method.
	 * @return Returns the object value stored by this instance. Can be null.
	 */
	public Object getObject()
	{
		return this.value;
	}

	/**
	 * Safely casts the stored object to the given type.
	 * @param type The class type to cast the 1st argument type such as "String.class", "List.class", etc.
	 * @return
	 * Returns the object casted to the given type if successful.
	 * <p>
	 * Returns null if the given object cannot be cast to the given type or if given a null argument.
	 */
	public <T> T as(Class<T> type)
	{
		return TiCast.as(this.value, type);
	}

	/**
	 * Safely casts the given object to the given type.
	 * @param value The object to be cast. Can be null.
	 * @param type The class type to cast the 1st argument type such as "String.class", "List.class", etc.
	 * @return
	 * Returns the object casted to the given type if successful.
	 * <p>
	 * Returns null if the given object cannot be cast to the given type or if given a null argument.
	 */
	public static <T> T as(Object value, Class<T> type)
	{
		if ((value != null) && (type != null)) {
			if (type.isInstance(value)) {
				return (T) value;
			}
		}
		return null;
	}

	/**
	 * Boxes the given object value and returns a "TiCast" instance type.
	 * Returned type can then be used to call the as() instance method.
	 * @param value The object value to be casted later by the TiCast instance's as() method. Can be null.
	 * @return Returns a new TiCast instance whose getObject() method will return the given "value" argument.
	 */
	public static TiCast from(Object value)
	{
		return new TiCast(value);
	}
}
