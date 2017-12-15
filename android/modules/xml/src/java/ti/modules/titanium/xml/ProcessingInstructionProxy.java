/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.xml;

import org.appcelerator.kroll.annotations.Kroll;
import org.w3c.dom.DOMException;
import org.w3c.dom.ProcessingInstruction;

@Kroll.proxy(parentModule = XMLModule.class)
public class ProcessingInstructionProxy extends NodeProxy
{

	private ProcessingInstruction pi;

	public ProcessingInstructionProxy(ProcessingInstruction pi)
	{
		super(pi);
		this.pi = pi;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getData()
	// clang-format on
	{
		return pi.getData();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getTarget()
	// clang-format on
	{
		return pi.getTarget();
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setData(String data) throws DOMException
	// clang-format on
	{
		pi.setData(data);
	}

	@Override
	public String getApiName()
	{
		return "Ti.XML.ProcessingInstruction";
	}
}
