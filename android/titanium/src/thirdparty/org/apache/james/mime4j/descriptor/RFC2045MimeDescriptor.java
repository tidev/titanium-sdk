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

import org.apache.james.mime4j.MimeException;

/**
 * Describes standard <a href='http://www.faqs.org/rfcs/rfc2045.html' rel='tag'>RFC2045</a>
 * headers.
 */
public interface RFC2045MimeDescriptor extends ContentDescriptor {

    /**
     * Gets the MIME major version
     * as specified by the <code>MIME-Version</code>
     * header.
     * Defaults to one.
     * @return positive integer
     */
    public abstract int getMimeMajorVersion();

    /**
     * Gets the MIME minor version
     * as specified by the <code>MIME-Version</code>
     * header. 
     * Defaults to zero.
     * @return positive integer
     */
    public abstract int getMimeMinorVersion();

    /**
     * When the MIME version header exists but cannot be parsed
     * this field will be contain the exception.
     * @return <code>MimeException</code> if the mime header cannot
     * be parsed, null otherwise
     */
    public abstract MimeException getMimeVersionParseException();

    /**
     * Gets the value of the <a href='http://www.faqs.org/rfcs/rfc2045'>RFC</a> 
     * <code>Content-Description</code> header.
     * @return value of the <code>Content-Description</code> when present,
     * null otherwise
     */
    public abstract String getContentDescription();

    /**
     * Gets the value of the <a href='http://www.faqs.org/rfcs/rfc2045'>RFC</a> 
     * <code>Content-ID</code> header.
     * @return value of the <code>Content-ID</code> when present,
     * null otherwise
     */
    public abstract String getContentId();

}