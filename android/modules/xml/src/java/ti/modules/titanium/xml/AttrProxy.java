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

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getName()
	// clang-format on
	{
		return attr.getName();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public ElementProxy getOwnerElement()
	// clang-format on
	{
		return getProxy(attr.getOwnerElement());
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public boolean getSpecified()
	// clang-format on
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

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getValue()
	// clang-format on
	{
		return attr.getValue();
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setValue(String value) throws DOMException
	// clang-format on
	{
		attr.setValue(value);
	}

	@Override
	public String getApiName()
	{
		return "Ti.XML.Attr";
	}
}
