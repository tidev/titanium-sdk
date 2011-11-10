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

package org.apache.james.mime4j.decoder;

import java.io.FilterOutputStream;
import java.io.IOException;
import java.io.OutputStream;


/**
 * Performs Quoted-Printable encoding on an underlying stream.
 */
public class QuotedPrintableOutputStream extends FilterOutputStream {
    
    private QuotedPrintableEncoder encoder;
    private boolean closed = false;

    public QuotedPrintableOutputStream(OutputStream out, boolean binary) {
        super(out);
        encoder = new QuotedPrintableEncoder(CodecUtil.DEFAULT_ENCODING_BUFFER_SIZE, binary);
        encoder.initEncoding(out);
    }

    public void close() throws IOException {
    	if (closed) return;

    	try {
            encoder.completeEncoding();
            // do not close the wrapped stream
    	} finally {
    		closed = true;
    	}
    }

    public void flush() throws IOException {
        encoder.flushOutput();
    }

    public void write(int b) throws IOException {
        this.write(new byte[] { (byte) b }, 0, 1);
    }

    public void write(byte[] b, int off, int len) throws IOException {
        if (closed) {
            throw new IOException("QuotedPrintableOutputStream has been closed");
        }

        encoder.encodeChunk(b, off, len);
    }

}