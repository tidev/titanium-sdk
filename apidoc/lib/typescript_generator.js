'use strict';

/*
 * Map of invalid types and their replacement
 */
const invalidTypeMap = {
	'2DMatrix': 'Matrix2D',
	'3DMatrix': 'Matrix3D',
	Dictionary: 'any'
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

class DocsParser {
	constructor(apis) {
		this.titaniumNamespace = null;
		this.proxyInterface = null;
		this.apis = apis;
		this.tree = new EmulatedSyntaxTree();
	}

	parse() {
		this.titaniumNamespace = new NamespaceNode(this.apis['Titanium']);
		this.tree.addNode(this.titaniumNamespace);
		delete this.apis['Titanium'];
		this.proxyInterface = new InterfaceNode(this.apis['Titanium.Proxy']);
		this.titaniumNamespace.addInterface(this.proxyInterface);
		delete this.apis['Titanium.Proxy'];

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

			const parentNamespace = this.findOrCreateParentNamespace(namespaceParts);
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

	findOrCreateParentNamespace(namespaceParts) {
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
			throw new Error(`Couldn't create parent namespace path up to ${parentNamespaceName}.`);
		}

		return parentNamespace;
	}

	/**
	 * Returns true if the given API should be rendered as an interface
	 *
	 * @param {Object} typeInfo API doc object
	 * @return {Boolean}
	 */
	isInterface(typeInfo) {
		const validSubtypes = [
			'proxy',
			'pseudo',
			'view'
		];
		// List of modules that need to be generated as an interface instead of a namespace
		const namespaceBlacklist = [
			'Titanium.App.iOS.UserDefaults',
		];

		return (validSubtypes.indexOf(typeInfo.__subtype) !== -1 && !isConstantsOnlyProxy(typeInfo))
			|| namespaceBlacklist.indexOf(typeInfo.name) !== -1;
	}

	isNamespace(typeInfo) {
		return typeInfo.__subtype === 'module' || isConstantsOnlyProxy(typeInfo);
	}
}

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

class GlobalTemplateWriter {
	constructor() {
		this.output = '';
	}

	generateTitaniumDefinition(tree) {
		this.writeHeader();
		this.writeTiShorthand();
		this.writeNodes(tree.nodes);
	}

	writeHeader() {
		this.output += '// Type definitions for Titanium 7.1\n';
		this.output += '// Project: https://github.com/appcelerator/titanium_mobile\n';
		this.output += '// Definitions by: Axway Appcelerator <https://github.com/appcelerator>\n';
		this.output += '// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped\n';
		this.output += '// TypeScript Version: 2.6\n';
		this.output += '\n';
	}

	writeTiShorthand() {
		this.output += 'declare const Ti: typeof Titanium;\n';
	}

	writeNodes(nodes) {
		for (const node of nodes) {
			if (node instanceof NamespaceNode) {
				this.writeNamespaceNode(node, 0);
			} else if (node instanceof InterfaceNode) {
				this.writeInterfaceNode(node, 0);
			}
		}
	}

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

	writeInterfaceNode(interfaceNode, nestingLevel) {
		this.output += this.generateJsDoc(interfaceNode, nestingLevel);
		this.output += `${this.indent(nestingLevel)}interface ${interfaceNode.name} {\n`;
		if (interfaceNode.properties.length > 0) {
			interfaceNode.properties.forEach(propertyNode => this.writePropertyNode(propertyNode, nestingLevel + 1));
		}
		if (interfaceNode.methods.length > 0) {
			interfaceNode.methods.forEach(methodNode => this.writeMethodNode(methodNode, nestingLevel + 1));
		}
		this.output += `${this.indent(nestingLevel)}}\n\n`;
	}

	writeVariableNode(variableNode, nestingLevel) {
		this.output += this.generateJsDoc(variableNode, nestingLevel);
		this.output += `${this.indent(nestingLevel)}${variableNode.isConstant ? 'const' : 'let'} ${variableNode.name}: ${this.normalizeType(variableNode.type)};\n\n`;
	}

	writePropertyNode(propertyNode, nestingLevel) {
		this.output += this.generateJsDoc(propertyNode, nestingLevel);
		this.output += `${this.indent(nestingLevel)}${propertyNode.isConstant ? 'readonly ' : ''}${propertyNode.name}${propertyNode.optional ? '?' : ''}: ${this.normalizeType(propertyNode.type)};\n\n`;
	}

	writeFunctionNode(functionNode, nestingLevel) {
		this.output += this.generateJsDoc(functionNode, nestingLevel);
		const parametersString = this.prepareParameters(functionNode.parameters);
		this.output += `${this.indent(nestingLevel)}function ${functionNode.name}(${parametersString}): ${this.normalizeType(functionNode.returnType)};\n\n`;
	}

	writeMethodNode(functionNode, nestingLevel) {
		this.output += this.generateJsDoc(functionNode, nestingLevel);
		const parametersString = this.prepareParameters(functionNode.parameters);
		this.output += `${this.indent(nestingLevel)}${functionNode.name}${functionNode.optional ? '?' : ''}(${parametersString}): ${this.normalizeType(functionNode.returnType)};\n\n`;
	}

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

	indent(nestingLevel) {
		return ''.padStart(nestingLevel, '\t');
	}

	normalizeType(docType) {
		if (!docType) {
			return 'any';
		}

		if (Array.isArray(docType)) {
			return docType.map(typeName => this.normalizeType(typeName)).join(' | ');
		}

		if (docType.indexOf('<') !== -1) {
			const typeRe = /(\w+)<([\w.,]+)>/;
			const matches = docType.match(typeRe);
			const baseType = matches[1];
			const subTypes = matches[2].split(',').map(type => this.normalizeType(type));
			if (baseType === 'Array') {
				return `${subTypes}[]`;
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

	normalizeParameter(paramNode) {
		if (paramNode.name === 'default') {
			paramNode.name = 'defaultValue';
		}
	}

	prepareParameters(parameters) {
		return parameters.map(paramNode => this.prepareParameterString(paramNode)).join(', ');
	}

	prepareParameterString(paramNode) {
		this.normalizeParameter(paramNode);
		let parameter = paramNode.name;
		if (paramNode.optional) {
			parameter += '?';
		}
		parameter += `: ${this.normalizeType(paramNode.type)}`;

		return parameter;
	}
}

class VariableNode {
	constructor(variableDoc) {
		this.name = variableDoc.name;
		this.type = variableDoc.type;
		this.summary = variableDoc.summary ? variableDoc.summary.trim() : '';
		this.isConstant = variableDoc.permission === 'read-only';
		this.optional = variableDoc.optional;
	}
}

class FunctionNode {
	constructor(functionDoc) {
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
		this.summary = functionDoc.summary.trim();
		this.optional = functionDoc.optional || false;
	}

	parseParameters(parameters) {
		if (!parameters) {
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

			return new VariableNode(paramDoc);
		});
	}
}

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
			if (this.fullyQualifiedName.indexOf('.') === -1 && propertyDoc.optional === undefined) {
				propertyDoc.optional = true;
			}
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

		methods = methods.filter(methodDoc => {
			// Filter out removed fieldCount method (@todo check against version in "removed" property)
			if (this.fullyQualifiedName === 'Titanium.Database.ResultSet' && methodDoc.name === 'fieldCount') {
				return false;
			}

			// Filter out create functions for constant only proxies
			if (/^create/.test(methodDoc.name)) {
				const returnType  = methodDoc.returns;
				const returnTypeName = Array.isArray(returnType) ? returnType[0].type : returnType.type;
				const returnTypeDoc = parser.apis[returnTypeName];
				if (!returnTypeDoc) {
					// if there is no doc info its probably a built-in type
					return true;
				}

				return !isConstantsOnlyProxy(returnTypeDoc);
			}

			return !methodDoc.__hide;
		});

		this.methods = methods.map(methodDoc => {
			if (this.fullyQualifiedName === 'Titanium.Proxy' && /LifecycleContainer$/.test(methodDoc.name)) {
				methodDoc.optional = true;
			}

			return new FunctionNode(methodDoc);
		});
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

		this.parseProperties(typeDoc.properties);
		this.parseMethods(typeDoc.methods);
	}
}
