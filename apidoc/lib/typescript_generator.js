'use strict';

/*
 * Map of invalid types and their replacement
 */
const invalidTypeMap = {
	'2DMatrix': 'Matrix2D',
	'3DMatrix': 'Matrix3D',
	Dictionary: 'any',
	Object: 'any'
};
let parser = null;

exports.exportData = function exportGlobalTemplate(apis) {
	parser = new DocsParser(apis);
	parser.parse();

	const writer = new GlobalTemplateWriter();
	writer.generateTitaniumDefinition(parser.tree);

	return writer.output;
};

/**
 * Checks if a proxy only consists of constants.
 *
 * These need to be rendered as a namespace instead of an interface because they
 * are used exclusively as values instead of types.
 *
 * @param {Object} typeInfo API docs
 * @return {Boolean} True if the given API type doc consists of constants only.
 */
function isConstantsOnlyProxy(typeInfo) {
	if (typeInfo.__subtype !== 'proxy') {
		return false;
	}

	const ownMethods = typeInfo.methods.filter(methodDoc => methodDoc.__inherits === typeInfo.name);
	const ownWritableProperties = typeInfo.properties.filter(propertyDoc => propertyDoc.__inherits === typeInfo.name && propertyDoc.permission !== 'read-only');
	const ownReadOnlyProperties = typeInfo.properties.filter(propertyDoc => propertyDoc.__inherits === typeInfo.name && propertyDoc.permission === 'read-only');
	if (ownMethods.length === 0 && ownReadOnlyProperties.length > 0 && ownWritableProperties.length === 0) {
		return true;
	}

	return false;
}

/**
 * Checks if a type can safely be extended from an already existing interface.
 *
 * A type can be extended from another type when it contains all of its
 * properties and methods.
 *
 * @param {Object} typeInfo Type info of the type that should be checked if it can extend another type
 * @param {InterfaceNode} interfaceNode Node of the type that should be extended
 * @return {Boolean} True if the type can extend the given interface, false if not
 */
function canExtend(typeInfo, interfaceNode) {
	if (!interfaceNode) {
		return false;
	}

	if (typeInfo.name === interfaceNode.fullyQualifiedName) {
		return false;
	}

	function hasAllMembers(typeMembers, interfaceMembers) {
		return interfaceMembers.every(interfaceMemberNode => {
			if (interfaceMemberNode.optional) {
				return true;
			}

			return typeMembers.some(typeMember => interfaceMemberNode.name === typeMember.name);
		});
	}

	return hasAllMembers(typeInfo.properties, interfaceNode.properties) && hasAllMembers(typeInfo.methods, interfaceNode.methods);
}

/**
 * Removes all memebers of the first type info object that are also present in
 * the given interface node.
 *
 * @param {Object} typeInfo Type info object whos members should be removed
 * @param {InterfaceNode} interfaceNode Reference interface node
 */
function removeMembers(typeInfo, interfaceNode) {
	function filterMembers(typeMembers, interfaceMembers) {
		return typeMembers.filter(memberInfo => !interfaceMembers.some(interfaceMember => interfaceMember.name === memberInfo.name));
	}

	typeInfo.properties = filterMembers(typeInfo.properties, interfaceNode.properties);
	typeInfo.methods = filterMembers(typeInfo.methods, interfaceNode.methods);
}

/**
 * Parses the prepared API type docs and creates a syntax tree that can be used
 * to generate a TypeScript type definition file.
 */
class DocsParser {
	/**
	 * Constructs a new docs parser
	 *
	 * @param {Object} apis Hash map of Titanium type names and their definition.
	 */
	constructor(apis) {
		this.titaniumNamespace = null;
		this.proxyInterface = null;
		this.viewInterface = null;
		this.apis = apis;
		this.tree = new EmulatedSyntaxTree();
	}

