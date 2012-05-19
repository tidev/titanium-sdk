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
 * An object that represents a pre-compiled statement, and any parameters
 * bound to that statement.
 *
 * @par SQL Parameters
 * Literal query values may be substituted via parameter binding, by using
 * the '?' symbol in the query statement and PLPreparedStatement::bindParameters.
 *
 * Additionally, PLPreparedStatement::bindParameterDictionary implements
 * name-based parameter binding. To bind named parameters, use the ':&lt;name&gt;'
 * syntax. All named parameters must be provided in the binding parameter
 * dictionary, and it is not possible to mix named and unnamed parameters
 * when using PLPreparedStatement::bindParameterDictionary.
 *
 * @par Thread Safety
 * PLPreparedStatement instances implement no locking and must not be shared between threads
 * without external synchronization.
 *
 * @warning A prepared statement may not be re-used by simultaneous PLResultSet. Attempting to 
 * either re-execute a statement or rebind its parameters without first closing any PLResultSet previously
 * returned by the statement will throw an exception.
 */
@protocol PLPreparedStatement

/**
 * Returns the number of parameters in the prepared statement.
 */
- (int) parameterCount;

/**
 * Bind a list of parameters to the prepared statement. All parameters
 * must be provided -- if less than PLPreparedStatement::parameterCount
 * values are provided, an exception will be thrown.
 *
 * @param parameters List of parameters to bind.
 * @note NSArray may not contain nil values. Any nil parameter values must be
 * supplied using NSNull.
 */
- (void) bindParameters: (NSArray *) parameters;

/**
 * If a statement was created using named parameters, the parameter
 * values may be bound using a dictionary mapping the parameter name
 * to its intended value.
 *
 * @param parameters Dictionary of named parameters to bind.
 * @note NSDictionary may not contain nil values. Any nil parameter values must be
 * supplied using NSNull.
 */
- (void) bindParameterDictionary: (NSDictionary *) parameters;

/**
 * Execute an update, returning YES on success, NO on failure.
 */
- (BOOL) executeUpdate;


/**
 * Execute an update, returning YES on success, NO on failure.
 *
 * @param outError A pointer to an NSError object variable. If an error occurs, this
 * pointer will contain an error object indicating why the statement could not be executed.
 * If no error occurs, this parameter will be left unmodified. You may specify nil for this
 * parameter, and no error information will be provided.
 */
- (BOOL) executeUpdateAndReturnError: (NSError **) outError;


/**
 * Execute a query, returning a PLResultSet.
 *
 * @return PLResultSet on success, or nil on failure.
 */
- (NSObject<PLResultSet> *) executeQuery;


/**
 * Execute a query, returning a PLResultSet.
 *
 * @param outError A pointer to an NSError object variable. If an error occurs, this
 * pointer will contain an error object indicating why the statement could not be executed.
 * If no error occurs, this parameter will be left unmodified. You may specify nil for this
 * parameter, and no error information will be provided.
 * @return PLResultSet on success, or nil on failure.
 */
- (NSObject<PLResultSet> *) executeQueryAndReturnError: (NSError **) outError;

/**
 * Close the prepared statement, and return any held database resources. After calling,
 * no further PLPreparedStatement methods may be called on the instance.
 *
 * As PLPreparedStatement objects may be placed into autorelease pools with indeterminate
 * release of database resources, this method may be used to ensure that resources
 * are free'd in a timely fashion.
 *
 * Failure to call close will not result in any memory leaks.
 */
- (void) close;

@end