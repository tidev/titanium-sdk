/**
 * Adds a Swift Package dependency configuration to the supplied PBX object graph.
 *
 * @param {object} xobjs The PBX objects hash from the parsed pbxproj.
 * @param {object} config Swift package configuration.
 * @param {object} [options] Additional options.
 * @param {Function} [options.generateUUID] Function returning a unique 24 char uppercase UUID.
 */
export function injectSPMPackage(xobjs, config, options = {}) {
	if (!xobjs || typeof xobjs !== 'object') {
		return;
	}

	const generateUUID = typeof options.generateUUID === 'function' ? options.generateUUID : generateUUID24;

	const {
		remotePackageReference,
		repositoryURL,
		requirementKind,
		requirementMinimumVersion,
		products = []
	} = config;

	if (!repositoryURL || !products.length) {
		return;
	}

	xobjs.PBXBuildFile = xobjs.PBXBuildFile || {};
	xobjs.PBXFrameworksBuildPhase = xobjs.PBXFrameworksBuildPhase || {};
	xobjs.PBXNativeTarget = xobjs.PBXNativeTarget || {};
	xobjs.PBXProject = xobjs.PBXProject || {};

	const remoteReferenceKey = ensureRemotePackageReference(
		xobjs,
		{
			remotePackageReference,
			repositoryURL,
			requirementKind,
			requirementMinimumVersion
		},
		generateUUID
	);

	Object.keys(xobjs.PBXProject).forEach(function (pbxProjUUID) {
		const pbxProj = xobjs.PBXProject[pbxProjUUID];
		if (pbxProj && typeof pbxProj === 'object') {
			pbxProj.packageReferences = updatePBXList(
				pbxProj.packageReferences,
				[ remoteReferenceKey ]
			);
		}
	});

	const packageProductDependencyEntries = [];
	const nonStaticTargets = getNonStaticLibraryTargets(xobjs);
	const frameworkPhaseKeys = getFrameworkPhaseKeys(xobjs, nonStaticTargets);

	products.forEach(function (productConfig) {
		const productDependency = ensureProductDependency(xobjs, remoteReferenceKey, productConfig, generateUUID);
		packageProductDependencyEntries.push(productDependency.key);

		const buildFile = ensureFrameworkBuildFile(xobjs, productDependency.uuid, productConfig, generateUUID);

		frameworkPhaseKeys.forEach(function (phaseKey) {
			const buildPhase = xobjs.PBXFrameworksBuildPhase[phaseKey];
			ensureBuildPhaseHasFile(buildPhase, buildFile.uuid, buildFile.comment);
		});
	});

	nonStaticTargets.forEach(function (targetInfo) {
		const nativeTarget = targetInfo.target;
		if (nativeTarget && typeof nativeTarget === 'object') {
			nativeTarget.packageProductDependencies = updatePBXList(
				nativeTarget.packageProductDependencies,
				packageProductDependencyEntries
			);
		}
	});
}

function ensureRemotePackageReference(xobjs, config, generateUUID) {
	xobjs.XCRemoteSwiftPackageReference = xobjs.XCRemoteSwiftPackageReference || {};
	const remoteRefs = xobjs.XCRemoteSwiftPackageReference;
	const repositoryURL = config.repositoryURL;
	const requirementKind = config.requirementKind;
	const minimumVersion = config.requirementMinimumVersion;

	const existingKey = Object.keys(remoteRefs).find(function (key) {
		const entry = remoteRefs[key];
		if (!entry || typeof entry !== 'object') {
			return false;
		}
		const repo = stripQuotes(entry.repositoryURL);
		return repo === repositoryURL;
	});

	if (existingKey) {
		const existingEntry = remoteRefs[existingKey];
		existingEntry.repositoryURL = '"' + repositoryURL + '"';
		existingEntry.requirement = {
			kind: requirementKind,
			minimumVersion: minimumVersion
		};
		return existingKey;
	}

	const spmRemotePackageUUID = generateUUID();
	const referenceComment = config.remotePackageReference || repositoryURL;
	const remoteReferenceKey = spmRemotePackageUUID
	+ ' /* XCRemoteSwiftPackageReference "'
	+ referenceComment + '" */';

	remoteRefs[remoteReferenceKey] = {
		isa: 'XCRemoteSwiftPackageReference',
		repositoryURL: '"' + repositoryURL + '"',
		requirement: {
			kind: requirementKind,
			minimumVersion: minimumVersion
		}
	};

	return remoteReferenceKey;
}

function ensureProductDependency(xobjs, remoteReferenceKey, productConfig, generateUUID) {
	xobjs.XCSwiftPackageProductDependency = xobjs.XCSwiftPackageProductDependency || {};
	const dependencies = xobjs.XCSwiftPackageProductDependency;
	const productName = productConfig.productName;

	const existingKey = Object.keys(dependencies).find(function (key) {
		const entry = dependencies[key];
		return entry && entry.productName === productName;
	});

	if (existingKey) {
		const existingEntry = dependencies[existingKey];
		existingEntry.package = remoteReferenceKey;
		return {
			key: existingKey,
			uuid: extractUUID(existingKey)
		};
	}

	const swiftProductUUID = generateUUID();
	const productDependencyKey = swiftProductUUID + ' /* '
		+ productName + ' */';

	dependencies[productDependencyKey] = {
		isa: 'XCSwiftPackageProductDependency',
		package: remoteReferenceKey,
		productName: productName
	};

	return {
		key: productDependencyKey,
		uuid: swiftProductUUID
	};
}

