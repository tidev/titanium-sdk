/*
 * Copyright (c) 2008 Plausible Labs Cooperative, Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of any contributors
 *    may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

#if PL_DB_PRIVATE

@class TI_PLSqliteResultSet;

@interface TI_PLSqlitePreparedStatement : NSObject <TI_PLPreparedStatement> {
@private
    /** Our backing database. */
    PLSqliteDatabase *_database;

    /** The prepared SQLite statement. */
    sqlite3_stmt *_sqlite_stmt;
    
    /** The unprepared query string. */
    NSString *_queryString;

    /** Number of parameters. */
    int _parameterCount;

    /** Is the prepared statement in use by a PLResultSet */
    BOOL _inUse;
    
    /** If YES, the prepared statement is closed when the first result set is checked in. */
    BOOL _closeAtCheckin;
}

- (id) initWithDatabase: (PLSqliteDatabase *) db sqliteStmt: (sqlite3_stmt *) sqlite_stmt queryString: (NSString *) queryString closeAtCheckin: (BOOL) closeAtCheckin;

// DO NOT CALL. Must only be called from PLSqliteResultSet
- (void) checkinResultSet: (TI_PLSqliteResultSet *) resultSet;

- (NSString *) queryString;

@end

@compatibility_alias PLSqlitePreparedStatement TI_PLSqlitePreparedStatement;

#endif