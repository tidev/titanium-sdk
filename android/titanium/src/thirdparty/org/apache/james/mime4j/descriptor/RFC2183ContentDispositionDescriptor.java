/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package org.apache.james.mime4j.descriptor;

import java.util.Map;

import org.apache.james.mime4j.MimeException;
import org.apache.james.mime4j.field.datetime.DateTime;

/** 
 * Describes <a href='http://www.faqs.org/rfcs/rfc2183.html'>RFC2183</a>
 * content disposition.
 */
public interface RFC2183ContentDispositionDescriptor {

    /**
     * Gets the disposition type of the <code>content-disposition</code> field.
     * The value is case insensitive and will be converted to lower case.
     * See <a href='http://www.faqs.org/rfcs/rfc2183.html'>RFC2183</a>.
     * @return content disposition type, 
     * or null when this has not been set
     */
    public abstract String getContentDispositionType();

    /**
     * Gets the parameters of the <code>content-disposition</code> field.
     * See <a href='http://www.faqs.org/rfcs/rfc2183.html'>RFC2183</a>.
     * @return parameter value strings indexed by parameter name strings,
     * not null
     */
    public abstract Map getContentDispositionParameters();

    /**
     * Gets the <code>filename</code> parameter value of the <code>content-disposition</code> field.
     * See <a href='http://www.faqs.org/rfcs/rfc2183.html'>RFC2183</a>.
     * @return filename parameter value, 
     * or null when it is not present
     */
    public abstract String getContentDispositionFilename();

    /**
     * Gets the <code>modification-date</code> parameter value of the <code>content-disposition</code> field.
     * See <a href='http://www.faqs.org/rfcs/rfc2183.html'>RFC2183</a>.
     * @return modification-date parameter value,
     * or null when this is not present
     */
    public abstract DateTime getContentDispositionModificationDate();

    /**
     * Gets any exception thrown during the parsing of {@link #getContentDispositionModificationDate()}
     * @return <code>ParseException</code> when the modification-date parse fails,
     * null otherwise
     */
    public abstract MimeException getContentDispositionModificationDateParseException();

    /**
     * Gets the <code>creation-date</code> parameter value of the <code>content-disposition</code> field.
     * See <a href='http://www.faqs.org/rfcs/rfc2183.html'>RFC2183</a>.
     * @return creation-date parameter value,
     * or null when this is not present
     */
    public abstract DateTime getContentDispositionCreationDate();

    /**
     * Gets any exception thrown during the parsing of {@link #getContentDispositionCreationDate()}
     * @return <code>ParseException</code> when the creation-date parse fails,
     * null otherwise
     */
    public abstract MimeException getContentDispositionCreationDateParseException();

    /**
     * Gets the <code>read-date</code> parameter value of the <code>content-disposition</code> field.
     * See <a href='http://www.faqs.org/rfcs/rfc2183.html'>RFC2183</a>.
     * @return read-date parameter value,
     * or null when this is not present
     */
    public abstract DateTime getContentDispositionReadDate();

    /**
     * Gets any exception thrown during the parsing of {@link #getContentDispositionReadDate()}
     * @return <code>ParseException</code> when the read-date parse fails,
     * null otherwise
     */
    public abstract MimeException getContentDispositionReadDateParseException();

    /**
     * Gets the <code>size</code> parameter value of the <code>content-disposition</code> field.
     * See <a href='http://www.faqs.org/rfcs/rfc2183.html'>RFC2183</a>.
     * @return size parameter value,
     * or -1 if this size has not been set
     */
    public abstract long getContentDispositionSize();

    /**
     * Gets any exception thrown during the parsing of {@link #getContentDispositionSize()}
     * @return <code>ParseException</code> when the read-date parse fails,
     * null otherwise
     */
    public abstract MimeException getContentDispositionSizeParseException();

}