	/**
	 * Parses all Titanium types and generates the emulated TypeScript syntax tree.
	 */
	parse() {
		this.titaniumNamespace = new NamespaceNode(this.apis['Titanium']);
		this.tree.addNode(this.titaniumNamespace);
		delete this.apis['Titanium'];
		this.proxyInterface = new InterfaceNode(this.apis['Titanium.Proxy']);
		this.titaniumNamespace.addInterface(this.proxyInterface);
		delete this.apis['Titanium.Proxy'];
		const uiNamespace = new NamespaceNode(this.apis['Titanium.UI']);
		this.tree.registerNamespace(uiNamespace.fullyQualifiedName, uiNamespace);
		this.titaniumNamespace.addNamespace(uiNamespace);
		delete this.apis['Titanium.UI'];
		this.viewInterface = new InterfaceNode(this.apis['Titanium.UI.View']);
		uiNamespace.addInterface(this.viewInterface);

		for (const fullyQualifiedTypeName in this.apis) {
			const typeInfo = this.apis[fullyQualifiedTypeName];
			const namespaceParts = typeInfo.name.split('.');
			namespaceParts.pop();

			if (namespaceParts[0] !== 'Titanium' && namespaceParts.length > 0) {
				console.log(`Skipping module ${typeInfo.name}`);
				continue;
			} else if (typeInfo.name === 'Global') {
				console.log('Skipping module Global');
				continue;
			} else if (typeInfo.name === 'Dictionary') {
				console.log('Skipping Dictionary pseudo object.');
				continue;
			}

			const parentNamespace = this.findOrCreateNamespace(namespaceParts);
			if (this.isInterface(typeInfo)) {
				const interfaceNode = new InterfaceNode(typeInfo);
				if (parentNamespace) {
					parentNamespace.addInterface(interfaceNode);
				} else {
					this.tree.addNode(interfaceNode);
				}
			} else if (this.isNamespace(typeInfo)) {
				if (!this.tree.hasNamespace(typeInfo.name)) {
					const namespace = new NamespaceNode(typeInfo);
					this.tree.registerNamespace(namespace.fullyQualifiedName, namespace);
					if (parentNamespace) {
						parentNamespace.addNamespace(namespace);
					}
				}
			} else {
				console.warn(`Unhandled type ${typeInfo.name}`);
			}
		}
	}

	/**
	 * Finds or creates a namespace node via the given namespace name parts.
	 *
	 * @param {Array<String>} namespaceParts Namespace name splitted with dot as delimiter
	 * @return {NamespaceNode}
	 * @throws Error
	 */
	findOrCreateNamespace(namespaceParts) {
		if (namespaceParts.length === 0) {
			return null;
		}

		const parentNamespaceName = namespaceParts.join('.');
		let parentNamespace = null;
		if (!this.tree.hasNamespace(parentNamespaceName)) {
			let namespacePathFromRoot = [];
			namespaceParts.forEach(namespaceName => {
				namespacePathFromRoot.push(namespaceName);
				const subordinateNamespaceName = namespacePathFromRoot.join('.');
				if (!this.tree.hasNamespace(subordinateNamespaceName)) {
					const doc = this.apis[subordinateNamespaceName];
					if (!doc) {
						throw new Error(`Couldn't find docs for ${subordinateNamespaceName}.`);
					}
					const subordinateNamespace = new NamespaceNode(this.apis[subordinateNamespaceName]);
					this.tree.registerNamespace(subordinateNamespace.fullyQualifiedName, subordinateNamespace);
					parentNamespace.addNamespace(subordinateNamespace);
					parentNamespace = subordinateNamespace;
				} else {
					parentNamespace = this.tree.getNamespace(subordinateNamespaceName);
				}
			});
		} else {
			parentNamespace = this.tree.getNamespace(parentNamespaceName);
		}

		if (!parentNamespace) {
			throw new Error(`Couldn't create namespace path up to ${parentNamespaceName}.`);
		}

		return parentNamespace;
	}

	/**
	 * Returns true if the given API type should be rendered as a TypeScript interface.
	 *
	 * To be considered as TypeScript interface a type must either one of the
	 * subtypes proxy (but not a constants only proxy), pseudo or view OR is a
	 * module which is blacklisted from being rendered as namespace.
	 *
	 * @param {Object} typeInfo Parsed API type info from YAML docs.
	 * @return {Boolean} True if the API type is considered an interface in TypeScript, false if not.
	 */
	isInterface(typeInfo) {
		const validSubtypes = [
			'proxy',
			'pseudo',
			'view'
		];
		// List of modules that need to be generated as an interface instead of a namespace.
		const namespaceBlacklist = [
			'Titanium.App.iOS.UserDefaults',
		];

		return (validSubtypes.indexOf(typeInfo.__subtype) !== -1 && !isConstantsOnlyProxy(typeInfo))
			|| namespaceBlacklist.indexOf(typeInfo.name) !== -1;
	}

