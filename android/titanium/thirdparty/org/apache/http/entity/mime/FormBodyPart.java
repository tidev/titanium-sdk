/*
 * $HeadURL: https://svn.apache.org/repos/asf/httpcomponents/httpclient/trunk/module-httpmime/src/main/java/org/apache/http/entity/mime/FormBodyPart.java $
 * $Revision: 705898 $
 * $Date: 2008-10-18 19:14:05 +0200 (Sat, 18 Oct 2008) $
 *
 * ====================================================================
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
 * ====================================================================
 *
 * This software consists of voluntary contributions made by many
 * individuals on behalf of the Apache Software Foundation.  For more
 * information on the Apache Software Foundation, please see
 * <http://www.apache.org/>.
 *
 */

package org.apache.http.entity.mime;

import org.apache.http.entity.mime.content.ContentBody;
import org.apache.james.mime4j.MimeException;
import org.apache.james.mime4j.descriptor.ContentDescriptor;
import org.apache.james.mime4j.field.Field;
import org.apache.james.mime4j.message.BodyPart;
import org.apache.james.mime4j.message.Header;

/**
 * An extension of the mime4j standard {@link BodyPart} class that 
 * automatically populates the header with standard fields based 
 * on the content description of the enclosed body.
 * 
 * @author <a href="mailto:oleg at ural.ru">Oleg Kalnichevski</a>
 */
public class FormBodyPart extends BodyPart {

    private final String name;
    
    public FormBodyPart(final String name, final ContentBody body) {
        super();
        if (name == null) {
            throw new IllegalArgumentException("Name may not be null");
        }
        if (body == null) {
            throw new IllegalArgumentException("Body may not be null");
        }
        this.name = name;
        
        Header header = new Header();
        setHeader(header);
        setBody(body);

        generateContentDisp(body);
        generateContentType(body);
        generateTransferEncoding(body);
    }
    
    public String getName() {
        return this.name;
    }
    
    protected void generateContentDisp(final ContentBody body) {
        StringBuilder buffer = new StringBuilder();
        buffer.append(MIME.CONTENT_DISPOSITION);
        buffer.append(": form-data; name=\"");
        buffer.append(getName());
        buffer.append("\"");
        if (body.getFilename() != null) {
            buffer.append("; filename=\"");
            buffer.append(body.getFilename());
            buffer.append("\"");
        }
        addField(buffer.toString());
    }
    
    protected void generateContentType(final ContentDescriptor desc) {
		// JGH NOTE: this seems to be a bug in RoR where it would puke if you
		// send a content-type of text/plain for key/value pairs in form-data
        if (desc.getMimeType() != null && desc.getMimeType().equals("")==false) {
            StringBuilder buffer = new StringBuilder();
            buffer.append(MIME.CONTENT_TYPE);
            buffer.append(": ");
            buffer.append(desc.getMimeType());
            if (desc.getCharset() != null) {
                buffer.append("; charset=");
                buffer.append(desc.getCharset());
            }
            addField(buffer.toString());
        }
    }
    
    protected void generateTransferEncoding(final ContentDescriptor desc) {
        if (desc.getTransferEncoding() != null) {
            StringBuilder buffer = new StringBuilder();
            buffer.append(MIME.CONTENT_TRANSFER_ENC);
            buffer.append(": ");
            buffer.append(desc.getTransferEncoding());
            addField(buffer.toString());
        }
    }

    private void addField(final String s) {
        try {
            getHeader().addField(Field.parse(s));
        } catch (MimeException ex) {
            // Should never happen
            throw new UnexpectedMimeException(ex);
        }
    }
    
}
