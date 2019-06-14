/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.xml;

import org.appcelerator.kroll.annotations.Kroll;
import org.w3c.dom.DocumentType;

@Kroll.proxy(parentModule = XMLModule.class)
public class DocumentTypeProxy extends NodeProxy
{

	private DocumentType type;

	public DocumentTypeProxy(DocumentType type)
	{
		super(type);
		this.type = type;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public DocumentType getDocumentType()
	// clang-format on
	{
		return type;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public NamedNodeMapProxy getEntities()
	// clang-format on
	{
		return new NamedNodeMapProxy(type.getEntities());
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getInternalSubset()
	// clang-format on
	{
		return type.getInternalSubset();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getName()
	// clang-format on
	{
		return type.getName();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public NamedNodeMapProxy getNotations()
	// clang-format on
	{
		return new NamedNodeMapProxy(type.getNotations());
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getPublicId()
	// clang-format on
	{
		return type.getPublicId();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getSystemId()
	// clang-format on
	{
		return type.getSystemId();
	}

	@Override
	public String getApiName()
	{
		return "Ti.XML.DocumentType";
	}
}