	/**
	 * Returns true if the given API type should be rendered as a TypeScript namespace.
	 *
	 * To be considered as a TypeScript namespace, a type must be of the subtype
	 * module OR be a constatns only proxy.
	 *
	 * @param {Object} typeInfo Parsed API type info from YAML docs.
	 * @return {Boolean} True if the API type is considered a namespace in TypeScript, false if not.
	 */
	isNamespace(typeInfo) {
		return typeInfo.__subtype === 'module' || isConstantsOnlyProxy(typeInfo);
	}
}

/**
 * A very basic representation of a TypeScript syntax tree.
 */
class EmulatedSyntaxTree {
	constructor() {
		this.nodes = [];
		this.namespaces = new Map();
	}

	addNode(node) {
		if (node instanceof NamespaceNode && !this.hasNamespace(node.fullyQualifiedName)) {
			this.registerNamespace(node.fullyQualifiedName, node);
		}
		this.nodes.push(node);
	}

	registerNamespace(namespaceName, namespace) {
		this.namespaces.set(namespaceName, namespace);
	}

	hasNamespace(namespaceName) {
		return this.namespaces.has(namespaceName);
	}

	getNamespace(namespaceName) {
		return this.namespaces.get(namespaceName);
	}
}

/**
 * Generates the Titanium TypeScript definition from the simplified TypeScript
 * syntax tree using the global template.
 *
 * @see https://www.typescriptlang.org/docs/handbook/declaration-files/templates/global-d-ts.html
 */
class GlobalTemplateWriter {
	/**
	 * Constructs a new global template writer.
	 */
	constructor() {
		this.output = '';
	}

	/**
	 * Generates the complete Titanium TypeScript type definition as a sstring and
	 * writes it to the output property.
	 *
	 * @param {EmulatedSyntaxTree} tree The simplified TypeScript syntax tree to generated the definitions from
	 */
	generateTitaniumDefinition(tree) {
		this.writeHeader();
		this.writeTiShorthand();
		this.writeNodes(tree.nodes);
	}

	/**
	 * Writes the type definition header required by DefinitelyTyped.
	 *
	 */
	writeHeader() {
		const { version } = require('../../package.json');
		const versionSplit = version.split('.');
		const majorMinor = `${versionSplit[0]}.${versionSplit[1]}`;
		this.output += `// Type definitions for non-npm package Titanium ${majorMinor}\n`;
		this.output += '// Project: https://github.com/appcelerator/titanium_mobile\n';
		this.output += '// Definitions by: Axway Appcelerator <https://github.com/appcelerator>\n';
		this.output += '//                 Jan Vennemann <https://github.com/janvennemann>\n';
		this.output += '// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped\n';
		this.output += '// TypeScript Version: 2.6\n';
	}

	/**
	 * Writes the "Ti" shorthand alias for the global Titanium namespace.
	 */
	writeTiShorthand() {
		this.output += 'declare const Ti: typeof Titanium;\n';
	}

	/**
	 * Renders all nodes from the synatx tree and adds them to the output.
	 *
	 * @param {MemberNode} nodes Syntax tree node to render and write
	 */
	writeNodes(nodes) {
		for (const node of nodes) {
			if (node instanceof NamespaceNode) {
				this.writeNamespaceNode(node, 0);
			} else if (node instanceof InterfaceNode) {
				this.writeInterfaceNode(node, 0);
			}
		}
	}

