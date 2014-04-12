/**
 * Appcelerator Common Library for Node.js
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.
 *
 * <p>
 * The messaging module provides communication capabilities with other processes via a RESTful client-server
 * architecture. The transport mechanism is pluggable so that different transports can be swapped out without changing
 * client code. Messages are passed inside of one or more protocols. The top-level protocol is defined below, and any
 * other parent/lower-level protocols are defined on a transport by transport basis.
 * <pre>
 * Request:
 *		{
 *			messageType: [value],
 *			data: [value],
 *		}
 *
 *	messageType: always a string, and is the value of messageType supplied to {@link module:messaging#MessagingInterface.listen} or {@link module:messaging#MessagingInterface.send}
 *	data: any valid JSON value
 *
 * Response:
 *
 *		{
 *			error: [value]
 *		}
 *
 *		or
 *
 *		{
 *			data: [value]
 *		}
 *
 *	error: error is a string if an error occured, null otherwise
 *	data: any valid JSON value
 * Note: a response must always sent, even if there is no data to send, because the message serves as a request ACK.
 * </pre>
 * </p>
 *
 * @module messaging
 */

var transports,
	path = require('path'),
	wrench = require('wrench'),
	transportRegex = /Transport\.js/,
	i, len;

// Find the list of transports
transports = wrench.readdirSyncRecursive(path.join(__dirname, 'messaging'));
for(i = 0, len = transports.length; i < len; i++) {
	transports[i] = transports[i].replace(transportRegex, '');
}

/**
 * Creates a messaging interface over the specified transport
 *
 * @method
 * @param {String} transportType The transport to use. Must be 'stdio' currently
 */
exports.create = function(transportType) {
	if (transports.indexOf(transportType) === -1) {
		throw new Error('Invalid messaging transport type "' + transportType + '"');
	}
	return new MessagingInterface(transportType);
};

/**
 * @classdesc A messaging interface for communicating with an external service
 *
 * @constructor
 * @name module:messaging#MessagingInterface
 */
function MessagingInterface(transportType) {
	this._transportType = transportType;
	this._listeners = {};
}

/**
 * Opens the messaging interface
 *
 * @method
 * @name module:messaging#MessagingInterface.open
 */
MessagingInterface.prototype.open = function (options) {
	if (this._transport) {
		throw new Error('Cannot open a messaging interface that is already open');
	}
	this._transport = new (require('./messaging/' + this._transportType + 'Transport'))(function (requestData, response) {
		try {
			requestData = JSON.parse(requestData);
			if (!requestData.messageType) {
				throw 'missing message type';
			}
		} catch(e) {
			response(JSON.stringify({
				error: 'Malformed message: ' + e
			}));
			return;
		}
		if (this._listeners[requestData.messageType]) {
			this._listeners[requestData.messageType](requestData, function (error, data) {
				response(JSON.stringify({
					error: error,
					data: data
				}));
			});
		} else {
			response(JSON.stringify({
				error: 'No listener available to handle request'
			}));
		}
	}.bind(this), options);
};

/**
 * Closes the messaging interface
 *
 * @method
 * @name module:messaging#MessagingInterface.close
 */
MessagingInterface.prototype.close = function () {
	this._transport.close();
	this._transport = null;
};

/**
 * @method
 * @name module:messaging#MessagingInterface~listenCallback
 * @param {Object} request The request object
 * @param {Any} request.data The data received, after having been parsed via JSON.parse
 * @param {module:messaging~listenCallbackResponse} response The response object
 */
/**
 * @method
 * @name module:messaging#MessagingInterface~listenCallbackResponse
 * @param {String|undefined} error The error, if one occured. Anything falsey is understood to mean no error occured, and
 *		the value is converted to undefined
 * @param {Any|undefined} data The data, if any. The value is ignored if an error is supplied
 */
/**
 * Listens for a message from Studio. Note: only one listener per message type is allowed because multiple listeners
 * would send multiple responses to the sender
 *
 * @method
 * @name module:messaging#MessagingInterface.listen
 * @param {String} messageType The name of the message to listen for
 * @param {module:messaging#MessagingInterface~listenCallback} callback The callback to fire when a message arrives. The callback is passed
 *		two parameters: request and response
 */
MessagingInterface.prototype.listen = function (messageType, callback) {
	this._listeners[messageType] = callback;
};

/**
 * @method
 * @name module:messaging#MessagingInterface~sendCallback
 * @param {String|undefined} error The error message, if one occured, else undefined
 * @param {Any|undefined} data The data, if an error did not occur, else undefined
 */
/**
 * Sends a message to Studio
 *
 * @method
 * @name module:messaging#MessagingInterface.send
 * @param {String|undefined} messageType The name of the message to send
 * @param {Any|undefined} data The data to send. Must be JSON.stringify-able (i.e. no cyclic structures). Can be primitive or
 *		undefined, although undefined is converted to null
 * @param {module:messaging#MessagingInterface~sendCallback} callback The callback to fire once the transmission is complete or
 *		has errored. The error parameter is null if no error occured, or a string indicating the error. The data
 *		parameter is null if an error occured, or any type of data (including null) if no error occured.
 * @throws {Error} An exception is thrown if send is called while the interface is closed
 */
MessagingInterface.prototype.send = function (messageType, data, callback) {
	if (!this._transport) {
		throw new Error('Attempted to send data over a closed messaging interface');
	}
	this._transport.send(JSON.stringify({
		messageType: messageType,
		data: typeof data === 'undefined' ? null : data
	}), function (response) {
		try {
			response = JSON.parse(response);
		} catch(e) {
			response = {
				error: 'Malformed message: ' + e
			};
		}
		if (callback) {
			callback(response.error, response.data);
		}
	});
};