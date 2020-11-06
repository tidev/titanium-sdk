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

	@Kroll.method
	@Kroll.getProperty
	public DocumentType getDocumentType()
	{
		return type;
	}

	@Kroll.method
	@Kroll.getProperty
	public NamedNodeMapProxy getEntities()
	{
		return new NamedNodeMapProxy(type.getEntities());
	}

	@Kroll.method
	@Kroll.getProperty
	public String getInternalSubset()
	{
		return type.getInternalSubset();
	}

	@Kroll.method
	@Kroll.getProperty
	public String getName()
	{
		return type.getName();
	}

	@Kroll.method
	@Kroll.getProperty
	public NamedNodeMapProxy getNotations()
	{
		return new NamedNodeMapProxy(type.getNotations());
	}

	@Kroll.method
	@Kroll.getProperty
	public String getPublicId()
	{
		return type.getPublicId();
	}

	@Kroll.method
	@Kroll.getProperty
	public String getSystemId()
	{
		return type.getSystemId();
	}

	@Override
	public String getApiName()
	{
		return "Ti.XML.DocumentType";
	}
}
