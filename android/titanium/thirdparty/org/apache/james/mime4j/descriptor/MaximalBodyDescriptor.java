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

import java.io.StringReader;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.apache.james.mime4j.MimeException;
import org.apache.james.mime4j.field.datetime.DateTime;
import org.apache.james.mime4j.field.datetime.parser.DateTimeParser;
import org.apache.james.mime4j.field.datetime.parser.ParseException;
import org.apache.james.mime4j.field.language.ContentLanguageParser;
import org.apache.james.mime4j.field.mimeversion.MimeVersionParser;
import org.apache.james.mime4j.field.structured.StructuredFieldParser;
import org.apache.james.mime4j.util.MimeUtil;


/**
 * Parses and stores values for standard MIME header values.
 *
 */
public class MaximalBodyDescriptor extends DefaultBodyDescriptor implements RFC2045MimeDescriptor,
        RFC2183ContentDispositionDescriptor, RFC3066ContentLanguageDescriptor, RFC2557ContentLocationDescriptor, RFC1864ContentMD5Descriptor {

    private static final int DEFAULT_MINOR_VERSION = 0;
    private static final int DEFAULT_MAJOR_VERSION = 1;
    private boolean isMimeVersionSet;
    private int mimeMinorVersion;
    private int mimeMajorVersion;
    private MimeException mimeVersionException;
    private String contentId;
    private boolean isContentIdSet;
    private String contentDescription;
    private boolean isContentDescriptionSet;
    private String contentDispositionType;
    private Map contentDispositionParameters;
    private DateTime contentDispositionModificationDate;
    private MimeException contentDispositionModificationDateParseException;
    private DateTime contentDispositionCreationDate;
    private MimeException contentDispositionCreationDateParseException;
    private DateTime contentDispositionReadDate;
    private MimeException contentDispositionReadDateParseException;
    private long contentDispositionSize;
    private MimeException contentDispositionSizeParseException;
    private boolean isContentDispositionSet;
    private List contentLanguage;
    private MimeException contentLanguageParseException;
    private boolean isContentLanguageSet;
    private MimeException contentLocationParseException;
    private String contentLocation;
    private boolean isContentLocationSet;
    private String contentMD5Raw;
    private boolean isContentMD5Set;

    protected MaximalBodyDescriptor() {
        this(null);
    }

    public MaximalBodyDescriptor(BodyDescriptor parent) {
        super(parent);
        isMimeVersionSet = false;
        mimeMajorVersion = DEFAULT_MAJOR_VERSION;
        mimeMinorVersion = DEFAULT_MINOR_VERSION;
        this.contentId = null;
        this.isContentIdSet = false;
        this.contentDescription = null;
        this.isContentDescriptionSet = false;
        this.contentDispositionType = null;
        this.contentDispositionParameters = Collections.EMPTY_MAP;
        this.contentDispositionModificationDate = null;
        this.contentDispositionModificationDateParseException = null;
        this.contentDispositionCreationDate = null;
        this.contentDispositionCreationDateParseException = null;
        this.contentDispositionReadDate = null;
        this.contentDispositionReadDateParseException = null;
        this.contentDispositionSize = -1;
        this.contentDispositionSizeParseException = null;
        this.isContentDispositionSet = false;
        this.contentLanguage = null;
        this.contentLanguageParseException = null;
        this.isContentIdSet = false;
        this.contentLocation = null;
        this.contentLocationParseException = null;
        this.isContentLocationSet = false;
        this.contentMD5Raw = null;
        this.isContentMD5Set = false;
    }

    public void addField(String name, String value) {
        name = name.trim().toLowerCase();
        if (MimeUtil.MIME_HEADER_MIME_VERSION.equals(name) && !isMimeVersionSet) {
            parseMimeVersion(value);
        } else if (MimeUtil.MIME_HEADER_CONTENT_ID.equals(name) && !isContentIdSet) {
            parseContentId(value);
        } else if (MimeUtil.MIME_HEADER_CONTENT_DESCRIPTION.equals(name) && !isContentDescriptionSet) {
            parseContentDescription(value);
        } else if (MimeUtil.MIME_HEADER_CONTENT_DISPOSITION.equals(name) && !isContentDispositionSet) {
            parseContentDisposition(value);
        } else if (MimeUtil.MIME_HEADER_LANGAUGE.equals(name) && !isContentLanguageSet) {
            parseLanguage(value);
        } else if (MimeUtil.MIME_HEADER_LOCATION.equals(name) && !isContentLocationSet) {
            parseLocation(value);
        } else if (MimeUtil.MIME_HEADER_MD5.equals(name) && !isContentMD5Set) {
            parseMD5(value);
        } else {
            super.addField(name, value);
        }
    }

    private void parseMD5(String value) {
        isContentMD5Set = true;
        if (value != null) {
            contentMD5Raw = value.trim();
        }
    }

    private void parseLocation(final String value) {
        isContentLocationSet = true;
        if (value != null) {
            final StringReader stringReader = new StringReader(value);
            final StructuredFieldParser parser = new StructuredFieldParser(stringReader);
            parser.setFoldingPreserved(false);
            try {
                contentLocation = parser.parse();
            } catch (MimeException e) {
                contentLocationParseException = e;
            }
        }
    }

    private void parseLanguage(final String value) {
        isContentLanguageSet = true;
        if (value != null) {
            try {
                final ContentLanguageParser parser = new ContentLanguageParser(new StringReader(value));
                contentLanguage = parser.parse();
            } catch (MimeException e) {
                contentLanguageParseException = e;
            }
        }
    }

    private void parseContentDisposition(final String value) {
        isContentDispositionSet = true;
        contentDispositionParameters = MimeUtil.getHeaderParams(value);
        contentDispositionType = (String) contentDispositionParameters.get("");

        final String contentDispositionModificationDate
            = (String) contentDispositionParameters.get(MimeUtil.PARAM_MODIFICATION_DATE);
        if (contentDispositionModificationDate != null) {
            try {
                this.contentDispositionModificationDate = parseDate(contentDispositionModificationDate);
            } catch (ParseException e) {
                this.contentDispositionModificationDateParseException = e;
            }
        }

        final String contentDispositionCreationDate
            = (String) contentDispositionParameters.get(MimeUtil.PARAM_CREATION_DATE);
        if (contentDispositionCreationDate != null) {
            try {
                this.contentDispositionCreationDate = parseDate(contentDispositionCreationDate);
            } catch (ParseException e) {
                this.contentDispositionCreationDateParseException = e;
            }
        }

        final String contentDispositionReadDate
            = (String) contentDispositionParameters.get(MimeUtil.PARAM_READ_DATE);
        if (contentDispositionReadDate != null) {
            try {
                this.contentDispositionReadDate = parseDate(contentDispositionReadDate);
            } catch (ParseException e) {
                this.contentDispositionReadDateParseException = e;
            }
        }

        final String size = (String) contentDispositionParameters.get(MimeUtil.PARAM_SIZE);
        if (size != null) {
            try {
                contentDispositionSize = Long.parseLong(size);
            } catch (NumberFormatException e) {
                this.contentDispositionSizeParseException = (MimeException) new MimeException(e.getMessage(), e).fillInStackTrace();
            }
        }
        contentDispositionParameters.remove("");
    }

    private DateTime parseDate(final String date) throws ParseException {
        final StringReader stringReader = new StringReader(date);
        final DateTimeParser parser = new DateTimeParser(stringReader);
        DateTime result = parser.date_time();
        return result;
    }

    private void parseContentDescription(String value) {
        if (value == null) {
            contentDescription = "";
        } else {
            contentDescription = value.trim();
        }
        isContentDescriptionSet = true;
    }

    private void parseContentId(final String value) {
        if (value == null) {
            contentId = "";
        } else {
            contentId = value.trim();
        }
        isContentIdSet = true;
    }

    private void parseMimeVersion(String value) {
        final StringReader reader = new StringReader(value);
        final MimeVersionParser parser = new MimeVersionParser(reader);
        try {
            parser.parse();
            final int major = parser.getMajorVersion();
            if (major != MimeVersionParser.INITIAL_VERSION_VALUE) {
                mimeMajorVersion = major;
            }
            final int minor = parser.getMinorVersion();
            if (minor != MimeVersionParser.INITIAL_VERSION_VALUE) {
                mimeMinorVersion = minor;
            }
        } catch (MimeException e) {
            this.mimeVersionException = e;
        }
        isMimeVersionSet = true;
    }

    /**
     * @see org.apache.james.mime4j.descriptor.RFC2045MimeDescriptor#getMimeMajorVersion()
     */
    public int getMimeMajorVersion() {
        return mimeMajorVersion;
    }

    /**
     * @see org.apache.james.mime4j.descriptor.RFC2045MimeDescriptor#getMimeMinorVersion()
     */
    public int getMimeMinorVersion() {
        return mimeMinorVersion;
    }

    /**
     * @see org.apache.james.mime4j.descriptor.RFC2045MimeDescriptor#getMimeVersionParseException()
     */
    public MimeException getMimeVersionParseException() {
        return mimeVersionException;
    }

    /**
     * @see org.apache.james.mime4j.descriptor.RFC2045MimeDescriptor#getContentDescription()
     */
    public String getContentDescription() {
        return contentDescription;
    }

    /**
     * @see org.apache.james.mime4j.descriptor.RFC2045MimeDescriptor#getContentId()
     */
    public String getContentId() {
        return contentId;
    }

    /**
     * @see org.apache.james.mime4j.descriptor.RFC2183ContentDispositionDescriptor#getContentDispositionType()
     */
    public String getContentDispositionType() {
        return contentDispositionType;
    }

    /**
     * @see org.apache.james.mime4j.descriptor.RFC2183ContentDispositionDescriptor#getContentDispositionParameters()
     */
    public Map getContentDispositionParameters() {
        return contentDispositionParameters;
    }

    /**
     * @see org.apache.james.mime4j.descriptor.RFC2183ContentDispositionDescriptor#getContentDispositionFilename()
     */
    public String getContentDispositionFilename() {
        return (String) contentDispositionParameters.get(MimeUtil.PARAM_FILENAME);
    }

    /**
     * @see org.apache.james.mime4j.descriptor.RFC2183ContentDispositionDescriptor#getContentDispositionModificationDate()
     */
    public DateTime getContentDispositionModificationDate() {
        return contentDispositionModificationDate;
    }

    /**
     * @see org.apache.james.mime4j.descriptor.RFC2183ContentDispositionDescriptor#getContentDispositionModificationDateParseException()
     */
    public MimeException getContentDispositionModificationDateParseException() {
        return contentDispositionModificationDateParseException;
    }

    /**
     * @see org.apache.james.mime4j.descriptor.RFC2183ContentDispositionDescriptor#getContentDispositionCreationDate()
     */
    public DateTime getContentDispositionCreationDate() {
        return contentDispositionCreationDate;
    }

    /**
     * @see org.apache.james.mime4j.descriptor.RFC2183ContentDispositionDescriptor#getContentDispositionCreationDateParseException()
     */
    public MimeException getContentDispositionCreationDateParseException() {
        return contentDispositionCreationDateParseException;
    }

    /**
     * @see org.apache.james.mime4j.descriptor.RFC2183ContentDispositionDescriptor#getContentDispositionReadDate()
     */
    public DateTime getContentDispositionReadDate() {
        return contentDispositionReadDate;
    }

    /**
     * @see org.apache.james.mime4j.descriptor.RFC2183ContentDispositionDescriptor#getContentDispositionReadDateParseException()
     */
    public MimeException getContentDispositionReadDateParseException() {
        return contentDispositionReadDateParseException;
    }

    /**
     * @see org.apache.james.mime4j.descriptor.RFC2183ContentDispositionDescriptor#getContentDispositionSize()
     */
    public long getContentDispositionSize() {
        return contentDispositionSize;
    }

    /**
     * @see org.apache.james.mime4j.descriptor.RFC2183ContentDispositionDescriptor#getContentDispositionSizeParseException()
     */
    public MimeException getContentDispositionSizeParseException() {
        return contentDispositionSizeParseException;
    }

    /**
     * @see org.apache.james.mime4j.descriptor.RFC3066ContentLanguageDescriptor#getContentLanguage()
     */
    public List getContentLanguage() {
        return contentLanguage;
    }

    /**
     * @see org.apache.james.mime4j.descriptor.RFC3066ContentLanguageDescriptor#getContentLanguageParseException()
     */
    public MimeException getContentLanguageParseException() {
        return contentLanguageParseException;
    }

    /**
     * @see org.apache.james.mime4j.descriptor.RFC2557ContentLocationDescriptor#getContentLocation()
     */
    public String getContentLocation() {
        return contentLocation;
    }

    /**
     * @see org.apache.james.mime4j.descriptor.RFC2557ContentLocationDescriptor#getContentLocationParseException()
     */
    public MimeException getContentLocationParseException() {
        return contentLocationParseException;
    }

    /**
     * @see org.apache.james.mime4j.descriptor.RFC1864ContentMD5Descriptor#getContentMD5Raw()
     */
    public String getContentMD5Raw() {
        return contentMD5Raw;
    }


}