	/**
	 * Renders and writes a namespace node to the output.
	 *
	 * @param {NamespaceNode} namespaceNode Namesapce node to write out
	 * @param {Number} nestingLevel Current nesting level for indentation
	 */
	writeNamespaceNode(namespaceNode, nestingLevel) {
		this.output += '\n';
		this.output += this.generateJsDoc(namespaceNode, nestingLevel);
		this.output += `${this.indent(nestingLevel)}${nestingLevel === 0 ? 'declare ' : ''}namespace ${namespaceNode.name} {\n`;
		if (namespaceNode.properties.length > 0) {
			namespaceNode.properties.forEach(propertyNode => this.writeVariableNode(propertyNode, nestingLevel + 1));
		}
		if (namespaceNode.methods.length > 0) {
			namespaceNode.methods.forEach(methodNode => this.writeFunctionNode(methodNode, nestingLevel + 1));
		}
		if (namespaceNode.interfaces.length > 0) {
			namespaceNode.interfaces.forEach(interfaceNode => this.writeInterfaceNode(interfaceNode, nestingLevel + 1));
		}
		if (namespaceNode.namespaces.length > 0) {
			namespaceNode.namespaces.forEach(childNamespace => this.writeNamespaceNode(childNamespace, nestingLevel + 1));
		}
		this.output += `${this.indent(nestingLevel)}}\n`;
	}

	/**
	 * Renders and writes a interface node to the output.
	 *
	 * @param {InterfaceNode} interfaceNode Interface node to write out
	 * @param {Number} nestingLevel Current nesting level for indentation
	 */
	writeInterfaceNode(interfaceNode, nestingLevel) {
		this.output += this.generateJsDoc(interfaceNode, nestingLevel);
		this.output += `${this.indent(nestingLevel)}interface ${interfaceNode.name} ${interfaceNode.extends ? 'extends ' + interfaceNode.extends + ' ' : ''}{\n`;
		if (interfaceNode.properties.length > 0) {
			interfaceNode.properties.forEach(propertyNode => this.writePropertyNode(propertyNode, nestingLevel + 1));
		}
		if (interfaceNode.methods.length > 0) {
			interfaceNode.methods.forEach(methodNode => this.writeMethodNode(methodNode, nestingLevel + 1));
		}
		this.output += `${this.indent(nestingLevel)}}\n`;
	}

	/**
	 * Renders and writes a variable node to the output.
	 *
	 * @param {VariableNode} variableNode Variable node to write out
	 * @param {Number} nestingLevel Current nesting level for indentation
	 */
	writeVariableNode(variableNode, nestingLevel) {
		this.output += this.generateJsDoc(variableNode, nestingLevel);
		this.output += `${this.indent(nestingLevel)}${variableNode.isConstant ? 'const' : 'let'} ${variableNode.name}: ${this.normalizeType(variableNode.type)};\n\n`;
	}

	/**
	 * Renders and writes a variable node as a property to the output.
	 *
	 * @param {VariableNode} propertyNode Variable node to write out
	 * @param {Number} nestingLevel Current nesting level for indentation
	 */
	writePropertyNode(propertyNode, nestingLevel) {
		this.output += this.generateJsDoc(propertyNode, nestingLevel);
		this.output += `${this.indent(nestingLevel)}${propertyNode.isConstant ? 'readonly ' : ''}${propertyNode.name}${propertyNode.optional ? '?' : ''}: ${this.normalizeType(propertyNode.type)};\n\n`;
	}

	/**
	 * Renders and writes a function node to the output.
	 *
	 * @param {FunctionNode} functionNode Function node to write out
	 * @param {Number} nestingLevel Current nesting level for indentation
	 */
	writeFunctionNode(functionNode, nestingLevel) {
		this.output += this.generateJsDoc(functionNode, nestingLevel);
		const parametersString = this.prepareParameters(functionNode.parameters);
		this.output += `${this.indent(nestingLevel)}function ${functionNode.name}(${parametersString}): ${this.normalizeType(functionNode.returnType)};\n\n`;
	}

	/**
	 * Renders and writes a function node as a method to the output.
	 *
	 * @param {FunctionNode} functionNode Function node to write out
	 * @param {Number} nestingLevel Current nesting level for indentation
	 */
	writeMethodNode(functionNode, nestingLevel) {
		this.output += this.generateJsDoc(functionNode, nestingLevel);
		const parametersString = this.prepareParameters(functionNode.parameters);
		this.output += `${this.indent(nestingLevel)}${functionNode.name}${functionNode.optional ? '?' : ''}(${parametersString}): ${this.normalizeType(functionNode.returnType)};\n\n`;
	}

