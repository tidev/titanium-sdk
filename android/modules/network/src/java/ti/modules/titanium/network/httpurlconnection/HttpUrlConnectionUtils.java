/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Copied and modified from Apache's HTTPClient implementation (APL2 license):
 * org.apache.http.protocol.HTTP
 * org.apache.http.entity.mime.MultipartEntity
 * org.apache.http.client.utils.URLEncodedUtils
 */
package ti.modules.titanium.network.httpurlconnection;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.List;
import java.util.Random;
public class HttpUrlConnectionUtils
{

	public static final String CONTENT_TYPE_X_WWW_FORM_URLENCODED = "application/x-www-form-urlencoded";
	private static final String PARAMETER_SEPARATOR = "&";
	private static final String NAME_VALUE_SEPARATOR = "=";

	/** Common charset definitions */
	public static final String UTF_8 = "UTF-8";
	public static final String ISO_8859_1 = "ISO-8859-1";

	/** Default charsets */
	public static final String DEFAULT_CONTENT_CHARSET = ISO_8859_1;

	/** Content type definitions */
	public final static String PLAIN_TEXT_TYPE = "text/plain";
	public final static String CHARSET_PARAM = "; charset=";

	/**
	 * Returns a String that is suitable for use as an <code>application/x-www-form-urlencoded</code>
	 * list of parameters in an HTTP PUT or HTTP POST.
	 *
	 * @param parameters  The parameters to include.
	 * @param encoding The encoding to use.
	 */
	public static String format(final List<? extends NameValuePair> parameters, final String encoding)
	{
		final StringBuilder result = new StringBuilder();
		for (final NameValuePair parameter : parameters) {
			final String encodedName = encode(parameter.getName(), encoding);
			final String value = parameter.getValue();
			final String encodedValue = value != null ? encode(value, encoding) : "";
			if (result.length() > 0) {
				result.append(PARAMETER_SEPARATOR);
			}
			result.append(encodedName);
			result.append(NAME_VALUE_SEPARATOR);
			result.append(encodedValue);
		}
		return result.toString();
	}

	private static String encode(final String content, final String encoding)
	{
		try {
			return URLEncoder.encode(content, encoding != null ? encoding : DEFAULT_CONTENT_CHARSET);
		} catch (UnsupportedEncodingException problem) {
			throw new IllegalArgumentException(problem);
		}
	}

	public static String generateBoundary()
	{
		StringBuilder buffer = new StringBuilder();
		Random rand = new Random();
		int count = rand.nextInt(11) + 30; // a random size from 30 to 40
		for (int i = 0; i < count; i++) {
			buffer.append(MULTIPART_CHARS[rand.nextInt(MULTIPART_CHARS.length)]);
		}
		return buffer.toString();
	}

	private final static char[] MULTIPART_CHARS =
		"-_1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".toCharArray();
}
