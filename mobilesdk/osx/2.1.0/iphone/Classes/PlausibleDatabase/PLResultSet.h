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

/**
 * Represents a set of results returned by an SQL query.
 *
 * @par Thread Safety
 * PLResultSet instances implement no locking and must not be shared between threads
 * without external synchronization.
 */
@protocol PLResultSet

/**
 * Move the result cursor to the next available row. If no further rows
 * are available, returns NO.
 *
 * @return YES if the cursor was moved to the next row, NO if no further rows were available.
 */
- (BOOL) next;

/**
 * Close the result set, and return any held database resources. After calling,
 * no further PLResultSet methods may be called on the instance.
 *
 * As PLResultSet objects may be placed into autorelease pools, with indeterminate
 * release of database resources, this method should be used to ensure that the
 * database connection remains usable once finished with a result set.
 *
 * Failure to call close will not result in any memory leaks, but may prevent
 * further use of the database connection (until the result set is released).
 */
- (void) close;

/**
 * Map the given column name to a column index. Will throw NSException if the column name
 * is unknown.
 *
 * @param name Name of the column.
 * @return Returns the index of the column name, or throws an NSException if the column
 * can not be found.
 */
- (int) columnIndexForName: (NSString *) name;

/**
 * Return the integer value of the given column index from
 * the current result row.
 *
 * Will throw NSException if the column index is out of range,
 * or if the column value is NULL.
 */
- (int32_t) intForColumnIndex: (int) columnIdx;

/**
 * Return the integer value of the named column from the
 * current result row.
 *
 * Will throw NSException if the column name is unknown,
 * or if the column value is NULL.
 */
- (int32_t) intForColumn: (NSString *) columnName;

/**
 * Return the string value of the given column index from
 * the current result row.
 *
 * Will throw NSException if the column index is out of range,
 * or if the column value is NULL.
 */
- (NSString *) stringForColumnIndex: (int) columnIndex;

/**
 * Return the string value of the named column from the
 * current result row.
 *
 * Will throw NSException if the column name is unknown,
 * or if the column value is NULL.
 */
- (NSString *) stringForColumn: (NSString *) columnName;

/**
 * Returns the 64 bit big integer (long) value of the given
 * column index the current result row.
 *
 * Will throw NSException if the column index is out of range,
 * or if the column value is NULL.
 */
- (int64_t) bigIntForColumnIndex: (int) columnIndex;

/**
 * Returns the 64 bit big integer (long) value of the named
 * column from the current result row.
 *
 * Will throw NSException if the column name is unknown,
 * or if the column value is NULL.
 */
- (int64_t) bigIntForColumn: (NSString *) columnName;

/**
 * Returns YES if the value of the given column index is NULL,
 * NO otherwise.
 *
 * Will throw NSException if the column index is out of range.
 */
- (BOOL) isNullForColumnIndex: (int) columnIndex;

/**
 * Returns YES if the value of the named column is NULL,
 * NO otherwise.
 *
 * Will throw NSException if the column index is out of range.
 */
- (BOOL) isNullForColumn: (NSString *) columnName;

/**
 * Returns the BOOL value of the named column from the
 * current result row.
 *
 * Will throw NSException if the column name is unknown,
 * or if the column value is NULL.
 */
- (BOOL) boolForColumn: (NSString *) columnName;

/**
 * Returns the BOOL value of the given column index from the 
 * current result row.
 *
 * Will throw NSException if the column index is out of range,
 * or if the column value is NULL.
 */
- (BOOL) boolForColumnIndex: (int) columnIndex;

/**
 * Returns the float value of the named column from the
 * current result row.
 *
 * Will throw NSException if the column name is unknown,
 * or if the column value is NULL.
 */
- (float) floatForColumn: (NSString *) columnName;

/**
 * Returns the float value of the given column index from the 
 * current result row.
 *
 * Will throw NSException if the column index is out of range,
 * or if the column value is NULL.
 */
- (float) floatForColumnIndex: (int) columnIndex;

/**
 * Returns the double value of the named column from the
 * current result row.
 *
 * Will throw NSException if the column name is unknown,
 * or if the column value is NULL.
 */
- (double) doubleForColumn: (NSString *) columnName;

/**
 * Returns the double value of the given column index from the 
 * current result row.
 *
 * Will throw NSException if the column index is out of range,
 * or if the column value is NULL.
 */
- (double) doubleForColumnIndex: (int) columnIndex;

/**
 * Returns the NSDate value of the named column from the
 * current result row.
 *
 * Will throw NSException if the column name is unknown,
 * or if the column value is NULL.
 */
- (NSDate *) dateForColumn: (NSString *) columnName;

/**
 * Returns the NSDate value of the given column index from the 
 * current result row.
 *
 * Will throw NSException if the column index is out of range,
 * or if the column value is NULL.
 */
- (NSDate *) dateForColumnIndex: (int) columnIndex;

/**
 * Returns the NSData value of the named column from the
 * current result row.
 *
 * Will throw NSException if the column name is unknown,
 * or if the column value is NULL.
 */
- (NSData *) dataForColumn: (NSString *) columnName;

/**
 * Returns the NSData value of the given column index from the 
 * current result row.
 *
 * Will throw NSException if the column index is out of range,
 * or if the column value is NULL.
 */
- (NSData *) dataForColumnIndex: (int) columnIndex;

/**
 * Return the value of the named column as a Foundation
 * Objective-C  object, using the database driver's built-in SQL and
 * Foundation data-type mappings.
 *
 * Will throw NSException if the column name is unknown,
 * or if the column value is NULL.
 *
 * @param columnName Name of column value to return.
 */
- (id) objectForColumn: (NSString *) columnName;

/**
 * Return the value of the named column as a Foundation
 * Objective-C  object, using the database driver's built-in SQL and
 * Foundation data-type mappings.
 *
 * Will throw NSException if the column index is out of range,
 * or if the column value is NULL.
 *
 * @param columnIndex Index of column value to return.
 */
- (id) objectForColumnIndex: (int) columnIndex;
@end

