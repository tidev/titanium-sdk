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
 * Input buffer that can be used to search for patterns using Quick Search 
 * algorithm in data read from an {@link InputStream}. 
 */
public class BufferedLineReaderInputStream extends LineReaderInputStream {

    private byte[] buffer;
    
    private int bufpos;
    private int buflen;
    
    private final int maxLineLen;
    
    public BufferedLineReaderInputStream(
            final InputStream instream, 
            int buffersize,
            int maxLineLen) {
        super(instream);
        if (instream == null) {
            throw new IllegalArgumentException("Input stream may not be null");
        }
        if (buffersize <= 0) {
            throw new IllegalArgumentException("Buffer size may not be negative or zero");
        }
        this.buffer = new byte[buffersize];
        this.bufpos = 0;
        this.buflen = 0;
        this.maxLineLen = maxLineLen;
    }

    public BufferedLineReaderInputStream(
            final InputStream instream, 
            int buffersize) {
        this(instream, buffersize, -1);
    }

    private void expand(int newlen) {
        byte newbuffer[] = new byte[newlen];
        int len = this.buflen - this.bufpos;
        if (len > 0) {
            System.arraycopy(this.buffer, this.bufpos, newbuffer, this.bufpos, len);
        }
        this.buffer = newbuffer;
    }
    
    public void ensureCapacity(int len) {
        if (len > this.buffer.length) {
            expand(len);
        }
    }
    
    public int fillBuffer() throws IOException {
        // compact the buffer if necessary
        if (this.bufpos > 0) {
            int len = this.buflen - this.bufpos;
            if (len > 0) {
                System.arraycopy(this.buffer, this.bufpos, this.buffer, 0, len);
            }
            this.bufpos = 0;
            this.buflen = len;
        }
        int l;
        int off = this.buflen;
        int len = this.buffer.length - off;
        l = in.read(this.buffer, off, len);
        if (l == -1) {
            return -1;
        } else {
            this.buflen = off + l;
            return l;
        }
    }

    public boolean hasBufferedData() {
        return this.bufpos < this.buflen;
    }

    public int read() throws IOException {
        int noRead = 0;
        while (!hasBufferedData()) {
            noRead = fillBuffer();
            if (noRead == -1) {
                return -1;
            }
        }
        return this.buffer[this.bufpos++] & 0xff;
    }
    
    public int read(final byte[] b, int off, int len) throws IOException {
        if (b == null) {
            return 0;
        }
        int noRead = 0;
        while (!hasBufferedData()) {
            noRead = fillBuffer();
            if (noRead == -1) {
                return -1;
            }
        }
        int chunk = this.buflen - this.bufpos;
        if (chunk > len) {
            chunk = len;
        }
        System.arraycopy(this.buffer, this.bufpos, b, off, chunk);
        this.bufpos += chunk;
        return chunk;
    }
    
    public int read(final byte[] b) throws IOException {
        if (b == null) {
            return 0;
        }
        return read(b, 0, b.length);
    }
    
    public boolean markSupported() {
        return false;
    }

    
    public int readLine(final ByteArrayBuffer dst) throws IOException {
        if (dst == null) {
            throw new IllegalArgumentException("Buffer may not be null");
        }
        int total = 0;
        boolean found = false;
        int bytesRead = 0;
        while (!found) {
            if (!hasBufferedData()) {
                bytesRead = fillBuffer();
                if (bytesRead == -1) {
                    break;
                }
            }
            int i = indexOf((byte)'\n');
            int chunk;
            if (i != -1) {
                found = true;
                chunk = i + 1 - pos();
            } else {
                chunk = length();
            }
            if (chunk > 0) {
                dst.append(buf(), pos(), chunk);
                skip(chunk);
                total += chunk;
            }
            if (this.maxLineLen > 0 && dst.length() >= this.maxLineLen) {
                throw new MaxLineLimitException("Maximum line length limit exceeded");
            }
        }
        if (total == 0 && bytesRead == -1) {
            return -1;
        } else {
            return total;
        }
    }

    /**
     * Implements quick search algorithm as published by
     * <p> 
     * SUNDAY D.M., 1990, 
     * A very fast substring search algorithm, 
     * Communications of the ACM . 33(8):132-142.
     * </p>
     */
    public int indexOf(final byte[] pattern, int off, int len) {
        if (pattern == null) {
            throw new IllegalArgumentException("Pattern may not be null");
        }
        if (off < this.bufpos || len < 0 || off + len > this.buflen) {
            throw new IndexOutOfBoundsException();
        }
        if (len < pattern.length) {
            return -1;
        }
        
        int[] shiftTable = new int[256];
        for (int i = 0; i < shiftTable.length; i++) {
            shiftTable[i] = pattern.length + 1;
        }
        for (int i = 0; i < pattern.length; i++) {
            int x = pattern[i] & 0xff;
            shiftTable[x] = pattern.length - i;
        }
        
        int j = 0;
        while (j <= len - pattern.length) {
            int cur = off + j;
            boolean match = true;
            for (int i = 0; i < pattern.length; i++) {
                if (this.buffer[cur + i] != pattern[i]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                return cur;
            }
            
            int pos = cur + pattern.length; 
            if (pos >= this.buffer.length) {
                break;
            }
            int x = this.buffer[pos] & 0xff;
            j += shiftTable[x];
        }
        return -1;
    }
    
    /**
     * Implements quick search algorithm as published by
     * <p> 
     * SUNDAY D.M., 1990, 
     * A very fast substring search algorithm, 
     * Communications of the ACM . 33(8):132-142.
     * </p>
     */
    public int indexOf(final byte[] pattern) {
        return indexOf(pattern, this.bufpos, this.buflen - this.bufpos);
    }

    public int indexOf(byte b, int off, int len) {
        if (off < this.bufpos || len < 0 || off + len > this.buflen) {
            throw new IndexOutOfBoundsException();
        }
        for (int i = off; i < off + len; i++) {
            if (this.buffer[i] == b) {
                return i;
            }
        }
        return -1;
    }
    
    public int indexOf(byte b) {
        return indexOf(b, this.bufpos, this.buflen - this.bufpos);
    }
    
    public byte charAt(int pos) {
        if (pos < this.bufpos || pos > this.buflen) {
            throw new IndexOutOfBoundsException();
        }
        return this.buffer[pos];
    }
    
    public byte[] buf() {
        return this.buffer;        
    }
    
    public int pos() {
        return this.bufpos;
    }
    
    public int limit() {
        return this.buflen;
    }
    
    public int length() {
        return this.buflen - this.bufpos;
    }
    
    public int capacity() {
        return this.buffer.length;
    }
    
    public int skip(int n) {
        int chunk = Math.min(n, this.buflen - this.bufpos);
        this.bufpos += chunk; 
        return chunk;
    }

    public void clear() {
        this.bufpos = 0;
        this.buflen = 0;
    }
    
    public String toString() {
        StringBuffer buffer = new StringBuffer();
        buffer.append("[pos: ");
        buffer.append(this.bufpos);
        buffer.append("]");
        buffer.append("[limit: ");
        buffer.append(this.buflen);
        buffer.append("]");
        buffer.append("[");
        for (int i = this.bufpos; i < this.buflen; i++) {
            buffer.append((char) this.buffer[i]);
        }
        buffer.append("]");
        return buffer.toString();
    }

}
