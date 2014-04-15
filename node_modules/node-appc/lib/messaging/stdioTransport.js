/**
 * Appcelerator Common Library for Node.js
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.
 *
 * <p>A transport that uses stdin and stdout as the communications channel. A low-level packet format, defined below, is
 * used to ensure proper message delivery.
 * <pre>
 *	[Message Type],[Sequence ID],[Message Length],[data]
 *		MessageType: A three character sequence that is either 'REQ' (request) or 'RES' (response)
 *		Sequence ID: A 32-bit, base 16 number that identifies the message. This value is always 8 characters long, and
 *			includes 0 padding if necessary. Hex letters must be lower case. Note: Response messages have the same
 *			Sequence ID as the request that generated the response
 *		Message Length: A 32-bit, base 16 number that identifies the length of the message. This value is always 8
 *			characters long, and includes 0 padding if necessary. Hex letters must be lower case.
 *	Example: REQ,000079AC,0000000C,{foo: 'bar'}
 *	Example: RES,000079AC,0000000C,{foo: 'baz'}
 * <pre>
 * </p>
 *
 * @module messaging/stdio
 */

/**
 * @private
 */
var channels = {},
	numChannels = 0,
	STATE_MESSAGE_TYPE = 1,
	STATE_SEQUENCE_ID = 2,
	STATE_MESSAGE_LENGTH = 3,
	STATE_DATA = 4;

function zeroPad(value, length) {
	var string = value.toString();
	while(string.length < length) {
		string = '0' + string;
	}
	return string;
}

/**
 * @private
 */
function stdioTransport(requestCallback, options) {
	var i,
		channel,
		buffer = '',
		state = STATE_MESSAGE_TYPE,
		messageType,
		sequenceID,
		messageLength,
		data,
		stdin = this._stdin = (options && options.stdin) || process.stdin;
	this._stdout = (options && options.stdout) || process.stdout;
	for(i = 1; i < 256; i++) {
		if (!channels[i]) {
			channel = i;
			break;
		}
	}
	if (!channel) {
		throw new Error('All stdio messaging channels are in use (max limit is 255).');
	}

	channels[channel] = this;
	this._sequenceIDPrefix = channel << 24;
	this._requestCallback = requestCallback;
	this._sequenceIDCount = 1;
	this._responseCallbacks = {};

	if (!numChannels) {
		stdin.setEncoding('utf8');
		stdin.resume();
		stdin.setRawMode && stdin.setRawMode(true);
	}
	numChannels++;
	stdin.on('data', function processChunk(chunk) {
		buffer += chunk;
		switch(state) {
			case STATE_MESSAGE_TYPE:
				if (buffer.length > 3) {
					messageType = buffer.substring(0,3);
					buffer = buffer.substring(4);
					state = STATE_SEQUENCE_ID;
				} else {
					break;
				}
			case STATE_SEQUENCE_ID:
				if (buffer.length > 8) {
					sequenceID = parseInt(buffer.substring(0,8), 16);
					buffer = buffer.substring(9);
					state = STATE_MESSAGE_LENGTH;
				} else {
					break;
				}
			case STATE_MESSAGE_LENGTH:
				if (buffer.length > 8) {
					messageLength = parseInt(buffer.substring(0,8), 16);
					buffer = buffer.substring(9);
					state = STATE_DATA;
				} else {
					break;
				}
			case STATE_DATA:
				if (buffer.length >= messageLength) {
					data = buffer.substring(0, messageLength);

					switch(messageType) {
						case 'REQ':
							requestCallback(data, function (responseData) {
								var msg = 'RES,' + zeroPad(sequenceID.toString(16), 8) + ',' +
									zeroPad(responseData.length.toString(16), 8) + ',' + responseData;
								process.stdout.write(msg);
							});
							break;
						case 'RES':
							if (this._responseCallbacks[sequenceID]) {
								this._responseCallbacks[sequenceID](data);
							}
							break;
					}
					state = STATE_MESSAGE_TYPE;

					buffer = buffer.substring(messageLength);
					if (buffer.length) {
						processChunk('');
					}
				}
				break;
		}
	}.bind(this));
	return;
}
module.exports = stdioTransport;

/**
 * @private
 */
stdioTransport.prototype.close = function () {
	var i;
	numChannels--;
	if (!numChannels) {
		this._stdin.pause();
		this._stdin.setRawMode && this._stdin.setRawMode(false);
	}
	for(i = 0; i < 256; i++) {
		if (channels[i] === this) {
			delete channels[i];
		}
	}
};

/**
 * @private
 */
stdioTransport.prototype.send = function (data, callback) {
	var seqId = this._sequenceIDPrefix + (this._sequenceIDCount++),
		msg = 'REQ,' + zeroPad(seqId.toString(16), 8) + ',' + zeroPad(data.length.toString(16), 8) + ',' + data;
	if (this._sequenceIDCount > 0xFFFFFF) {
		this._sequenceIDCount = 0;
	}
	this._stdout.write(msg);
	this._responseCallbacks[seqId] = function(data) {
		delete this._responseCallbacks[seqId];
		callback && callback(data);
	}.bind(this);
};