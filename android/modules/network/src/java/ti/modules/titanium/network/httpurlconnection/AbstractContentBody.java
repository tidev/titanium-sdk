/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 * 
 * Copied and modified from Apache's HTTPClient implementation (APL2 license):
 * org.apache.http.entity.mime.content.AbstractContentBody
 */

package ti.modules.titanium.network.httpurlconnection;

import java.util.Collections;
import java.util.Map;

public abstract class AbstractContentBody extends SingleBody implements ContentBody
{

	private final String mimeType;
	private final String mediaType;
	private final String subType;

	private Entity parent = null;

	public AbstractContentBody(final String mimeType)
	{
		super();
		if (mimeType == null) {
			throw new IllegalArgumentException("MIME type may not be null");
		}
		this.mimeType = mimeType;
		int i = mimeType.indexOf('/');
		if (i != -1) {
			this.mediaType = mimeType.substring(0, i);
			this.subType = mimeType.substring(i + 1);
		} else {
			this.mediaType = mimeType;
			this.subType = null;
		}
	}

	@Override
	public Entity getParent()
	{
		return this.parent;
	}

	@Override
	public void setParent(final Entity parent)
	{
		this.parent = parent;
	}

	public String getMimeType()
	{
		return this.mimeType;
	}

	public String getMediaType()
	{
		return this.mediaType;
	}

	public String getSubType()
	{
		return this.subType;
	}

	public Map<String, String> getContentTypeParameters()
	{
		return Collections.emptyMap();
	}
}
