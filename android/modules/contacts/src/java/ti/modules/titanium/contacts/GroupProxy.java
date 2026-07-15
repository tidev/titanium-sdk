/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.contacts;

import java.util.ArrayList;
import java.util.List;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;

@Kroll.proxy(parentModule = ContactsModule.class)
public class GroupProxy extends KrollProxy
{
	private static final String TAG = "TiGroup";

	private String name = "";
	private Object identifier = null;
	private Object recordId = null;
	private final List<PersonProxy> members = new ArrayList<>();

	public GroupProxy()
	{
		super();
	}

	public GroupProxy(KrollDict options)
	{
		super();
		if (options != null && options.containsKey("name")) {
			Object n = options.get("name");
			if (n instanceof String) {
				name = (String) n;
			}
		}
	}

	@Kroll.getProperty
	public String getName()
	{
		return name;
	}

	@Kroll.setProperty
	public void setName(String name)
	{
		this.name = name;
	}

	@Kroll.getProperty
	public Object getIdentifier()
	{
		return identifier;
	}

	void setIdentifier(Object identifier)
	{
		this.identifier = identifier;
	}

	@Kroll.getProperty
	public Object getRecordId()
	{
		return recordId;
	}

	@Kroll.method
	public void add(PersonProxy person)
	{
		if (person != null && !members.contains(person)) {
			members.add(person);
		}
	}

	@Kroll.method
	public void remove(PersonProxy person)
	{
		if (person != null) {
			members.remove(person);
		}
	}

	@Kroll.method
	public Object[] members()
	{
		return members.toArray();
	}

	@Kroll.method
	public Object[] sortedMembers(int sort)
	{
		return members.toArray();
	}

	@Override
	public String getApiName()
	{
		return "Ti.Contacts.Group";
	}
}