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

package org.apache.james.mime4j.parser;

import java.io.IOException;
import java.io.InputStream;

import org.apache.james.mime4j.MimeException;
import org.apache.james.mime4j.descriptor.BodyDescriptor;

/**
 * Abstract <code>ContentHandler</code> with default implementations of all
 * the methods of the <code>ContentHandler</code> interface.
 * 
 * The default is to todo nothing.
 *
 * 
 * @version $Id: AbstractContentHandler.java,v 1.3 2004/10/02 12:41:10 ntherning Exp $
 */
public abstract class AbstractContentHandler implements ContentHandler {
    
    /**
     * @see org.apache.james.mime4j.parser.ContentHandler#endMultipart()
     */
    public void endMultipart() throws MimeException {
    }
    
    /**
     * @see org.apache.james.mime4j.parser.ContentHandler#startMultipart(org.apache.james.mime4j.descriptor.BodyDescriptor)
     */
    public void startMultipart(BodyDescriptor bd) throws MimeException {
    }
    
    /**
     * @see org.apache.james.mime4j.parser.ContentHandler#body(org.apache.james.mime4j.descriptor.BodyDescriptor, java.io.InputStream)
     */
    public void body(BodyDescriptor bd, InputStream is)
            throws MimeException, IOException {
    }
    
    /**
     * @see org.apache.james.mime4j.parser.ContentHandler#endBodyPart()
     */
    public void endBodyPart() throws MimeException {
    }
    
    /**
     * @see org.apache.james.mime4j.parser.ContentHandler#endHeader()
     */
    public void endHeader() throws MimeException {
    }
    
    /**
     * @see org.apache.james.mime4j.parser.ContentHandler#endMessage()
     */
    public void endMessage() throws MimeException {
    }
    
    /**
     * @see org.apache.james.mime4j.parser.ContentHandler#epilogue(java.io.InputStream)
     */
    public void epilogue(InputStream is) throws MimeException, IOException {
    }
    
    /**
     * @see org.apache.james.mime4j.parser.ContentHandler#field(java.lang.String)
     */
    public void field(String fieldData) throws MimeException {
    }
    
    /**
     * @see org.apache.james.mime4j.parser.ContentHandler#preamble(java.io.InputStream)
     */
    public void preamble(InputStream is) throws MimeException, IOException {
    }
    
    /**
     * @see org.apache.james.mime4j.parser.ContentHandler#startBodyPart()
     */
    public void startBodyPart() throws MimeException {
    }
    
    /**
     * @see org.apache.james.mime4j.parser.ContentHandler#startHeader()
     */
    public void startHeader() throws MimeException {
    }
    
    /**
     * @see org.apache.james.mime4j.parser.ContentHandler#startMessage()
     */
    public void startMessage() throws MimeException {
    }
    
    /**
     * @see org.apache.james.mime4j.parser.ContentHandler#raw(java.io.InputStream)
     */
    public void raw(InputStream is) throws MimeException, IOException {
    }

}
