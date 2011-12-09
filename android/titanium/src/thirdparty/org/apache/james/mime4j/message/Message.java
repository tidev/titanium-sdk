/****************************************************************
 * Licensed to the Apache Software Foundation (ASF) under one   *
 * or more contributor license agreements.  See the NOTICE file *
 * distributed with this work for additional information        *
 * regarding copyright ownership.  The ASF licenses this file   *
 * to you under the Apache License, Version 2.0 (the            *
 * "License"); you may not use this file except in compliance   *
 * with the License.  You may obtain a copy of the License at   *
 *                                                              *
 *   http://www.apache.org/licenses/LICENSE-2.0                 *
 *                                                              *
 * Unless required by applicable law or agreed to in writing,   *
 * software distributed under the License is distributed on an  *
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY       *
 * KIND, either express or implied.  See the License for the    *
 * specific language governing permissions and limitations      *
 * under the License.                                           *
 ****************************************************************/

package org.apache.james.mime4j.message;

import java.io.IOException;
import java.io.InputStream;

import org.apache.james.mime4j.MimeException;
import org.apache.james.mime4j.field.Field;
import org.apache.james.mime4j.field.UnstructuredField;
import org.apache.james.mime4j.parser.MimeEntityConfig;
import org.apache.james.mime4j.parser.MimeStreamParser;


/**
 * Represents a MIME message. The following code parses a stream into a 
 * <code>Message</code> object.
 * 
 * <pre>
 *      Message msg = new Message(new FileInputStream("mime.msg"));
 * </pre>
 * 
 *
 * 
 * @version $Id: Message.java,v 1.3 2004/10/02 12:41:11 ntherning Exp $
 */
public class Message extends Entity implements Body {
    
    /**
     * Creates a new empty <code>Message</code>.
     */
    public Message() {
    }
    
    /**
     * Parses the specified MIME message stream into a <code>Message</code>
     * instance using given {@link MimeEntityConfig}.
     * 
     * @param is the stream to parse.
     * @throws IOException on I/O errors.
     */
    public Message(InputStream is, MimeEntityConfig config) throws MimeException, IOException {
        MimeStreamParser parser = new MimeStreamParser(config);
        parser.setContentHandler(new MessageBuilder(this));
        parser.parse(is);
    }

    /**
     * Parses the specified MIME message stream into a <code>Message</code>
     * instance.
     * 
     * @param is the stream to parse.
     * @throws IOException on I/O errors.
     */
    public Message(InputStream is) throws IOException {
        this(is, null);
    }
    
    /**
     * Gets the <code>Subject</code> field.
     * 
     * @return the <code>Subject</code> field or <code>null</code> if it
     *         doesn't exist.
     */
    public UnstructuredField getSubject() {
        return (UnstructuredField) getHeader().getField(Field.SUBJECT);
    }
    
}
