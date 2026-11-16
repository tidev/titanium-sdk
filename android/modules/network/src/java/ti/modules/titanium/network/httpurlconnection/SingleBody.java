/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Copied and modified from Apache's HTTPClient implementation (APL2 license):
 * org.apache.james.mime4j.message.SingleBody
 */

package ti.modules.titanium.network.httpurlconnection;

import java.io.IOException;
import java.io.OutputStream;

public abstract class SingleBody implements Body
{

	private Entity parent = null;

	/**
	 * Sole constructor.
	 */
	protected SingleBody()
	{
	}

	/**
	 * @see org.apache.james.mime4j.message.Body#getParent()
	 */
	public Entity getParent()
	{
		return parent;
	}

	/**
	 * @see org.apache.james.mime4j.message.Body#setParent(org.apache.james.mime4j.message.Entity)
	 */
	public void setParent(Entity parent)
	{
		this.parent = parent;
	}

	/**
	 * Writes this single body to the given stream.
	 *
	 * @param out
	 *            the stream to write to.
	 * @throws IOException
	 *             in case of an I/O error
	 */
	public abstract void writeTo(OutputStream out) throws IOException;
}
