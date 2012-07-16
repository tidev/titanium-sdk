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

#define PL_DB_PRIVATE 1


/**
 * Protocol for interacting with an SQL database.
 *
 * @par Object Types
 * All drivers support conversion to and from the following object types:
 * - NSString
 * - NSNumber
 * - NSData
 *
 * @par Scalar Types
 * All drivers implement conversion to and from the scalar types as defined in
 * the Key Value Coding documentation, Scalar and Structure Support:
 * http://developer.apple.com/documentation/Cocoa/Conceptual/KeyValueCoding/Concepts/DataTypes.html#//apple_ref/doc/uid/20002171-184842-BCIJIBHC
 *
 * @par
 * The mapping of these scalar types to specific database types is implementation
 * defined. Refer to the database driver's documentation for the specific mapping
 * used.
 *
 * @par Thread Safety
 * PLDatabase instances implement no locking and must not be shared between threads
 * without external synchronization.
 */
@protocol TI_PLDatabase

/**
 * Test that the connection is active.
 */
- (BOOL) goodConnection;

/**
 * Close the database connection, releasing any held database resources.
 * After calling, no further PLDatabase methods may be called on the instance.
 *
 * As PLDatabase objects may be placed into autorelease pools, with indeterminate
 * release of database resources, this method should be used to ensure that the database
 * connection is closed in a timely manner. 
 *
 * Failure to call close will not result in any resource leaks, but may result in
 * database connections unexpectedly remaining open, especially in a garbage collection
 * environment.
 */
- (void) close;


/**
 * Prepare and return a new PLPreparedStatement.
 *
 * @param statement SQL statement to prepare.
 * @return The prepared statement, or nil if it could not be prepared.
 */
- (NSObject<TI_PLPreparedStatement> *) prepareStatement: (NSString *) statement;

/**
 * Prepare and return a new PLPreparedStatement.
 *
 * @param statement SQL statement to prepare.
 * @param outError A pointer to an NSError object variable. If an error occurs, this
 * pointer will contain an error object indicating why the statement could not be prepared.
 * If no error occurs, this parameter will be left unmodified. You may specify nil for this
 * parameter, and no error information will be provided.
 * @return The prepared statement, or nil if it could not be prepared.
 */
- (NSObject<TI_PLPreparedStatement> *) prepareStatement: (NSString *) statement error: (NSError **) outError;


/**
 * Execute an update, returning YES on success, NO on failure.
 *
 * Any arguments should be provided following the statement, and
 * referred to using standard '?' JDBC substitutions
 *
 * @param statement SQL statement to execute.
 */
- (BOOL) executeUpdate: (NSString *) statement, ...;

/**
 * Execute an update, returning YES on success, NO on failure.
 *
 * Any arguments should be provided following the statement, and
 * referred to using standard '?' JDBC substitutions
 *
 * @param error A pointer to an NSError object variable. If an error occurs, this
 * pointer will contain an error object indicating why the statement could not be executed.
 * If no error occurs, this parameter will be left unmodified. You may specify nil for this
 * parameter, and no error information will be provided.
 * @param statement SQL statement to execute.
 *
 */
- (BOOL) executeUpdateAndReturnError: (NSError **) error statement: (NSString *) statement, ...;

/**
 * Execute a query, returning a PLResultSet.
 *
 * Any arguments should be provided following the statement, and
 * referred to using standard '?' JDBC substitutions
 *
 * @param statement SQL statement to execute.
 * @return PLResultSet on success, or nil on failure.
 */
- (NSObject<TI_PLResultSet> *) executeQuery: (NSString *) statement, ...;

/**
 * Execute a query, returning a PLResultSet.
 *
 * Any arguments should be provided following the statement, and
 * referred to using standard '?' JDBC substitutions
 *
 * @param error A pointer to an NSError object variable. If an error occurs, this
 * pointer will contain an error object indicating why the statement could not be executed.
 * If no error occurs, this parameter will be left unmodified. You may specify nil for this
 * parameter, and no error information will be provided.
 * @param statement SQL statement to execute.
 * @return PLResultSet on success, or nil on failure.
 */
- (NSObject<TI_PLResultSet> *) executeQueryAndReturnError: (NSError **) error statement: (NSString *) statement, ...;


/**
 * Begin a transaction. This must provide at least 'Read committed' isolation. As
 * per the SQL standard, the isolation level may be stricter than what has been
 * requested -- this method only gaurantees the MINIMUM of isolation.
 *
 * For more information on SQL standard transaction isolation levels, refer to
 * PostgreSQL's documentation:
 *    http://www.postgresql.org/docs/8.3/interactive/transaction-iso.html
 *
 * @return YES on success, NO on failure.
 */
- (BOOL) beginTransaction;

/**
 * Begin a transaction. This must provide at least 'Read committed' isolation. As
 * per the SQL standard, the isolation level may be stricter than what has been
 * requested -- this method only gaurantees the MINIMUM of isolation.
 *
 * For more information on SQL standard transaction isolation levels, refer to
 * PostgreSQL's documentation:
 *    http://www.postgresql.org/docs/8.3/interactive/transaction-iso.html
 *
 * @param error A pointer to an NSError object variable. If an error occurs, this
 * pointer will contain an error object indicating why the transaction could not
 * be started.
 *
 * If no error occurs, this parameter will be left unmodified. You may specify nil for this
 * parameter, and no error information will be provided.
 * @return YES on success, NO on failure.
 */
- (BOOL) beginTransactionAndReturnError: (NSError **) error;

/**
 * Commit an open transaction.
 *
 * @return YES on success, NO on failure.
 */
- (BOOL) commitTransaction;

/**
 * Commit an open transaction.
 *
 * @param error A pointer to an NSError object variable. If an error occurs, this
 * pointer will contain an error object indicating why the transaction could not
 * be committed.
 *
 * @return YES on success, NO on failure.
 */
- (BOOL) commitTransactionAndReturnError: (NSError **) error;

/**
 * Rollback an open transaction.
 *
 * @return YES on success, NO on failure.
 */
- (BOOL) rollbackTransaction;

/**
 * Rollback an open transaction.
 *
 * @param error A pointer to an NSError object variable. If an error occurs, this
 * pointer will contain an error object indicating why the transaction could not
 * be rolled back.
 *
 * @return YES on success, NO on failure.
 */
- (BOOL) rollbackTransactionAndReturnError: (NSError **) error;

/**
 * Return YES if the given table name exists.
 *
 * @return YES if it exists, NO otherwise.
 */
- (BOOL) tableExists: (NSString *) tableName;

@end