	/**
	 * Generates the JSDoc comment for the given node.
	 *
	 * @param {Object} node The node to generte the comment for
	 * @param {Number} nestingLevel Current nesting level for indentation
	 * @return {Stirng} JSDoc comment
	 */
	generateJsDoc(node, nestingLevel) {
		let jsDoc = `${this.indent(nestingLevel)}/**\n`;
		let summary = node.summary.replace(/\s?\n/g, `\n${this.indent(nestingLevel)} * `);
		jsDoc += `${this.indent(nestingLevel)} * ${summary}\n`;
		jsDoc += `${this.indent(nestingLevel)} */\n`;
		if (node instanceof InterfaceNode && node.name === 'IOStream') {
			jsDoc += this.indent(nestingLevel) + '// tslint:disable-next-line:interface-name\n';
		}

		return jsDoc;
	}

	/**
	 * Creates a tab based indentation. The depth is based on the given nesting level.
	 *
	 * @param {Number} nestingLevel Nesting level inside the syntax tree
	 * @return {String} A string containing tabs equal the amount of the given nesting level
	 */
	indent(nestingLevel) {
		return ''.padStart(nestingLevel, '\t');
	}

	/**
	 * Normalizes a given type so it can be safely used in TypeScript.
	 *
	 * @param {Object} docType Type definition
	 * @param {String} usageHint A string with a hint where this type is used (null or 'parameter')
	 * @return {String} A normalized representation of the type for usage in TypeScript
	 */
	normalizeType(docType, usageHint) {
		if (!docType) {
			return 'any';
		}

		if (Array.isArray(docType)) {
			const normalizedTypes = docType.map(typeName => this.normalizeType(typeName));
			return normalizedTypes.indexOf('any') !== -1 ? 'any' : normalizedTypes.join(' | ');
		}
		const lessThanIndex = docType.indexOf('<');
		if (lessThanIndex !== -1) {
			const baseType = docType.slice(0, lessThanIndex);
			const greaterThanIndex = docType.lastIndexOf('>');
			const subType = docType.slice(lessThanIndex + 1, greaterThanIndex);
			const subTypes = subType.split(',').map(type => this.normalizeType(type.trim()));
			if (baseType === 'Array') {
				return subTypes.map(typeName => {
					if (usageHint === 'parameter') {
						return `ReadonlyArray<${typeName}>`;
					} else {
						return `${typeName}[]`;
					}
				}).join(' | ');
			} else if (baseType === 'Callback') {
				return `(${subTypes.map((type, index) => `param${index}: ${type}`).join(', ')}) => any`;
			} else if (baseType === 'Dictionary') {
				return 'any';
			}
		}

		switch (docType) {
			case 'Boolean':
			case 'Function':
			case 'Number':
			case 'String':
				return docType.toLowerCase();
			case 'Object':
				return 'any';
			case 'Callback': {
				return '() => any';
			}
			default: {
				let typeName = docType;
				if (typeName.indexOf('.') !== -1) {
					typeName = docType.substring(docType.lastIndexOf('.') + 1);
					if (invalidTypeMap[typeName]) {
						return docType.replace(typeName, invalidTypeMap[typeName]);
					}
				} else if (invalidTypeMap[typeName]) {
					return invalidTypeMap[typeName];
				}
				return docType;
			}
		}
	}

	/**
	 * Normalized a parameter definition.
	 *
	 * Currenlty only replaces a parameter's name from default to defaultValue
	 * since default is a reversed keyword in TypeScript.
	 *
	 * @param {Object} paramNode Parameter definition
	 */
	normalizeParameter(paramNode) {
		if (paramNode.name === 'default') {
			paramNode.name = 'defaultValue';
		}
	}

	/**
	 * Pepares a list of parameters by normalizing the parameter name and its type
	 * and concatenates each parameter to a comma separated list.
	 *
	 * @param {Array<Object>} parameters List of parameter definitions
	 * @return {String} Comma separated list of parameters, ready to be used between the braces of a function definition.
	 */
	prepareParameters(parameters) {
		return parameters.map(paramNode => this.prepareParameterString(paramNode)).join(', ');
	}

