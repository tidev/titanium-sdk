/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2016-2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.calendar;

import java.util.ArrayList;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import android.annotation.SuppressLint;
import android.content.ContentResolver;
import android.database.Cursor;
import android.provider.CalendarContract.Attendees;

@SuppressLint("InlinedApi")
@Kroll.proxy(parentModule=CalendarModule.class)
public class AttendeeProxy extends KrollProxy {
    public static final String TAG = "AttendeeProxy";

    // Invitation status
    public static final int STATUS_NONE = Attendees.ATTENDEE_STATUS_NONE;
    public static final int STATUS_ACCEPTED = Attendees.ATTENDEE_STATUS_ACCEPTED;
    public static final int STATUS_DECLINED = Attendees.ATTENDEE_STATUS_DECLINED;
    public static final int STATUS_TENTATIVE = Attendees.ATTENDEE_STATUS_TENTATIVE;

    // Attendee type
    public static final int TYPE_REQUIRED = Attendees.TYPE_REQUIRED;
    public static final int TYPE_OPTIONAL = Attendees.TYPE_OPTIONAL;

    static final String[] AttendeeProjection = new String[] {
            Attendees.ATTENDEE_NAME,
            Attendees.ATTENDEE_EMAIL,
            Attendees.ATTENDEE_TYPE,
            Attendees.ATTENDEE_STATUS
    };

    protected String eventId, name, email;
    protected int type, status;

    public AttendeeProxy() {
        super();
    }

    public AttendeeProxy(TiContext context) {
        this();
    }

    public static ArrayList<AttendeeProxy> fetchAttendees(final long eventId, ContentResolver contentResolver) {
        ArrayList<AttendeeProxy> attendees = new ArrayList<>();
        final Cursor cursor = Attendees.query(contentResolver, eventId, AttendeeProjection);
        while (cursor.moveToNext()) {
            AttendeeProxy attendee = new AttendeeProxy();
            int colIndex;
            colIndex = cursor.getColumnIndex(Attendees.ATTENDEE_NAME);
            attendee.name = cursor.getString(colIndex);
            colIndex = cursor.getColumnIndex(Attendees.ATTENDEE_EMAIL);
            attendee.email = cursor.getString(colIndex);
            colIndex = cursor.getColumnIndex(Attendees.ATTENDEE_TYPE);
            attendee.type = cursor.getInt(colIndex);
            colIndex = cursor.getColumnIndex(Attendees.ATTENDEE_STATUS);
            attendee.status = cursor.getInt(colIndex);
            attendees.add(attendee);
        }
        cursor.close();
        return attendees;
    }

    @Kroll.getProperty @Kroll.method
    public String getName() {
        return name;
    }

    @Kroll.getProperty @Kroll.method
    public String getEmail() {
        return email;
    }

    @Kroll.getProperty @Kroll.method
    public int getType() {
        return type;
    }

    @Kroll.getProperty @Kroll.method
    public int getStatus() {
        return status;
    }

    @Override
    public String getApiName() {
        return "Ti.Calendar.Attendee";
    }

}
