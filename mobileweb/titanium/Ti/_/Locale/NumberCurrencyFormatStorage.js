define(function() {

	// For the sake of memory efficiency, locale data is stored in a packed format. When locale
	// infrastructure is used first, it is prepared by expandLocaleData(), which fills
	// empty placeholders with default values, and unpackXXXXXXInfo(), which fills out
	// a convenient high-level structure used later for parsing or generating text.

	// Data format:
	
	// First array - Number localization data
	// [0] negative pattern (pattern for negative numbers)
	// [1] group sizes (as all value are simple digits - joined as string like
	// [2] decimal separator
	// [3] group separator
	// [4] decimal digits

	// Second array - Currency localization data
	// [0] ISO Code
	// [1] symbol
	// [2] negative pattern (pattern for negative numbers)
	// [3] positive pattern (pattern for positive numbers)
	// [4] decimal digits
	// [5] decimal separator
	// [6] group separator
	// [7] group sizes

	// sDefault number and currency localization item
	var defaultItem = [['-n','3','.',',',2],['USD','$','($n)','$n',2,'.',',','3']],
		numberCurrencyLocalizer = {
		'ar-SA': [['n-'],['SAR','\u0631.\u0633.\u200f','$n-','$ n']],
		'bg-BG': [[,,',','\u00a0'],['BGN','\u043b\u0432.','-n $','n $']],
		'ca-ES': [[,,',','.'],['EUR','\u20ac','-n $','n $']],
		'zh-TW': [,['TWD','NT$','-$n']],
		'cs-CZ': [[,,',','\u00a0'],['CZK','K\u010d','-n $','n $']],
		'da-DK': [[,,',','.'],['DKK','kr.','$ -n','$ n']],
		'de-DE': [[,,',','.'],['EUR','\u20ac','-n $','n $']],
		'el-GR': [[,,',','.'],['EUR','\u20ac','-n $','n $']],
		'fi-FI': [[,,',','\u00a0'],['EUR','\u20ac','-n $','n $']],
		'fr-FR': [[,,',','\u00a0'],['EUR','\u20ac','-n $','n $']],
		'he-IL': [,['ILS','\u20aa','$-n','$ n']],
		'hu-HU': [[,,',','\u00a0'],['HUF','Ft','-n $','n $']],
		'is-IS': [[,,',','.'],['ISK','kr.','-n $','n $',0]],
		'it-IT': [[,,',','.'],['EUR','\u20ac','-$ n','$ n']],
		'ja-JP': [,['JPY','\u00a5','-$n',,0]],
		'ko-KR': [,['KRW','\u20a9','-$n',,0]],
		'nl-NL': [[,,',','.'],['EUR','\u20ac','$ -n','$ n']],
		'nb-NO': [[,,',','\u00a0'],['NOK','kr','$ -n','$ n']],
		'pl-PL': [[,,',','\u00a0'],['PLN','z\u0142','-n $','n $']],
		'pt-BR': [[,,',','.'],['BRL','R$','-$ n','$ n']],
		'rm-CH': [[,,,'\u0027'],['CHF','fr.','$-n','$ n']],
		'ro-RO': [[,,',','.'],['RON','lei','-n $','n $']],
		'ru-RU': [[,,',','\u00a0'],['RUB','\u0440.','-n$','n$']],
		'hr-HR': [['- n',,',','.'],['HRK','kn','-n $','n $']],
		'sk-SK': [[,,',','\u00a0'],['EUR','\u20ac','-n $','n $']],
		'sq-AL': [[,,',','.'],['ALL','Lek','-n$','n$']],
		'sv-SE': [[,,',','\u00a0'],['SEK','kr','-n $','n $',,,'.']],
		'th-TH': [,['THB','\u0e3f','-$n']],
		'tr-TR': [[,,',','.'],['TRY','TL','-n $','n $']],
		'ur-PK': [,['PKR','Rs','$n-']],
		'id-ID': [[,,',','.'],['IDR','Rp',,,0]],
		'uk-UA': [[,,',','\u00a0'],['UAH','\u20b4','-n$','n$']],
		'be-BY': [[,,',','\u00a0'],['BYR','\u0440.','-n $','n $']],
		'sl-SI': [[,,',','.'],['EUR','\u20ac','-n $','n $']],
		'et-EE': [[,,',','\u00a0'],['EEK','kr','-n $','n $',,'.']],
		'lv-LV': [[,,',','\u00a0'],['LVL','Ls','-$ n','$ n']],
		'lt-LT': [[,,',','.'],['LTL','Lt','-n $','n $']],
		'tg-Cyrl-TJ': [[,'30',',','\u00a0'],['TJS','\u0442.\u0440.','-n $','n $',,';']],
		'fa-IR': [['n-'],['IRR','\u0631\u064a\u0627\u0644','$n-','$ n',,'/']],
		'vi-VN': [[,,',','.'],['VND','\u20ab','-n $','n $']],
		'hy-AM': [,['AMD','\u0564\u0580.','-n $','n $']],
		'az-Latn-AZ': [[,,',','\u00a0'],['AZN','man.','-n $','n $']],
		'eu-ES': [[,,',','.'],['EUR','\u20ac','-n $','n $']],
		'hsb-DE': [[,,',','.'],['EUR','\u20ac','-n $','n $']],
		'mk-MK': [[,,',','.'],['MKD','\u0434\u0435\u043d.','-n $','n $']],
		'tn-ZA': [,['ZAR','R','$-n','$ n']],
		'xh-ZA': [,['ZAR','R','$-n','$ n']],
		'zu-ZA': [,['ZAR','R','$-n','$ n']],
		'af-ZA': [,['ZAR','R','$-n','$ n']],
		'ka-GE': [[,,',','\u00a0'],['GEL','Lari','-n $','n $']],
		'fo-FO': [[,,',','.'],['DKK','kr.','$ -n','$ n']],
		'hi-IN': [[,'32'],['INR','\u0930\u0941','$ -n','$ n']],
		'mt-MT': [,['EUR','\u20ac','-$n']],
		'se-NO': [[,,',','\u00a0'],['NOK','kr','$ -n','$ n']],
		'ms-MY': [,['MYR','RM',,,0]],
		'kk-KZ': [[,,',','\u00a0'],['KZT','\u0422','-$n',,,'-']],
		'ky-KG': [[,,',','\u00a0'],['KGS','\u0441\u043e\u043c','-n $','n $',,'-']],
		'sw-KE': [,['KES','S']],
		'tk-TM': [[,,',','\u00a0'],['TMT','m.','-n$','n$']],
		'uz-Latn-UZ': [[,,',','\u00a0'],['UZS','so\u0027m','-n $','n $',0]],
		'tt-RU': [[,,',','\u00a0'],['RUB','\u0440.','-n $','n $']],
		'bn-IN': [[,'32'],['INR','\u099f\u09be','$ -n','$ n']],
		'pa-IN': [[,'32'],['INR','\u0a30\u0a41','$ -n','$ n']],
		'gu-IN': [[,'32'],['INR','\u0ab0\u0ac2','$ -n','$ n']],
		'or-IN': [[,'32'],['INR','\u0b1f','$ -n','$ n']],
		'ta-IN': [[,'32'],['INR','\u0bb0\u0bc2','$ -n','$ n']],
		'te-IN': [[,'32'],['INR','\u0c30\u0c42','$ -n','$ n']],
		'kn-IN': [[,'32'],['INR','\u0cb0\u0cc2','$ -n','$ n']],
		'ml-IN': [[,'32'],['INR','\u0d15','$ -n','$ n']],
		'as-IN': [[,'32'],['INR','\u099f','$ -n','n$']],
		'mr-IN': [[,'32'],['INR','\u0930\u0941','$ -n','$ n']],
		'sa-IN': [[,'32'],['INR','\u0930\u0941','$ -n','$ n']],
		'mn-MN': [[,,',','\u00a0'],['MNT','\u20ae','-n$','n$']],
		'bo-CN': [[,'30'],['CNY','\u00a5','$-n']],
		'cy-GB': [,['GBP','\u00a3','-$n']],
		'km-KH': [['- n','30'],['KHR','\u17db','-n$','n$',,,,'3']],
		'lo-LA': [['(n)','30'],['LAK','\u20ad','(n$)','n$']],
		'gl-ES': [[,,',','.'],['EUR','\u20ac','-n $','n $']],
		'kok-IN': [[,'32'],['INR','\u0930\u0941','$ -n','$ n']],
		'syr-SY': [,['SYP','\u0644.\u0633.\u200f','$n-','$ n']],
		'si-LK': [[,'32'],['LKR','\u0dbb\u0dd4.','($ n)','$ n',,,,'3']],
		'iu-Cans-CA': [[,'30'],['CAD']],
		'am-ET': [[,'30',,,1],['ETB','ETB','-$n',,2]],
		'ne-NP': [[,'32'],['NPR','\u0930\u0941','-$n',,,,,'3']],
		'fy-NL': [[,,',','.'],['EUR','\u20ac','$ -n','$ n']],
		'ps-AF': [['n-',,',','\u060c'],['AFN','\u060b','$n-',,,'\u066b','\u066c']],
		'fil-PH': [,['PHP','PhP']],
		'dv-MV': [,['MVR','\u0783.','n $-','n $']],
		'ha-Latn-NG': [,['NIO','N','$-n','$ n']],
		'yo-NG': [,['NIO','N','$-n','$ n']],
		'quz-BO': [[,,',','.'],['BOB','$b','($ n)','$ n']],
		'nso-ZA': [,['ZAR','R','$-n','$ n']],
		'ba-RU': [[,'30',',','\u00a0'],['RUB','\u04bb.','-n $','n $']],
		'lb-LU': [[,,',','\u00a0'],['EUR','\u20ac','-n $','n $']],
		'kl-GL': [[,'30',',','.'],['DKK','kr.','$ -n','$ n']],
		'ig-NG': [,['NIO','N','$-n','$ n']],
		'ii-CN': [[,'30'],['CNY','\u00a5','$-n',,,,,'3']],
		'arn-CL': [[,,',','.'],['CLP',,'-$ n','$ n']],
		'moh-CA': [[,'30'],['CAD',,,,,,,'3']],
		'br-FR': [[,,',','\u00a0'],['EUR','\u20ac','-n $','n $']],
		'ug-CN': [,['CNY','\u00a5','$-n']],
		'mi-NZ': [,['NZD',,'-$n']],
		'oc-FR': [[,,',','\u00a0'],['EUR','\u20ac','-n $','n $']],
		'co-FR': [[,,',','\u00a0'],['EUR','\u20ac','-n $','n $']],
		'gsw-FR': [[,,',','\u00a0'],['EUR','\u20ac','-n $','n $']],
		'sah-RU': [[,,',','\u00a0'],['RUB','\u0441.','-n$','n$']],
		'qut-GT': [,['GTQ','Q']],
		'rw-RW': [[,,',','\u00a0'],['RWF','RWF','$-n','$ n']],
		'wo-SN': [[,,',','\u00a0'],['XOF','XOF','-n $','n $']],
		'prs-AF': [['n-',,',','.'],['AFN','\u060b','$n-',,,'.',',']],
		'gd-GB': [,['GBP','\u00a3','-$n']],
		'ar-IQ': [['n-'],['IQD','\u062f.\u0639.\u200f','$n-','$ n']],
		'zh-CN': [,['CNY','\u00a5','$-n']],
		'de-CH': [[,,,'\u0027'],['CHF','Fr.','$-n','$ n']],
		'en-GB': [,['GBP','\u00a3','-$n']],
		'es-MX': [,['MXN',,'-$n']],
		'fr-BE': [[,,',','.'],['EUR','\u20ac','$ -n','$ n']],
		'it-CH': [[,,,'\u0027'],['CHF','fr.','$-n','$ n']],
		'nl-BE': [[,,',','.'],['EUR','\u20ac','$ -n','$ n']],
		'nn-NO': [[,,',','\u00a0'],['NOK','kr','$ -n','$ n']],
		'pt-PT': [[,,',','.'],['EUR','\u20ac','-n $','n $']],
		'sr-Latn-CS': [[,,',','.'],['CSD','Din.','-n $','n $']],
		'sv-FI': [[,,',','\u00a0'],['EUR','\u20ac','-n $','n $']],
		'az-Cyrl-AZ': [[,,',','\u00a0'],['AZN','\u043c\u0430\u043d.','-n $','n $']],
		'dsb-DE': [[,,',','.'],['EUR','\u20ac','-n $','n $']],
		'se-SE': [[,,',','\u00a0'],['SEK','kr','-n $','n $',,,'.']],
		'ga-IE': [,['EUR','\u20ac','-$n']],
		'ms-BN': [[,,',','.'],['BND',,,,0]],
		'uz-Cyrl-UZ': [[,,',','\u00a0'],['UZS','\u0441\u045e\u043c','-n $','n $']],
		'bn-BD': [[,'32'],['BDT','\u09f3','$ -n','$ n']],
		'mn-Mong-CN': [[,'30'],['CNY','\u00a5','$-n']],
		'iu-Latn-CA': [[,'30'],['CAD',,,,,,,'3']],
		'tzm-Latn-DZ': [['n-',,',','.'],['DZD','DZD','-n $','n $',,'.',',']],
		'quz-EC': [[,,',','.'],['USD',,'($ n)','$ n']],
		'ar-EG': [['n-',,,,3],['EGP','\u062c.\u0645.\u200f','$n-','$ n',2]],
		'zh-HK': [,['HKD','HK$']],
		'de-AT': [[,,',','.'],['EUR','\u20ac','-$ n','$ n']],
		'en-AU': [,['AUD',,'-$n']],
		'es-ES': [[,,',','.'],['EUR','\u20ac','-n $','n $']],
		'fr-CA': [[,,',','\u00a0'],['CAD',,'(n $)','n $']],
		'sr-Cyrl-CS': [[,,',','.'],['CSD','\u0414\u0438\u043d.','-n $','n $']],
		'se-FI': [[,,',','\u00a0'],['EUR','\u20ac','-n $','n $']],
		'quz-PE': [,['PEN','S/.','$ -n','$ n']],
		'ar-LY': [['n-',,,,3],['LYD','\u062f.\u0644.\u200f','$n-']],
		'zh-SG': [,['SGD']],
		'de-LU': [[,,',','.'],['EUR','\u20ac','-n $','n $']],
		'en-CA': [,['CAD',,'-$n']],
		'es-GT': [,['GTQ','Q']],
		'fr-CH': [[,,,'\u0027'],['CHF','fr.','$-n','$ n']],
		'hr-BA': [['- n',,',','.'],['BAM','KM','-n $','n $']],
		'smj-NO': [[,,',','\u00a0'],['NOK','kr','$ -n','$ n']],
		'ar-DZ': [['n-'],['DZD','\u062f.\u062c.\u200f','$n-','$ n']],
		'zh-MO': [,['MOP','MOP']],
		'de-LI': [[,,,'\u0027'],['CHF','CHF','$-n','$ n']],
		'en-NZ': [,['NZD',,'-$n']],
		'es-CR': [[,,',','.'],['CRC','\u20a1']],
		'fr-LU': [[,,',','\u00a0'],['EUR','\u20ac','-n $','n $']],
		'bs-Latn-BA': [[,,',','.'],['BAM','KM','-n $','n $']],
		'smj-SE': [[,,',','\u00a0'],['SEK','kr','-n $','n $',,,'.']],
		'ar-MA': [['n-'],['MAD','\u062f.\u0645.\u200f','$n-','$ n']],
		'en-IE': [,['EUR','\u20ac','-$n']],
		'es-PA': [,['PAB','B/.','($ n)','$ n']],
		'fr-MC': [[,,',','\u00a0'],['EUR','\u20ac','-n $','n $']],
		'sr-Latn-BA': [[,,',','.'],['BAM','KM','-n $','n $']],
		'sma-NO': [[,,',','\u00a0'],['NOK','kr','$ -n','$ n']],
		'ar-TN': [['n-',,,,3],['TND','\u062f.\u062a.\u200f','$n-','$ n']],
		'en-ZA': [[,,,'\u00a0'],['ZAR','R','$-n','$ n',,',']],
		'es-DO': [,['DOP','RD$']],
		'sr-Cyrl-BA': [[,,',','.'],['BAM','\u041a\u041c','-n $','n $']],
		'sma-SE': [[,,',','\u00a0'],['SEK','kr','-n $','n $',,,'.']],
		'ar-OM': [['n-'],['OMR','\u0631.\u0639.\u200f','$n-','$ n',3]],
		'en-JM': [,['JMD','J$','-$n']],
		'es-VE': [[,,',','.'],['VEF','Bs. F.','$ -n','$ n']],
		'bs-Cyrl-BA': [[,,',','.'],['BAM','\u041a\u041c','-n $','n $']],
		'sms-FI': [[,,',','\u00a0'],['EUR','\u20ac','-n $','n $']],
		'ar-YE': [['n-'],['YER','\u0631.\u064a.\u200f','$n-','$ n']],
		'en-029': [,['USD',,'-$n']],
		'es-CO': [[,,',','.'],['COP',,'($ n)','$ n']],
		'sr-Latn-RS': [[,,',','.'],['RSD','Din.','-n $','n $']],
		'smn-FI': [[,,',','\u00a0'],['EUR','\u20ac','-n $','n $']],
		'ar-SY': [['n-'],['SYP','\u0644.\u0633.\u200f','$n-','$ n']],
		'en-BZ': [,['BZD','BZ$',,,,,,'30']],
		'es-PE': [,['PEN','S/.','$ -n','$ n']],
		'sr-Cyrl-RS': [[,,',','.'],['RSD','\u0414\u0438\u043d.','-n $','n $']],
		'ar-JO': [['n-',,,,3],['JOD','\u062f.\u0627.\u200f','$n-','$ n']],
		'en-TT': [,['TTD','TT$',,,,,,'30']],
		'es-AR': [[,,',','.'],['ARS',,'$-n','$ n']],
		'sr-Latn-ME': [[,,',','.'],['EUR','\u20ac','-n $','n $']],
		'ar-LB': [['n-'],['LBP','\u0644.\u0644.\u200f','$n-','$ n']],
		'en-ZW': [,['ZWL','Z$']],
		'es-EC': [[,,',','.'],['USD',,'($ n)','$ n']],
		'sr-Cyrl-ME': [[,,',','.'],['EUR','\u20ac','-n $','n $']],
		'ar-KW': [['n-',,,,3],['KWD','\u062f.\u0643.\u200f','$n-','$ n']],
		'en-PH': [,['PHP','Php']],
		'es-CL': [[,,',','.'],['CLP',,'-$ n','$ n']],
		'ar-AE': [['n-'],['AED','\u062f.\u0625.\u200f','$n-','$ n']],
		'es-UY': [[,,',','.'],['UYU','$U','($ n)','$ n']],
		'ar-BH': [['n-',,,,3],['BHD','\u062f.\u0628.\u200f','$n-','$ n']],
		'es-PY': [[,,',','.'],['PYG','Gs','($ n)','$ n']],
		'ar-QA': [['n-'],['QAR','\u0631.\u0642.\u200f','$n-','$ n']],
		'en-IN': [[,'32'],['INR','Rs.','$ -n','$ n']],
		'es-BO': [[,,',','.'],['BOB','$b','($ n)','$ n']],
		'en-MY': [,['MYR','RM']],
		'es-SV': [,['USD',,,,,,,'30']],
		'en-SG': [,['SGD']],
		'es-HN': [,['HNL','L.','$ -n','$ n',,,,'30']],
		'es-NI': [,['NIO','C$','($ n)','$ n',,,,'30']],
		'es-PR': [,['USD',,'($ n)','$ n',,,,'30']],
		'es-US': [[,'30'],['USD',,,,,,,'3']]};

	function expandLocaleData(localeItem) {
		(!localeItem[0]) && (localeItem[0] = []);
		(!localeItem[0][0]) && (localeItem[0][0] = defaultItem[0][0]);
		(!localeItem[0][1]) && (localeItem[0][1] = defaultItem[0][1]);
		(!localeItem[0][2]) && (localeItem[0][2] = defaultItem[0][2]);
		(!localeItem[0][3]) && (localeItem[0][3] = defaultItem[0][3]);
		(!localeItem[0][4]) && (localeItem[0][4] = defaultItem[0][4]);

		(!localeItem[1]) && (localeItem[1] = []);
		(!localeItem[1][1]) && (localeItem[1][1] = defaultItem[1][1]);
		(!localeItem[1][2]) && (localeItem[1][2] = defaultItem[1][2]);
		(!localeItem[1][3]) && (localeItem[1][3] = defaultItem[1][3]);
		(!localeItem[1][4]) && (localeItem[1][4] = defaultItem[1][4]);

		(!localeItem[1][5]) && (localeItem[1][5] = localeItem[0][2]);
		(!localeItem[1][6]) && (localeItem[1][6] = localeItem[0][3]);
		(!localeItem[1][7]) && (localeItem[1][7] = localeItem[0][1]);

		return localeItem;
	}

	function parseGroupSizes(gs) {
		// converting string like '320' to array [3,2,1]
		return (('' + gs).split('')).map(function (a) {
			return parseInt(a, 10);
		})
	}

	function unpackCurrencyInfo(localeItem) {
		var lc = expandLocaleData(localeItem)[1];
		return {
			currencyCode: lc[0],
			currencySymbol: lc[1],
			negativePattern: lc[2],
			positivePattern: lc[3],
			decimalDigits: lc[4],
			decimalSeparator: lc[5],
			groupSeparator: lc[6],
			groupSizes: parseGroupSizes(lc[7])
		}
	}

	function unpackNumberInfo(localeItem) {
		var lc = expandLocaleData(localeItem)[0];
		return {
			negativePattern: lc[0],
			groupSizes: parseGroupSizes(lc[1]),
			decimalSeparator : lc[2],
			groupSeparator: lc[3],
			decimalDigits: lc[4]}
	}

	// retrieves item by name from numberCurrencyLocalizer. If provided only culture name (like de, not de-DE)
	// first acceptable match will be returned. If localeName can't be resolved in any cale - defaultItem will be returned.
	function getLocaleItem(localeName) {
		var result = numberCurrencyLocalizer[localeName],
			lName;

		if (!result) {
			// trying to match localeName as a first part of name (no country code in locale)
			localeName += '-';
			for (lName in numberCurrencyLocalizer) {
				if (lName.slice(0, localeName.length) == localeName) {
					result = numberCurrencyLocalizer[lName];
					break;
				}
			}
		}
		return result || defaultItem;
	}

	return {
		getNumberInfoByLocale: function (locale) {
			return unpackNumberInfo(getLocaleItem(locale));
		},
		getCurrencyInfoByLocale: function (locale) {
			return unpackCurrencyInfo(getLocaleItem(locale));
		},
		getCurrencyInfoByCode: function (currencyCode) {
			var targetCode = currencyCode.toUpperCase(),
				result = defaultItem,
				localeItem,
				i;

			for (i in numberCurrencyLocalizer) {
				localeItem = numberCurrencyLocalizer[i];
				if (localeItem && localeItem[1] && ('' + localeItem[1][0]).toUpperCase() == targetCode) {
					result = localeItem;
					break;
				}
			}
			return unpackCurrencyInfo(result);
		}
	};
});