/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.xml;

import org.appcelerator.kroll.annotations.Kroll;
import org.w3c.dom.Attr;
import org.w3c.dom.DOMException;

@Kroll.proxy(parentModule = XMLModule.class)
public class AttrProxy extends NodeProxy
{

	private Attr attr;

	public AttrProxy(Attr attr)
	{
		super(attr);
		this.attr = attr;
	}

	public Attr getAttr()
	{
		return attr;
	}

	@Kroll.getProperty
	public String getName()
	{
		return attr.getName();
	}

	@Kroll.getProperty
	public ElementProxy getOwnerElement()
	{
		return getProxy(attr.getOwnerElement());
	}

	@Kroll.getProperty
	public boolean getSpecified()
	{
		// Harmony will return false even when ownerElement is null, whereas
		// spec says: "If the ownerElement attribute is null (i.e. because it
		// was just created or was set to null by the various removal and cloning
		// operations) specified is true."
		if (attr.getOwnerElement() == null) {
			return true;
		}
		return attr.getSpecified();
	}

	@Kroll.getProperty
	public String getValue()
	{
		return attr.getValue();
	}

	@Kroll.setProperty
	public void setValue(String value) throws DOMException
	{
		attr.setValue(value);
	}

	@Override
	public String getApiName()
	{
		return "Ti.XML.Attr";
	}
}
