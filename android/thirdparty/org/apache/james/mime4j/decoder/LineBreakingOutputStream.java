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
 * This class take care of inserting a CRLF every lineLength bytes
 * Default to 76 bytes lines.
 * Please note that this does not check for existing newlines and
 * simply adds CRLF every 76 bytes. 
 * 
 * @deprecated This class will be removed in 0.6 release
 */
public class LineBreakingOutputStream extends FilterOutputStream {

    private static final byte[] CRLF = {'\r', '\n'};
    
    private int linepos = 0;
    private int lineLength = 76;
    
    public LineBreakingOutputStream(OutputStream out, int lineLength) {
        super(out);
        this.lineLength  = lineLength;
    }

    public final void write(final byte[] b, int off, int len) throws IOException {
        while (len > 0) {
            if (len + linepos > lineLength) {
                int count = lineLength - linepos;
                if (count > 0) {
                    out.write(b, off, count);
                    off += count;
                    len -= count;
                }
                out.write(CRLF);
                linepos = 0;
            } else {
                out.write(b, off, len);
                linepos += len;
                len = 0;
            }
        }
    }

    public final void write(final int b) throws IOException {
        if (linepos >= lineLength) {
            out.write(CRLF);
            linepos = 0;
        }
        out.write(b);
        linepos++;
    }

}