	/**
	 * Prepares a single parameter string of the given parameter definition.
	 *
	 * @param {Object} paramNode Parameter definition
	 * @return {String} Parameter string in the form: <name>[?]: [...]<type>
	 */
	prepareParameterString(paramNode) {
		this.normalizeParameter(paramNode);
		let parameter = paramNode.rest ? '...' + paramNode.name : paramNode.name;
		if (paramNode.optional) {
			parameter += '?';
		}
		parameter += `: ${this.normalizeType(paramNode.type, paramNode.rest ? null : 'parameter')}`;

		return parameter;
	}
}

/**
 * A node that represents a variable.
 *
 * Used for variables in namespaces and properties in interfaces.
 */
class VariableNode {
	constructor(variableDoc) {
		this.name = variableDoc.name;
		this.type = variableDoc.type;
		this.summary = variableDoc.summary ? variableDoc.summary.trim() : '';
		this.isConstant = variableDoc.permission === 'read-only';
		this.optional = variableDoc.optional;
		this.rest = variableDoc.rest || false;
	}
}

/**
 * A node that represents a function.
 *
 * Used for funtions in namespaces and methods in interfaces.
 */
class FunctionNode {
	constructor(functionDoc) {
		this.definition = functionDoc;
		this.name = functionDoc.name;
		if (functionDoc.returns) {
			if (Array.isArray(functionDoc.returns)) {
				this.returnType = functionDoc.returns.map(type =>  type.type);
			} else {
				this.returnType = functionDoc.returns.type;
			}
		} else {
			this.returnType = 'void';
		}
		this.parameters = [];
		this.parseParameters(functionDoc.parameters);
		this.summary = functionDoc.summary ? functionDoc.summary.trim() : '';
		this.optional = functionDoc.optional || false;
	}

	parseParameters(parameters) {
		if (!parameters) {
			return;
		}

		// Allow rest parameters on Ti.Filesystem.getFile
		if (this.definition.__inherits === 'Titanium.Filesystem' && this.definition.name === 'getFile') {
			this.parameters = [ new VariableNode({ name: 'paths', type: 'Array<string>', rest: true }) ];
			return;
		}

		let hasOptional = false;
		this.parameters = parameters.map(paramDoc => {
			if (!hasOptional && paramDoc.optional) {
				hasOptional = true;
			}

			if (hasOptional && !paramDoc.optional) {
				paramDoc.optional = true;
			}

			// Due to our "special" inheritance, we cannot use a View as a type, use any instead.
			// @todo Find a common "baseView" type?
			if (paramDoc.type === 'Titanium.UI.View') {
				paramDoc.type = 'any';
			} else if (paramDoc.type === 'Array<Titanium.UI.View>') {
				paramDoc.type = 'any[]';
			}

			return new VariableNode(paramDoc);
		});
	}
}

/**
 * Representation of a node in the AST that has memebers (used as a base for
 * namesapce and interface nodes).
 */
class MemberNode {
	constructor() {
		this.properties = [];
		this.methods = [];
	}

	parseProperties(properties) {
		if (!properties) {
			return;
		}

		properties = properties.filter(propertyDoc => {
			// Filter out unused animate property which collides with the animate method
			if (this.fullyQualifiedName === 'Titanium.Map.View' && propertyDoc.name === 'animate') {
				return false;
			}

			// Filter out the Android R accessor as it is represented by a namespace already
			if (this.fullyQualifiedName === 'Titanium.Android' && propertyDoc.name === 'R') {
				return false;
			}

			return !propertyDoc.__hide;
		});

		this.properties = properties.map(propertyDoc => {
			// Make all properties of global interfaces optional by default
			if (this.fullyQualifiedName.indexOf('.') === -1 && propertyDoc.optional === undefined) {
				propertyDoc.optional = true;
			}

			// Some iOS views do not have this property, so mark it as optional.
			if (this.fullyQualifiedName === 'Titanium.Proxy' && propertyDoc.name === 'lifecycleContainer') {
				propertyDoc.optional = true;
			}

			return new VariableNode(propertyDoc);
		});
	}