function ensureFrameworkBuildFile(xobjs, swiftProductUUID, productConfig, generateUUID) {
	const frameworkName = productConfig.frameworkName || productConfig.productName;
	const comment = frameworkName + ' in Frameworks';
	const productName = productConfig.productName;

	xobjs.PBXBuildFile = xobjs.PBXBuildFile || {};
	const buildFiles = xobjs.PBXBuildFile;

	const existingKey = Object.keys(buildFiles).find(function (key) {
		return key && key.indexOf(comment) !== -1;
	});

	if (existingKey) {
		const existingEntry = buildFiles[existingKey];
		existingEntry.productRef = swiftProductUUID;
		existingEntry.fileRef_comment = productName + ' in Frameworks';
		return {
			key: existingKey,
			uuid: extractUUID(existingKey),
			comment: comment
		};
	}

	const pbxBuildFileUUID = generateUUID();
	const buildFileKey = pbxBuildFileUUID + ' /* '
		+ comment + ' */';

	buildFiles[buildFileKey] = {
		isa: 'PBXBuildFile',
		productRef: swiftProductUUID,
		fileRef_comment: productName + ' in Frameworks'
	};

	return {
		key: buildFileKey,
		uuid: pbxBuildFileUUID,
		comment: comment
	};
}

function ensureBuildPhaseHasFile(buildPhase, pbxBuildFileUUID, comment) {
	if (!buildPhase || typeof buildPhase !== 'object') {
		return;
	}

	buildPhase.files = buildPhase.files || [];

	let updated = false;

	buildPhase.files.forEach(function (fileEntry) {
		if (!fileEntry || typeof fileEntry !== 'object') {
			return;
		}
		if (fileEntry.comment === comment || fileEntry.value === pbxBuildFileUUID) {
			fileEntry.value = pbxBuildFileUUID;
			fileEntry.comment = comment;
			updated = true;
		}
	});

	if (!updated) {
		buildPhase.files.push({
			value: pbxBuildFileUUID,
			comment: comment
		});
	}
}

function getNonStaticLibraryTargets(xobjs) {
	const targets = [];

	Object.keys(xobjs.PBXNativeTarget || {}).forEach(function (targetKey) {
		const target = xobjs.PBXNativeTarget[targetKey];
		if (!target || typeof target !== 'object') {
			return;
		}

		const productType = target.productType || '';
		if (productType.indexOf('library.static') !== -1) {
			return;
		}

		targets.push({
			key: targetKey,
			uuid: extractUUID(targetKey),
			target: target
		});
	});

	return targets;
}

function getFrameworkPhaseKeys(xobjs, targetInfos) {
	const frameworkPhaseKeys = [];
	const frameworkPhaseSet = new Set();

	targetInfos.forEach(function (info) {
		const target = info.target;
		const buildPhases = listFromPBXValue(target.buildPhases);

		buildPhases.forEach(function (phaseRef) {
			const phaseUUID = extractUUID(phaseRef);
			const phaseKey = findFrameworkPhaseKey(xobjs, phaseUUID);

			if (phaseKey && !frameworkPhaseSet.has(phaseKey)) {
				frameworkPhaseSet.add(phaseKey);
				frameworkPhaseKeys.push(phaseKey);
			}
		});
	});

	return frameworkPhaseKeys;
}

function listFromPBXValue(value) {
	if (!value) {
		return [];
	}

	if (Array.isArray(value)) {
		return value.map(function (entry) {
			if (typeof entry === 'string') {
				return entry.trim();
			}
			if (entry && typeof entry === 'object' && entry.value) {
				const commentSegment = entry.comment ? ' /* ' + entry.comment + ' */' : '';
				return entry.value + commentSegment;
			}
			return null;
		}).filter(Boolean);
	}

	if (typeof value === 'string') {
		return parsePBXList(value);
	}

	return [];
}

function findFrameworkPhaseKey(xobjs, phaseUUID) {
	if (!phaseUUID) {
		return null;
	}

	const keys = Object.keys(xobjs.PBXFrameworksBuildPhase || {});

	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		if (extractUUID(key) === phaseUUID) {
			return key;
		}
	}

	return null;
}

function updatePBXList(existingList, additions) {
	const items = parsePBXList(existingList);

	additions.forEach(function (item) {
		if (items.indexOf(item) === -1) {
			items.push(item);
		}
	});

	return formatPBXList(items);
}

function parsePBXList(listString) {
	if (Array.isArray(listString)) {
		return listString.map(function (entry) {
			if (typeof entry === 'string') {
				return entry.trim();
			}
			if (entry && typeof entry === 'object' && entry.value) {
				const commentSegment = entry.comment ? ' /* ' + entry.comment + ' */' : '';
				return entry.value + commentSegment;
			}
			return null;
		}).filter(Boolean);
	}

	if (typeof listString !== 'string') {
		return [];
	}

	return listString
		.replace(/[()]/g, '')
		.split(',')
		.map(function (entry) {
			return entry.trim();
		})
		.filter(function (entry) {
			return entry.length > 0;
		});
}

function formatPBXList(items) {
	if (!items || !items.length) {
		return '(\n\t\t\t)';
	}

	return '(\n' + items.map(function (entry) {
		return '\t\t\t\t' + entry + ',';
	}).join('\n') + '\n\t\t\t)';
}

function extractUUID(reference) {
	if (!reference || typeof reference !== 'string') {
		return reference;
	}

	const spaceIndex = reference.indexOf(' ');
	if (spaceIndex === -1) {
		return reference;
	}

	return reference.substring(0, spaceIndex);
}

function stripQuotes(value) {
	if (typeof value !== 'string') {
		return value;
	}

	return value.replace(/^"+|"+$/g, '');
}

function generateUUID24() {
	const chars = '0123456789ABCDEF';
	let uuid = '';

	for (let i = 0; i < 24; i++) {
		const randomIndex = Math.floor(Math.random() * chars.length);
		uuid += chars[randomIndex];
	}

	return uuid;
}
