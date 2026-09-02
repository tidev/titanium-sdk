export const platformAliases = {
	// add additional aliases here for new platforms
	ipad: 'iphone',
	ios: 'iphone'
};

export function resolvePlatform(platform) {
	return platformAliases[platform] || platform;
}
