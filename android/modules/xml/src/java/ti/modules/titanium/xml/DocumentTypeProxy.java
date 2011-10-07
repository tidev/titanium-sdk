/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.xml;

import org.appcelerator.kroll.annotations.Kroll;
import org.w3c.dom.DocumentType;

@Kroll.proxy(parentModule=XMLModule.class)
public class DocumentTypeProxy extends NodeProxy {

	private DocumentType type;
	public DocumentTypeProxy(DocumentType type)
	{
		super(type);
		this.type = type;
	}
	
	@Kroll.getProperty @Kroll.method
	public DocumentType getDocumentType() {
		return type;
	}
	
	@Kroll.getProperty @Kroll.method
	public NamedNodeMapProxy getEntities() {
		return new NamedNodeMapProxy(type.getEntities());
	}
	
	@Kroll.getProperty @Kroll.method
	public String getInternalSubset() {
		return type.getInternalSubset();
	}
	
	@Kroll.getProperty @Kroll.method
	public String getName() {
		return type.getName();
	}
	
	@Kroll.getProperty @Kroll.method
	public NamedNodeMapProxy getNotations() {
		return new NamedNodeMapProxy(type.getNotations());
	}
	
	@Kroll.getProperty @Kroll.method
	public String getPublicId() {
		return type.getPublicId();
	}
	
	@Kroll.getProperty @Kroll.method
	public String getSystemId() {
		return type.getSystemId();
	}
}
