/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.xml;

import org.appcelerator.kroll.annotations.Kroll;
import org.w3c.dom.Entity;

@Kroll.proxy(parentModule = XMLModule.class)
public class EntityProxy extends NodeProxy
{

	private Entity entity;

	public EntityProxy(Entity entity)
	{
		super(entity);
		this.entity = entity;
	}

	@Kroll.getProperty
	public String getNotationName()
	{
		return entity.getNotationName();
	}

	@Kroll.getProperty
	public String getPublicId()
	{
		return entity.getPublicId();
	}

	@Kroll.getProperty
	public String getSystemId()
	{
		return entity.getSystemId();
	}

	@Override
	public String getApiName()
	{
		return "Ti.XML.Entity";
	}
}
