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

import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * InputStream that shields its underlying input stream from
 * being closed.
 * 
 * @deprecated This class will be removed in 0.6 release
 */
public class CloseShieldInputStream extends FilterInputStream {

    public CloseShieldInputStream(InputStream is) {
        super(is);
    }

    public InputStream getUnderlyingStream() {
        return in;
    }

    /**
     * @see java.io.InputStream#read()
     */
    public int read() throws IOException {
        checkIfClosed();
        return in.read();
    }

    /**
     * @see java.io.InputStream#available()
     */
    public int available() throws IOException {
        checkIfClosed();
        return in.available();
    }

    
    /**
     * Set the underlying InputStream to null
     */
    public void close() throws IOException {
        in = null;
    }

    /**
     * @see java.io.FilterInputStream#reset()
     */
    public synchronized void reset() throws IOException {
        checkIfClosed();
        in.reset();
    }

    /**
     * @see java.io.FilterInputStream#markSupported()
     */
    public boolean markSupported() {
        if (in == null)
            return false;
        return in.markSupported();
    }

    /**
     * @see java.io.FilterInputStream#mark(int)
     */
    public synchronized void mark(int readlimit) {
        if (in != null)
            in.mark(readlimit);
    }

    /**
     * @see java.io.FilterInputStream#skip(long)
     */
    public long skip(long n) throws IOException {
        checkIfClosed();
        return in.skip(n);
    }

    /**
     * @see java.io.FilterInputStream#read(byte[])
     */
    public int read(byte b[]) throws IOException {
        checkIfClosed();
        return in.read(b);
    }

    /**
     * @see java.io.FilterInputStream#read(byte[], int, int)
     */
    public int read(byte b[], int off, int len) throws IOException {
        checkIfClosed();
        return in.read(b, off, len);
    }

    /**
     * Check if the underlying InputStream is null. If so throw an Exception
     * 
     * @throws IOException if the underlying InputStream is null
     */
    private void checkIfClosed() throws IOException {
        if (in == null)
            throw new IOException("Stream is closed");
    }
}
