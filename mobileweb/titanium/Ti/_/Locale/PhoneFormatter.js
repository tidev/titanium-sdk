define(function () {
	// ======================== Phone Number formatting ========================
	// Based on Android 4.1.1 code

	// NANP number validator: (general validator may checks allowable values of 'N' in +1-NPA-NXX-xxxx)
	// general: ^(((\+){0,1}1){0,1}([2-9](([0-9]{2})||(?!)))){0,1}([2-9][0-9]{2})([0-9]{4})$
	// simplified: ^(((\+){0,1}1){0,1}([\d]{3})){0,1}([\d]{3})([\d]{4})$
	var nanpNumberValidator = /^(((\+){0,1}1){0,1}([\d]{3})){0,1}([\d]{3})([\d]{4})$/,
		dashesAndSpacesRegEx = /[- ]/g,
		japanesePhoneFormatter, // special formatter of JS numbers
		FORMAT_UNKNOWN = 0, // use country code or don't format
		FORMAT_NANP = 1, // NANP formatting
		FORMAT_JAPAN = 2, // Japanese formatting
	// List of country codes for countries that use the NANP
		NANP_COUNTRIES = [
			'US', // United States
			'CA', // Canada
			'AS', // American Samoa
			'AI', // Anguilla
			'AG', // Antigua and Barbuda
			'BS', // Bahamas
			'BB', // Barbados
			'BM', // Bermuda
			'VG', // British Virgin Islands
			'KY', // Cayman Islands
			'DM', // Dominica
			'DO', // Dominican Republic
			'GD', // Grenada
			'GU', // Guam
			'JM', // Jamaica
			'PR', // Puerto Rico
			'MS', // Montserrat
			'MP', // Northern Mariana Islands
			'KN', // Saint Kitts and Nevis
			'LC', // Saint Lucia
			'VC', // Saint Vincent and the Grenadines
			'TT', // Trinidad and Tobago
			'TC', // Turks and Caicos Islands
			'VI'  // U.S. Virgin Islands
		];

	// Check for the NANP countries or Japan. Android 4.1.1 don't know about anything else.
	// s - two letter country code.
	function getFormatTypeFromCountryCode(s) {
		s = s.toUpperCase;
		return (NANP_COUNTRIES.indexOf(s) > 0) ? FORMAT_NANP : ('JP' == s) ? FORMAT_JAPAN : FORMAT_UNKNOWN;
	}

	// Formats a phone number using the NANP formatting rules. Numbers will be formatted as:
	// +1-xxx-xxx-xxxx, 1-xxx-xxx-xxxx, xxx-xxx-xxxx, xxx-xxxx, xxxxx
	function formatNanpNumber(s) {
		// Strip the dashes first, as we're going to add them back
		s = removeDashesAndSpaces(s);

		if (!nanpNumberValidator.test(s)) {
			return s;
		}

		var dashReversedPositions = [5, 8, 11], // index of dashes in dushless string counted from the END of string
			l = s.length,
			result = '',
			i = 0;

		for (; i < l; i++) {
			result += s.charAt(i) + ((dashReversedPositions.indexOf(l - i) < 0) ? '' : '-');
		}

		return result;
	}

	// Formats a phone number in-place using the Japanese formatting rules. Numbers will be formatted as:
	// 03-xxxx-xxxx, 090-xxxx-xxxx, 0120-xxx-xxx, +81-3-xxxx-xxxx, +81-90-xxxx-xxxx
	// s - number to be formatted, will be modified with the formatting
	function formatJapaneseNumber(s) {
		!japanesePhoneFormatter && ( japanesePhoneFormatter = require('Ti/_/Locale/JapanesePhoneFormatter'));
		return japanesePhoneFormatter.formatJapaneseNumber(s);
	}

	// Removes dashes and spaces from the string.
	function removeDashesAndSpaces(s) {
		return ('' + s).replace(dashesAndSpacesRegEx, ''); // do we need to remove spaces? on Android we are removing only dashes
	}

	return {
		// Formats a phone number in-place. Currently 'FORMAT_JAPAN' and 'FORMAT_NANP' are supported as a second argument.
		// phoneNumber - phone number to be formatted
		formatTelephoneNumber: function(phoneNumber, currentLocale) {
			var localeParts = (currentLocale) ? currentLocale.split(/-/) : [],
			// default formatting rules to apply if the number does not begin with +[country_code]
				formatType = getFormatTypeFromCountryCode(localeParts[localeParts.length - 1]);

			if (phoneNumber.length > 2 && phoneNumber.charAt(0) == '+') {
				if (phoneNumber.charAt(1) == '1') {
					formatType = FORMAT_NANP;
				} else if (phoneNumber.charAt(1) == '8' && phoneNumber.charAt(2) == '1') { // +81 JP
					formatType = FORMAT_JAPAN;
				} else {
					formatType = FORMAT_UNKNOWN;
				}
			}

			switch (formatType) {
				case FORMAT_NANP:
					return formatNanpNumber(phoneNumber);
				case FORMAT_JAPAN:
					return formatJapaneseNumber(phoneNumber);
				default:
					return removeDashesAndSpaces(phoneNumber);
			}
		}
	}
});