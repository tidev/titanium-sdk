/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Copied and modified from Apache's HTTPClient implementation (APL2 license):
 * org.apache.http.HeaderElement
 */
package ti.modules.titanium.network.httpurlconnection;

/**
 * One element of an HTTP {@link Header header} value consisting of
 * a name / value pair and a number of optional name / value parameters.
 * <p>
 * Some HTTP headers (such as the set-cookie header) have values that
 * can be decomposed into multiple elements.  Such headers must be in the
 * following form:
 * </p>
 * <pre>
 * header  = [ element ] *( "," [ element ] )
 * element = name [ "=" [ value ] ] *( ";" [ param ] )
 * param   = name [ "=" [ value ] ]
 *
 * name    = token
 * value   = ( token | quoted-string )
 *
 * token         = 1*&lt;any char except "=", ",", ";", &lt;"&gt; and
 *                       white space&gt;
 * quoted-string = &lt;"&gt; *( text | quoted-char ) &lt;"&gt;
 * text          = any char except &lt;"&gt;
 * quoted-char   = "\" char
 * </pre>
 * <p>
 * Any amount of white space is allowed between any part of the
 * header, element or param and is ignored. A missing value in any
 * element or param will be stored as the empty {@link String};
 * if the "=" is also missing <var>null</var> will be stored instead.
 *
 * @since 4.0
 */
public interface HeaderElement {

	/**
	 * Returns header element name.
	 *
	 * @return header element name
	 */
	String getName();

	/**
	 * Returns header element value.
	 *
	 * @return header element value
	 */
	String getValue();

	/**
	 * Returns an array of name / value pairs.
	 *
	 * @return array of name / value pairs
	 */
	NameValuePair[] getParameters();

	/**
	 * Returns the first parameter with the given name.
	 *
	 * @param name parameter name
	 *
	 * @return name / value pair
	 */
	NameValuePair getParameterByName(String name);

	/**
	 * Returns the total count of parameters.
	 *
	 * @return parameter count
	 */
	int getParameterCount();

	/**
	 * Returns parameter with the given index.
	 *
	 * @param index
	 * @return name / value pair
	 */
	NameValuePair getParameter(int index);
}
