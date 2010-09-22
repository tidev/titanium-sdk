/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.contacts;

import org.appcelerator.titanium.util.Log;

import android.net.Uri;
import android.os.Build;
import android.provider.Contacts;

public class CommonContactsApi 
{
	private static final String LCAT = "TiCommonContactsApi";
	private static boolean NEWER_API;
	private static String[] PEOPLE_PROJECTION;
	private static Class<?> CONTACTS_CONTRACT_CLASS;
	private static Class<?> CONTACTS_CLASS;
	private static Uri PEOPLE_URI;
	
	static {
		try {
			CONTACTS_CONTRACT_CLASS = Class.forName("android.provider.ContactsContract");
			CONTACTS_CLASS = CONTACTS_CONTRACT_CLASS.getClassLoader().loadClass("android.provider.ContactsContract$Contacts");
			PEOPLE_PROJECTION = new String[] {
			        "lookup",
			        "display_name"
			    };
			PEOPLE_URI = (Uri) (CONTACTS_CLASS.getField("CONTENT_URI").get(null));
			
			NEWER_API = true;
		} catch (Throwable t) {
			NEWER_API = false;
			Log.d(LCAT, "Newer contacts API not available.  Falling back.");
			PEOPLE_URI = Contacts.People.CONTENT_URI;
			PEOPLE_PROJECTION = new String[] {
			        Contacts.People._ID,
			        Contacts.People.NAME,
			        Contacts.People.NOTES,
			    };
		}
	}
}
