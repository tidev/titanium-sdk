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

import org.apache.james.mime4j.MimeException;
import org.apache.james.mime4j.util.CharArrayBuffer;

/**
 * MIME entity configuration
 */
public final class MimeEntityConfig implements Cloneable {

    private boolean maximalBodyDescriptor;
    private boolean strictParsing;
    private int maxLineLen;
    private int maxHeaderCount;
    private long maxContentLen;
    
    public MimeEntityConfig() {
        super();
        this.maximalBodyDescriptor = false;
        this.strictParsing = false;
        this.maxLineLen = 1000;
        this.maxHeaderCount = 1000;
        this.maxContentLen = -1;
    }
    
    public boolean isMaximalBodyDescriptor() {
        return this.maximalBodyDescriptor;
    }
    
    public void setMaximalBodyDescriptor(boolean maximalBodyDescriptor) {
        this.maximalBodyDescriptor = maximalBodyDescriptor;
    }
    
    /**
     * Defines whether minor violations of the MIME specification should be 
     * tolerated or should result in a {@link MimeException}. If this parameter
     * is set to <code>true</code>, a strict interpretation of the MIME 
     * specification will be enforced, If this parameter is set to <code>false</code>
     * minor violations will result in a warning in the log.
     * 
     * @param strictParsing value of the strict parsing mode
     */
    public void setStrictParsing(boolean strictParsing) {
        this.strictParsing = strictParsing;
    }

    /**
     * Returns the value of the strict parsing mode
     * @see #setStrictParsing(boolean)
     * 
     * @return value of the strict parsing mode
     */
    public boolean isStrictParsing() {
        return this.strictParsing;
    }
    
    /**
     * Sets the maximum line length limit. Parsing of a MIME entity will be terminated 
     * with a {@link MimeException} if a line is encountered that exceeds the maximum
     * length limit. If this parameter is set to a non positive value the line length
     * check will be disabled.
     * 
     * @param maxLineLen maximum line length limit
     */
    public void setMaxLineLen(int maxLineLen) {
        this.maxLineLen = maxLineLen;
    }
    
    /** 
     * Returns the maximum line length limit
     * @see #setMaxLineLen(int)
     * 
     * @return value of the the maximum line length limit
     */
    public int getMaxLineLen() {
        return this.maxLineLen;
    }

    /**
     * Sets the maximum header limit. Parsing of a MIME entity will be terminated 
     * with a {@link MimeException} if the number of headers exceeds the maximum
     * limit. If this parameter is set to a non positive value the header limit check 
     * will be disabled.
     * 
     * @param maxHeaderCount maximum header limit
     */
    public void setMaxHeaderCount(int maxHeaderCount) {
        this.maxHeaderCount = maxHeaderCount;
    }

    /** 
     * Returns the maximum header limit
     * @see #setMaxHeaderCount(int)
     * 
     * @return value of the the maximum header limit
     */
    public int getMaxHeaderCount() {
        return this.maxHeaderCount;
    }

    /**
     * Sets the maximum line length limit. Parsing of a MIME entity will be terminated 
     * with a {@link MimeException} if a content body exceeds the maximum length limit. 
     * If this parameter is set to a non positive value the content length
     * check will be disabled.
     * 
     * @param maxLineLen maximum line length limit
     */
    public void setMaxContentLen(long maxContentLen) {
        this.maxContentLen = maxContentLen;
    }

    /** 
     * Returns the maximum content length limit
     * @see #setMaxContentLen(long)
     * 
     * @return value of the the maximum content length limit
     */
    public long getMaxContentLen() {
        return maxContentLen;
    }

    public Object clone() throws CloneNotSupportedException {
        return super.clone();
    }
    
    public String toString() {
        CharArrayBuffer buffer = new CharArrayBuffer(128);
        buffer.append("[max body descriptor: ");
        buffer.append(Boolean.toString(this.maximalBodyDescriptor));
        buffer.append("][strict parsing: ");
        buffer.append(Boolean.toString(this.strictParsing));
        buffer.append("][max header length: ");
        buffer.append(Integer.toString(this.maxLineLen));
        buffer.append("]");
        return buffer.toString();
    }
    
}