	parseMethods(methods) {
		if (!methods) {
			return;
		}

		let filteredMethods = [];
		methods.forEach(methodDoc => {
			if (methodDoc.__hide) {
				return;
			}

			// Filter out removed fieldCount method (@todo check against version in "removed" property)
			if (this.fullyQualifiedName === 'Titanium.Database.ResultSet' && methodDoc.name === 'fieldCount') {
				return;
			}

			// Filter out create functions for constant only proxies
			if (/^create/.test(methodDoc.name)) {
				const returnType  = methodDoc.returns;
				const returnTypeName = Array.isArray(returnType) ? returnType[0].type : returnType.type;
				const returnTypeDoc = parser.apis[returnTypeName];
				if (returnTypeDoc && isConstantsOnlyProxy(returnTypeDoc)) {
					return;
				}
			}

			// Generate overloads if required and add them instead of the original method
			const overloads = this.generateMethodOverloadsIfRequired(methodDoc);
			if (overloads.length > 0) {
				filteredMethods = filteredMethods.concat(overloads);
			} else {
				filteredMethods.push(methodDoc);
			}
		});

		this.methods = filteredMethods.map(methodDoc => {
			if (this.fullyQualifiedName === 'Titanium.Proxy' && /LifecycleContainer$/.test(methodDoc.name)) {
				methodDoc.optional = true;
			}

			return new FunctionNode(methodDoc);
		});
	}

	/**
	 * Generates overload method definitions for methods which have parameter
	 * definitions that are not compatible with union types.
	 *
	 * Currently only handles one case where a parameter can be passed as both a
	 * single value and as an array, e.g. Ti.UI.View, Array<Ti.UI.View>
	 *
	 * @param {Object} methodDoc Method defintions as parsed from YAML files
	 * @return {Array<Object>} List of overload method defintions
	 */
	generateMethodOverloadsIfRequired(methodDoc) {
		const parameters = methodDoc.parameters;
		if (!parameters) {
			return [];
		}

		const originalMethodDocJsonString = JSON.stringify(methodDoc);
		const dictionaryTypePattern = /Dictionary<.*>/;
		let methodOverloads = [];
		for (let i = 0; i < parameters.length; i++) {
			const parameter = parameters[i];
			if (!Array.isArray(parameter.type)) {
				continue;
			}

			let parameterOverloads = [];
			for (let type of parameter.type) {
				if (dictionaryTypePattern.test(type)) {
					const anyOverloadDoc = JSON.parse(originalMethodDocJsonString);
					anyOverloadDoc.parameters[i].type = 'any';
					parameterOverloads = [ anyOverloadDoc ];
					break;
				}

				const newOverloadDoc = JSON.parse(originalMethodDocJsonString);
				newOverloadDoc.parameters[i].type = type;
				parameterOverloads.push(newOverloadDoc);
			}

			methodOverloads = methodOverloads.concat(parameterOverloads);
		}

		return methodOverloads;
	}
}

/**
 * A namespace in typescript represents a module in our Titanium global
 */
class NamespaceNode extends MemberNode {
	constructor(moduleDoc) {
		super();

		this.fullyQualifiedName = moduleDoc.name;
		this.name = moduleDoc.name.substring(moduleDoc.name.lastIndexOf('.') + 1);
		this.summary = moduleDoc.summary.trim();

		this.parseProperties(moduleDoc.properties);
		this.parseMethods(moduleDoc.methods);

		this.interfaces = [];
		this.namespaces = [];
	}

	addNamespace(namespaceNode) {
		this.namespaces.push(namespaceNode);
	}

	addInterface(interfaceNode) {
		this.interfaces.push(interfaceNode);
	}
}

/**
 * A typescript interface represents a single proxy in our Titanium global
 */
class InterfaceNode extends MemberNode {
	constructor(typeDoc) {
		super();

		this.fullyQualifiedName = typeDoc.name;
		this.name = typeDoc.name.substring(typeDoc.name.lastIndexOf('.') + 1);
		if (invalidTypeMap[this.name]) {
			this.name = invalidTypeMap[this.name];
		}
		this.summary = typeDoc.summary.trim();

		if (canExtend(typeDoc, parser.proxyInterface)) {
			removeMembers(typeDoc, parser.proxyInterface);
			this.extends = 'Titanium.Proxy';
		}
		if (canExtend(typeDoc, parser.viewInterface)) {
			removeMembers(typeDoc, parser.viewInterface);
			this.extends = 'Titanium.UI.View';
		}

		this.parseProperties(typeDoc.properties);
		this.parseMethods(typeDoc.methods);
	}
}
