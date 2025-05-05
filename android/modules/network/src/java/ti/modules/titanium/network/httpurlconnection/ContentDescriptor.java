/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Copied and modified from Apache's HTTPClient implementation (APL2 license):
 * org.apache.http.entity.mime.content.ContentDescriptor
 */

package ti.modules.titanium.network.httpurlconnection;

/**
 * Represents common content properties.
 */
public interface ContentDescriptor {

	/**
	 * Returns the body descriptors MIME type.
	 * @see #getMediaType()
	 * @see #getSubType()
	 * @return The MIME type, which has been parsed from the
	 *   content-type definition. Must not be null, but
	 *   "text/plain", if no content-type was specified.
	 */
	String getMimeType();

	/**
	 * Gets the defaulted MIME media type for this content.
	 * For example <code>TEXT</code>, <code>IMAGE</code>, <code>MULTIPART</code>
	 * @see #getMimeType()
	 * @return the MIME media type when content-type specified,
	 * otherwise the correct default (<code>TEXT</code>)
	 */
	String getMediaType();

	/**
	 * Gets the defaulted MIME sub type for this content.
	 * @see #getMimeType()
	 * @return the MIME media type when content-type is specified,
	 * otherwise the correct default (<code>PLAIN</code>)
	 */
	String getSubType();

	/**
	 * <p>The body descriptors character set, defaulted appropriately for the MIME type.</p>
	 * <p>
	 * For <code>TEXT</code> types, this will be defaulted to <code>us-ascii</code>.
	 * For other types, when the charset parameter is missing this property will be null.
	 * </p>
	 * @return Character set, which has been parsed from the
	 *   content-type definition. Not null for <code>TEXT</code> types, when unset will
	 *   be set to default <code>us-ascii</code>. For other types, when unset,
	 *   null will be returned.
	 */
	String getCharset();

	/**
	 * Returns the body descriptors transfer encoding.
	 * @return The transfer encoding. Must not be null, but "7bit",
	 *   if no transfer-encoding was specified.
	 */
	String getTransferEncoding();

	/**
	 * Returns the body descriptors content-length.
	 * @return Content length, if known, or -1, to indicate the absence of a
	 *   content-length header.
	 */
	long getContentLength();
}
