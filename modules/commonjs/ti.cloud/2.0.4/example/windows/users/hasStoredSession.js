windowFunctions['Has Stored Session'] = function () {
    alert(Cloud.hasStoredSession() ? 'Yes! ' + Cloud.retrieveStoredSession() : 'No.');
};