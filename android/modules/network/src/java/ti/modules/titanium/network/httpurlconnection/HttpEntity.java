/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Copied and modified from Apache's HTTPClient implementation (APL2 license):
 * org.apache.http.HttpEntity
 */

package ti.modules.titanium.network.httpurlconnection;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * An entity that can be sent or received with an HTTP message.
 * Entities can be found in some
 * {@link HttpEntityEnclosingRequest requests} and in
 * {@link HttpResponse responses}, where they are optional.
 * <p>
 * There are three distinct types of entities in HttpCore,
 * depending on where their {@link #getContent content} originates:
 * <ul>
 * <li><b>streamed</b>: The content is received from a stream, or
 *     generated on the fly. In particular, this category includes
 *     entities being received from a {@link HttpConnection connection}.
 *     {@link #isStreaming Streamed} entities are generally not
 *      {@link #isRepeatable repeatable}.
 *     </li>
 * <li><b>self-contained</b>: The content is in memory or obtained by
 *     means that are independent from a connection or other entity.
 *     Self-contained entities are generally {@link #isRepeatable repeatable}.
 *     </li>
 * <li><b>wrapping</b>: The content is obtained from another entity.
 *     </li>
 * </ul>
 * This distinction is important for connection management with incoming
 * entities. For entities that are created by an application and only sent
 * using the HTTP components framework, the difference between streamed
 * and self-contained is of little importance. In that case, it is suggested
 * to consider non-repeatable entities as streamed, and those that are
 * repeatable (without a huge effort) as self-contained.
 *
 * @since 4.0
 */
public interface HttpEntity {

	/**
	 * Tells the length of the content, if known.
	 *
	 * @return  the number of bytes of the content, or
	 *          a negative number if unknown. If the content length is known
	 *          but exceeds {@link java.lang.Long#MAX_VALUE Long.MAX_VALUE},
	 *          a negative number is returned.
	 */
	long getContentLength();

	/**
	 * Obtains the Content-Type header, if known.
	 * This is the header that should be used when sending the entity,
	 * or the one that was received with the entity. It can include a
	 * charset attribute.
	 *
	 * @return  the Content-Type header for this entity, or
	 *          <code>null</code> if the content type is unknown
	 */
	Header getContentType();

	/**
	 * Obtains the Content-Encoding header, if known.
	 * This is the header that should be used when sending the entity,
	 * or the one that was received with the entity.
	 * Wrapping entities that modify the content encoding should
	 * adjust this header accordingly.
	 *
	 * @return  the Content-Encoding header for this entity, or
	 *          <code>null</code> if the content encoding is unknown
	 */
	Header getContentEncoding();

	/**
	 * Returns a content stream of the entity.
	 * {@link #isRepeatable Repeatable} entities are expected
	 * to create a new instance of {@link InputStream} for each invocation
	 * of this method and therefore can be consumed multiple times.
	 * Entities that are not {@link #isRepeatable repeatable} are expected
	 * to return the same {@link InputStream} instance and therefore
	 * may not be consumed more than once.
	 * <p>
	 * IMPORTANT: Please note all entity implementations must ensure that
	 * all allocated resources are properly deallocated after
	 * the {@link InputStream#close()} method is invoked.
	 *
	 * @return content stream of the entity.
	 *
	 * @throws IOException if the stream could not be created
	 * @throws IllegalStateException
	 *  if content stream cannot be created.
	 *
	 * @see #isRepeatable()
	 */
	InputStream getContent() throws IOException, IllegalStateException;

	/**
	 * Writes the entity content out to the output stream.
	 * <p>
	 * <p>
	 * IMPORTANT: Please note all entity implementations must ensure that
	 * all allocated resources are properly deallocated when this method
	 * returns.
	 *
	 * @param outstream the output stream to write entity content to
	 *
	 * @throws IOException if an I/O error occurs
	 */
	void writeTo(OutputStream outstream) throws IOException;
}
