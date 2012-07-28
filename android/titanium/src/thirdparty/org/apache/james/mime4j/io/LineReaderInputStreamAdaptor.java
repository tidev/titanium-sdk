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

package org.apache.james.mime4j.io;

import java.io.IOException;
import java.io.InputStream;

import org.apache.james.mime4j.util.ByteArrayBuffer;

/**
 * <code>InputStream</code> used by the MIME parser to detect whether the
 * underlying data stream was used (read from) and whether the end of the 
 * stream was reached.
 * 
 * @version $Id$
 */
public class LineReaderInputStreamAdaptor extends LineReaderInputStream {

    private final LineReaderInputStream bis;
    private final int maxLineLen;
    
    private boolean used = false;
    private boolean eof = false;

    public LineReaderInputStreamAdaptor(
            final InputStream is,
            int maxLineLen) {
        super(is);
        if (is instanceof LineReaderInputStream) {
            this.bis = (LineReaderInputStream) is;
        } else {
            this.bis = null;
        }
        this.maxLineLen = maxLineLen;
    }

    public LineReaderInputStreamAdaptor(
            final InputStream is) {
        this(is, -1);
    }
    
    public int read() throws IOException {
        int i = in.read();
        this.eof = i == -1;
        this.used = true;
        return i;
    }

    public int read(byte[] b, int off, int len) throws IOException {
        int i = in.read(b, off, len);
        this.eof = i == -1;
        this.used = true;
        return i;
    }
    
    public int readLine(final ByteArrayBuffer dst) throws IOException {
        int i;
        if (this.bis != null) {
             i = this.bis.readLine(dst);
        } else {
             i = doReadLine(dst);
        }
        this.eof = i == -1;
        this.used = true;
        return i;
    }

    private int doReadLine(final ByteArrayBuffer dst) throws IOException {
        int total = 0;
        int ch;
        while ((ch = in.read()) != -1) {
            dst.append(ch);
            total++;
            if (this.maxLineLen > 0 && dst.length() >= this.maxLineLen) {
                throw new MaxLineLimitException("Maximum line length limit exceeded");
            }
            if (ch == '\n') {
                break;
            }
        }
        if (total == 0 && ch == -1) {
            return -1;
        } else {
            return total;
        }
    }
    
    public boolean eof() {
        return this.eof;
    }

    public boolean isUsed() {
        return this.used;
    }
    
    public String toString() {
        return "[LineReaderInputStreamAdaptor: " + bis + "]";
    }
}
