/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.xml;

import org.appcelerator.kroll.annotations.Kroll;
import org.w3c.dom.DocumentFragment;

@Kroll.proxy(parentModule = XMLModule.class)
public class DocumentFragmentProxy extends NodeProxy
{

	public DocumentFragmentProxy(DocumentFragment fragment)
	{
		super(fragment);
	}

	@Override
	public String getApiName()
	{
		return "Ti.XML.DocumentFragment";
	}
}
