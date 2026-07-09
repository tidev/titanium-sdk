/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 * 
 * Copied and modified from Apache's HTTPClient implementation (APL2 license):
 * org.apache.http.entity.mime.content.ContentBody
 */

package ti.modules.titanium.network.httpurlconnection;

import java.io.IOException;
import java.io.OutputStream;

public interface ContentBody extends ContentDescriptor {

	String getFilename();

	void writeTo(OutputStream out) throws IOException;
}
