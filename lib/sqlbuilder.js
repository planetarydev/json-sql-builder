'use strict';

const _ 		= require('lodash');
const SQLQuery	= require('./sqlquery');
const pgFormat	= require('pg-format');

function loadLanguageModule(language){
	try {
		return require('./' + language);
	} catch(e) {
		return undefined;
	}
}

const loadHelpers = {
	ansi: loadLanguageModule('ansi'),
	mysql: loadLanguageModule('mysql'),
	postgreSQL: loadLanguageModule('postgreSQL'),
	sqlite: loadLanguageModule('sqlite')
};

/**
 * @before
 * # Build Queries
 *
 * With the NPM package `json-sql-builder` you can build each query you need to run on your database.
 *
 * <div class="sub-title">
 *      Detailed documentation of all available methods and options
 * </div>
 *
 * @namespace SQLBuilder
 * @summary Main Api to build queries.
 * @hide true
 */
class SQLBuilder {

	/**
	 * @summary Creates a new instance of the SQLBuilder.
	 *
	 * @param  {String} language
	 * Specifies the language. If theres was no parameter provided only the ANSI Standards will be loaded.
	 * - mysql
	 * - postgreSQL
	 *
	 * @return {SQLBuilder} New instance of the SQLBuilder
	 */
	constructor(language) {
		this.mainOperator = null;
		this.quoteChar = '`';
		this.wildcardChar = '%';
		this._syntax = {};
		this._helpers = {};
		// new helpers table since v2.0.0
		this._helpers2 = {};
		this._recursions = 0;
		this.supportedSQLDialects = {
			ansi: true,
			mysql: true,
			postgreSQL: true,
			oracle: true,
			mssql: true,
			sqlite: true,
			maria: true
		}

		this._initBuilder();

		this.sqlDialect = language;

		// always load ANSI SQL standards
		loadHelpers.ansi(this);

		// use a specific language or only standard?
		if (language){
			// check if the specific helper-module for the language is installed
			// if yes -> run it, otherwise error
			if (loadHelpers[language]) {
				loadHelpers[language](this);
			} else {
				throw new Error('Language extension \'' + language + '\' is not available.');
			}
		}
	}

	_initBuilder(){
		this.mainOperator = null;
		this._recursions = 0;
		this._sql = '';
		this._values = [];
		this._helperChain = [];
		this._logicalJoiner = [];
		this._stripMostOuterParentheses = true;
	}

	/**
	 * @summary Builds the given query and returns an new SQLQuery object.
	 * @memberof SQLBuilder
	 *
	 * @param  {Object} query			Specifies the JSON query-object.
	 * @param  {String} [identifier]	**Optional.** Specifies the identifier detected before.
	 * @param  {String} [syntax]		**Optional.** Specifies the Syntax that the SQLBuilder has to use for this query.
	 * @param  {String} [stripMostOuterParentheses]		**Optional.** Specifies whether the most outer parentheses should be stripped before final return or not. Default is **true**
	 * @param  {String} [joinWith]		**Optional.** Specifies the String to concat the results of each operator, helper after processing them. Default is ' '.
	 * @return {SQLQuery}
	 */
	build(query, identifier, syntax, stripMostOuterParentheses, joinWith){
		var result = '';

		// if the build was started more than once with different queries
		// we have to reset the _sql, _values and _helperChain
		if (this._recursions == 0) {
			this._initBuilder();
		}
		this._recursions++;

		// set the global - stripping outer parentheses
		if (typeof stripMostOuterParentheses !== typeof undefined) {
			this._stripMostOuterParentheses = stripMostOuterParentheses;
		}

		if (!joinWith) joinWith = ' ';

		// check if we have a syntax
		if (syntax){
			var items = syntax.match(/(<\$\w+>)|(\[\$\w+\])/g);
			items = items.map(function(item) {
				return {
					name: item.replace('[', '').replace(']', '').replace('<', '').replace('>', ''),
					required: item.startsWith('<'),
				};
			});

			// iterate like the specific syntax
			var syntaxResults;
			syntaxResults = items.map((helper) => {
				// check if the helper is registered and the query has this helper as property
				if (this._helpers[helper.name] && query[helper.name]) {
					return this.callHelper(helper.name, query[helper.name], query, identifier);
				} else if (helper.required && !query[helper.name]) {
					throw new Error('Required expression missing: ' + helper.name + '.');
				} else if (query[helper.name] && !this._helpers[helper.name]) {
					throw new Error('Unknown expression/operator detected: ' + helper.name + '.');
				} else {
					return '';
				}
			});

			// concat each valid result with a starting ' '
			_.forEach(syntaxResults, function(value){
				if (value && value.length > 0) {
					result += (result.length > 0 ? joinWith : '') + value;
				}
			});
		} else {
			var results = [];

			// there is no syntax, so we iterate each item as it is
			for (var key in query){
				// check if we know the helper -> each helper starts with $
				if (key.startsWith('$') && this._helpers[key]) {
					results.push(this.callHelper(key, query[key], query, identifier));
				} else {
					// there was no helper detected or the key did not startwith '$'
					// check if it didnt start with $, so we have an identifier as key
					if (!key.startsWith('$')) {
						// identifier detected -> example "first_name: 'John'" or "first_name:{$eq:'John'}"
						if (_.isPlainObject(query[key])){
							// "first_name:{$eq:'John'}"
							results.push(this.build(query[key], key));
						} else if (_.isString(query[key]) || _.isNumber(query[key]) || _.isBoolean(query[key])){
							// "first_name: 'John'"
							results.push(this.quote(key) + ' = ' + this.addValue(query[key]));
						} else {
							throw new Error('Unknown expression/operator detected: ' + key);
						}

					} else {
						// unknown helper
						throw new Error('Unknown expression/operator detected -> ' + key);
					}
				}
			}

			result = results.join(joinWith);
		}


		this._recursions--;

		if (this._recursions == 0) {
			if (this._stripMostOuterParentheses){
				// we are finished and remove the outer most parentheses
				var result = result.startsWith('(') && result.endsWith(')') ? result.substring(1, result.length - 1) : result;
			}
			this._sql = result;
			return {
				sql: result,
				values: this._values
			}//new SQLQuery(result, this._values);
		}

		return result;
	}

	/**
	 * @summary Quotes the given identifier with the quote-character defined for the specific SQL language dialect.
	 * @memberof SQLBuilder
	 *
	 * @after
	 * # Quote Identifiers
	 *
	 * If you are creating your own helpers and operators you have to quote the generated identifiers.
	 * For this you can use the standard method that will do the job for you.
	 *
	 * If you are passing only one identifier to the method you will receive the the identifier as quoted string.
	 * On passing two identifiers you will receive the quoted identifiers joined with a dot '.' like `table.column`.
	 *
	 * In exception to this a column-identifier with the value ` * ` or `ALL` will returned as unquoted string.
	 * Also all variable identifiers that starts with ` @ ` will be leave unquoted.
	 *
	 * @param  {String} column	Specifies the main identifier to quote. Normally it will be a column or an alias name.
	 * @param  {String} [table]	Optional. Specifies the table-identifier.
	 *
	 * @return {String} Quoted identifier like `table`.`column`
	 */
	quote(column, table){
		if (!_.isString(column)) {
			throw new Error('Using quoted identifiers - arguments provided must always be type of String, but got arg1="' + typeof column + '"')
		}
		if (table && !_.isString(table)) {
			throw new Error('Using quoted identifiers - arguments provided must always be type of String, but got arg2="' + typeof column + '"')
		}
		// do not quote identifiers starts with '@'
		// SELECT `first_name` INTO @firstname FROM `people`
		if (column.startsWith('@')){
			return column;
		}
		// maybe the column includes the table name or the column arg is tebl schema and table
		// like <table>.<column> or <schema>.<table>
		// so we have to replace the "." and quote it correctly before and after the quote
		column = column.split('.').join(this.quoteChar + '.' + this.quoteChar);

		if (table){
			return this.quoteChar + table + this.quoteChar + '.' + (column === '*' || column === 'ALL' ? column : this.quoteChar + column + this.quoteChar);
		} else {
			return (column === '*' || column === 'ALL' ? column : this.quoteChar + column + this.quoteChar);
		}
	}

	/**
	 * @summary Specifies the placeholder function for the ANSI SQL Standard. This function can be overwrite by any SQL dialect loaded on instancing the builder.
	 * @memberof SQLBuilder
	 *
	 * @return {String} placeholder
	 */
	placeholder(){
		return '?';
	}

	/**
	 * @summary Specifies the 'AS' clause for a table or column or expression.
	 * @memberof SQLBuilder
	 *
	 * @param  {String} [identifier]	Optional. Specifies the identifier.
	 * @return {String} ' AS <quoted-identifier>' or empty String '' depends on a valid identifier given by argument
	 */
	aliasIdent(identifier) {
		return (identifier ? ' AS ' + this.quote(identifier) : '');
	}

	/**
	 * @summary Adds the given value to the current value stack and returns the language specific placeholder as string.
	 * @memberof SQLBuilder
	 *
	 * @param {Primitive} val Specifies the value to add.
	 */
	addValue(val){
		// postgreSQL does not support parameterized values for create statements like CREATE TABLE
		if (this.sqlDialect == 'postgreSQL' && this.isCurrent('$create')) {
			if (_.isNumber(val)) {
				return val;
			} else if (_.isString(val)) {
				if (val.startsWith('~~')){
					return this.quote(val.substring(2));
				}
				return pgFormat('%L', val);
			} else if (_.isBoolean(val)) {
				return val ? 'TRUE' : 'FALSE';
			} else {
				return val;
			}
		}

		// check a shotcut for identifiers
		if (_.isString(val) && val.startsWith('~~')) {
			return this.quote(val.substring(2));
		}

		this._values.push(val);
		return this.placeholder();
	}

	/**
	 * @summary Calls the given Helper by name. The Helper will be executed in the context of the current SQLBuilder instance.
	 * @memberof SQLBuilder
	 *
	 * @param  {String} name       Specifies the name of the Helper / Operator.
	 * @param  {Object} query      Specifies the query-object that should be translated to sql by the specified Helper.
	 * @param  {Object} [outerQuery] Optional. Specifies the outer object from the given query.
	 * @param  {String} [identifier] Optional. Specifies the current available identifier.
	 *
	 * @return {String} Returns the translated SQL code from the given query.
	 */
	callHelper(name, query, outerQuery, identifier){
		this._helperChain.push(name);
		var result = this._helpers[name].fn.call(this, query, outerQuery, identifier);
		this._helperChain.pop();
		return result;
	}

	/**
	 * @summary Checks if the given Helper or Operator is on the current Path. If is currently in use the function returns true, otherwise false.
	 * @memberof SQLBuilder
	 *
	 * @param  {String} name Specifies the name of the Helper or Operator
	 * @return {Boolean}
	 */
	isCurrent(name) {
		for (var i=0, max=this._helperChain.length; i<max; i++){
			if (this._helperChain[i] == name) {
				return true;
			}
		}
		return false;
	}

	/**
	 * @after
	 *
	 * # Register a new Syntax
	 *
	 * If you are creating a new Helper, Operator for the SQLBuilder you may need a Syntax for the build-method.
	 *
	 * By using a pre-defined Syntax you achive that the build method will output the
	 * expected SQL code and detect optional and required helper/operators. On top of this the order of the
	 * object properties inside the query does not matter.
	 *
	 * ## Required helpers/operators
	 * To define a helper, operator as required you have to use pointed brackets ` < ... > `.
	 *
	 * ## Optional helpers/operators
	 * To define an optional helper, operator you have to use square brackets ` [ ... ] `.
	 *
	 * **Example `$select` - Syntax**
	 * ```javascript
	 * // ANSI-SELECT Statement Syntax
	 * sqlBuilder.registerSyntax('$select', `SELECT [$distinct] [$all]
	 * 											  <$columns>
	 * 											{ FROM [$table] | [$from] }
	 * 											{ WHERE [$where] }
	 * 											{ GROUP BY [$groupBy]
	 * 												{ HAVING [$having] }
 	 * 											}
	 * 											{ ORDER BY { [$sort] | [$orderBy] } }`);
	 *
	 * ```
	 * > **Remarks**
	 *
	 * > At this time only the optional and required helpers will be detected. Everything around this will be ignored.
	 * >
	 * > In a future version we will use the whole syntactical meanings including the key-words the curly brackets an so on.
	 * > So If you create a new Syntax please provide a Syntax with all the stuff seen above.
	 *
	 * @summary Register a new Syntax to use later on the build process.
	 * @memberof SQLBuilder
	 *
	 * @param  {String} name       Specifies the name of the Syntax.
	 * @param  {String} syntax     Specifies the Syntax. See the example below.
	 */
	registerSyntax(name, syntax){
		if (_.isString(syntax)) {
			// check if a syntax with this name already exists
			if (this._syntax[name]) {
				throw new Error('Can\'t register new Syntax \'' + name + '\'. A Syntax with this name already exists.');
			}
			this._syntax[name] = syntax;
		} else if (_.isPlainObject(syntax)) {
			this._registerHelperBySyntax(name, syntax);
		} else {
			throw new Error('Can\'t register new Syntax \'' + name + '\'. The Syntax must be described as String or Object. Please refer the docs.');
		}
	}

	_registerHelperBySyntax(name, helperDefinition) {
		this._helpers2[name] = helperDefinition;

		let checkQueryType = function(query, allowedTypes, eachItemOfParentType) {
			let validType;
			_.forEach(allowedTypes, (value, key) => {
				let validateType = 'is' + key.replace('Object', 'PlainObject');
				if (_[validateType](query)) validType = key;
			});

			if (!validType) {
				if (eachItemOfParentType){
					throw new Error('Using Helper ' + name + ' must be type of ' + eachItemOfParentType + '->' + Object.keys(allowedTypes).join(', ') + ' but got "' + typeof query + '" with value \'' + (_.isPlainObject(query) ? JSON.stringify(query):query) + '\'');
				} else {
					throw new Error('Using Helper ' + name + ' must be type of ' + Object.keys(allowedTypes).join(', '));
				}
			}
			return validType;
		}

		// Build the given query and return the result as object with all values
		//
		// Let's say we have a query: { $exression: '~~first_name', $delimiter: ', ' }
		// and a given syntax like: "string_agg(<$expression>, <$delimiter>) [AS <identifier>]"
		// The Result after the build has processed is:
		// {
		// 	$expression: '"first_name"',
		// 	$delimiter: '$1'
		// }
		//
		let _buildQuery = (query, registeredHelpers, identifier) => {
			var results = {};

			// check if we got an helper, that is not registered
			// we have to report this as Error
			_.forEach(query, (value, name) => {
				// no identifiers allowed on query
				if (!name.startsWith('$')) {
					throw new Error ('Execute Query ' + JSON.stringify(query) + ' Identifier with Name "' + name + '" detected. Please check your query.');
				}

				if (!registeredHelpers[name]){
					throw new Error ('Execute Query ' + JSON.stringify(query) + ' the Helper with the Name "' + name + '" is not permitted by Syntax.');
				}
			});

			_.forEach(registeredHelpers, (queryOrValue, helperOrIdentifier) => {
				// $select: {...} => $select operator/helper
				// my_column: { ... } => Identifier
				let isIdentifier = !helperOrIdentifier.startsWith('$');

				if (!isIdentifier) {
					// check if helper is available on query
					if (!query[helperOrIdentifier]) return;

					// check if the helper is available in the registeredHelpers
					if (registeredHelpers[helperOrIdentifier]) {
						// okay, the helper exists and we can execute him
						results[helperOrIdentifier] = this.callHelper(helperOrIdentifier, query[helperOrIdentifier], query /*outer Query*/);
					} else {
						// helper does not exists in the registered Helpers
						// given from the syntax declaration
						throw new Error ('Execute Query ' + JSON.stringify(query) + ' the helper or operator with the Name "' + helperOrIdentifier + '" is not permitted by Syntax.');
					}
				} else {
					// Identifier!
					// so we have to execute the inner query of the identifier and pass
					// the identifier to the next level
					//this.build(queryOrValue, helperOrIdentifier);
				}
			});

			/*_.forEach(query, (queryOrValue, helperOrIdentifier) => {
				// $select: {...} => $select operator/helper
				// my_column: { ... } => Identifier
				let isIdentifier = !helperOrIdentifier.startsWith('$');

				if (!isIdentifier) {
					// check if the helper is available in the registeredHelpers
					if (registeredHelpers[helperOrIdentifier]) {
						// okay, the helper exists and we can execute him
						results[helperOrIdentifier] = this.callHelper(helperOrIdentifier, queryOrValue, query);
					} else {
						// helper does not exists in the registered Helpers
						// given from the syntax declaration
						throw new Error ('Execute Query ' + JSON.stringify(query) + ' the helper or operator with the Name "' + helperOrIdentifier + '" is not permitted by Syntax.');
					}
				} else {
					// Identifier!
					// so we have to execute the inner query of the identifier and pass
					// the identifier to the next level
					this.build(queryOrValue, helperOrIdentifier);
				}
			});*/

			return results;
		}

		let _getHelperName = function(helper) {
			return (
				helper.replace('[', '')
					.replace(']', '')
					.replace('<', '')
					.replace('>', '')
					.replace('[ ', '')
					.replace(' ]', '')
					.replace('< ', '')
					.replace(' >', '')
			);
		};

		let _getHelperNameByToken = function(token, registeredHelpers) {
			var map = Object.keys(registeredHelpers);
			for (var i=0, max=map.length; i<max; i++) {
				if (registeredHelpers[map[i]].token == token){
					return map[i];
				}
			}
		}

		let _removeHelperByToken = function(token, registeredHelpers) {
			var map = Object.keys(registeredHelpers);
			for (var i=0, max=map.length; i<max; i++) {
				if (registeredHelpers[map[i]].token == token){
					delete registeredHelpers[map[i]];
				}
			}
		}

		let _isHelperRequired = function (helper) {
			return helper.startsWith('<');
		}

		// translate the given syntax and return a
		// translated object with a cleaned up Syntax
		// and all registered helpers and operators
		let _translate = (syntax) => {
			// prepare the result for each type defined
			let uniqueHelperID = 0;
			let results = {
				cleanedSyntax: '',
				registeredHelpers: {},
				joinedWith: null
			};

			// first of all get a possible joiner
			// the notation of this is [ <joiner>... ]
			let joiner = syntax.match(/\[ (.*)\.\.\.\ \]/g);
			results.joinedWith = joiner && joiner.length > 0 ? joiner[0].substring(2, joiner[0].length - 5) : null;
			if (results.joinedWith) {
				// remove the joiner
				syntax = syntax.replace(/\[ (.*)\.\.\.\ \]/g, '');
			}

			// get all required and optional helpers and operators
			// defined by "<...>" and "[...]"
			var helpers = syntax.match(/(<\$\w+>)|(\[\$\w+\])/g);
			_.forEach(helpers, function(helper){
				let helperName = _getHelperName(helper);
				if (!results.registeredHelpers[helperName]) {
					let uid = ++uniqueHelperID;
					results.registeredHelpers[helperName] = {
						id: uid,
						// a unique token as replacement for the current helper
						// so later it will be easier to remove all remaining
						// white-spaces between the helpers
						token: '>->->' + uid + '<-<-<',
						definition: helper, // store original helper definition for a later replacement
						required: _isHelperRequired(helper),
						supportedBy: {
							// list of all rdbms that support the current helper
						}
					}
				}

				// replace the original helper defined with a unique ID by it's token
				syntax = syntax.replace(helper, results.registeredHelpers[helperName].token);
			});

			// cleanup of all tabs, newlines and carrige return's
			syntax = syntax.replace(/(\t|\n|\r)/g, '');

			// remove all white-spaces between the tokens
			syntax = syntax.replace(/<-<-<\s+>->->/g, '<-<-<>->->');

			// remove every "or" defined with "|" between two tokens
			// example: { ORDER BY [$sort] | [$orderBy] }
			syntax = syntax.replace(/<-<-< \| >->->/g, '<-<-<>->->');

			// get all items located in curly braces like "{ FROM >->->1<-<-< }"
			// and register the subsyntax
			var curlyItems = syntax.match(/\{([^}]+)\}/g);
			_.forEach(curlyItems, function(curlyItem) {
				// get all optional and required operators and helpers
				var tokens = curlyItem.match(/(>->->[0-9]+<-<-<)/g);
				_.forEach(tokens, function(token) {
					let name = _getHelperNameByToken(token, results.registeredHelpers);

					// ignore sub-syntax for {* ... *}
					// example: {* INNER | LEFT OUTER | RIGHT OUTER JOIN [$joins] *}
					// This is only for a better understanding of the total syntax,
					// but the INNER JOIN, etc. will defined in the helper '$innerJoin'
					if (! (curlyItem.startsWith('{*') && curlyItem.endsWith('*}'))) {
						results.registeredHelpers[name].subSyntax = curlyItem.substring(1, curlyItem.length - 1); // remove outer curly braces
					}

					// replace the curly braces optional helper with the
					// 'real'Helper to get a very clean syntax
					// curlyItem = "{ FROM [ $from ] }"
					// item = "[ $ from ]"
					syntax = syntax.split(curlyItem).join(token);
				});
			});

			// Example-Syntax after main cleanup:
			// SELECT >->->1<-<-<-->(mssql) >->->2<-<-< >->->3<-<-<-->(mysql) >->->4<-<-<>->->5<-<-<>->->6<-<-<>->->7<-<-<>->->8<-<-<>->->9<-<-<>->->10<-<-<>->->11<-<-<>->->13<-<-<-->(mysql,postsgreSQL)>->->14<-<-<-->(mysql,postsgreSQL
			// Now check for language specific helpers and operaotrs
			// and remove them if they are not equal to the current
			// sql dialect
			var dialectHelpers = syntax.match(/(>->->[0-9]+<-<-<)-->\([\w,]+\)/g)
			_.forEach(dialectHelpers, (helper) => {
				let token = helper.substring(0, helper.indexOf('-->('));

				if (helper.indexOf(this.sqlDialect) == -1) {
					_removeHelperByToken(token, results.registeredHelpers);
					syntax = syntax.replace(helper, '');
				} else {
					// remove the dialect-info "-->(mysql,postgreSQL)"
					let dialectInfo =  helper.substring(helper.indexOf('-->('), helper.length);
					syntax = syntax.replace(dialectInfo, '');
				}
			});

			// remove every "or" defined with "|" between two tokens
			// example: { ORDER BY [$sort] | [$orderBy] }
			syntax = syntax.replace(/<-<-< \| >->->/g, '<-<-<>->->');

			// remove all white-spaces between the tokens
			syntax = syntax.replace(/<-<-<\s+>->->/g, '<-<-<>->->');
			// remove all white-spaces if there are more then one
			// and replace with ' '
			syntax = syntax.replace(/\s+/g, ' ');

			results.cleanedSyntax = syntax;
			return results;
		}

		/* translate the given syntax in a more clean way like the example:
		 * syntax: {
 			allowedTypes: {
 	 			Object: `SELECT [$distinct] [$all] <$columns>
 							{ FROM [$from] }
 							{* INNER | LEFT OUTER | RIGHT OUTER JOIN [$joins] *}
 							{ WHERE [$where] }
 							{ GROUP BY [$groupBy] }
 							{ HAVING [$having] }
 							{ ORDER BY [$sort] | [$orderBy] }`,
 			},
 			translated: {
 				Object: {
 					cleanedSyntax: 'SELECT [$distinct] [$all] <$columns> [$from] [$joins] [$where] [$groupBy] [$having] [$sort] [$orderBy]'
 					registeredHelpers: {
 						$distinct: { id: 1, token: '>->->1<-<-<', required: false },
 						$all: { id: 2, token: '>->->2<-<-<', required: false },
 						$columns: { id: 3, token: '>->->3<-<-<', required: true },
 						$from: { id: 4, token: '>->->4<-<-<', required: false, subSyntax: 'FROM [$from]'},
 						$joins: { id: 5, token: '>->->5<-<-<', required: false },
 						$where: { id: 6, token: '>->->6<-<-<', required: false, subSyntax: 'WHERE >->->6<-<-<'},
 						$sort: { id: 7, token: '>->->7<-<-<', required: false, subSyntax: 'GROUP BY >->->7<-<-<>->->8<-<-<'}
						$groupBy: { id: 8, token: '>->->8<-<-<', required: false, subSyntax: 'GROUP BY >->->7<-<-<>->->8<-<-<'}
 					}
 				}
 			},
 			belongsTo: {
 				Any: true
 			},
 			dependsOn: null
  		},*/
		let _translateSyntax = (definition) => {
			let results = {};

			_.forEach(definition.allowedTypes, (typeDef, type) => {
				if (!typeDef.syntax && typeDef.eachItemOf) {
					// we have an Object or Array type with a
					// objected syntax-declaration like:
					//
					// sqlBuilder.registerSyntax('$from', {
					/*		description: 'Specifies the `FROM` clause for the `SELECT` Statement.',
							supportedBy: {
								mysql: 'https://dev.mysql.com/doc/refman/5.7/en/select.html',
								postgreSQL: 'https://www.postgresql.org/docs/9.5/static/sql-select.html'
							},
							definition: {
								allowedTypes: {
					------>			Object: {
										eachItemOf: {
											Boolean: {
												syntax: {
													true: '<key-ident> [ , ... ]',
													false: ''
												}
											},
											String: { syntax: { '<value> AS <key>' [, ...] } },
											Object: { syntax: { '<value> AS <key>' [, ...] } },
										}
									},
									String: '<value>',
								},
								belongsTo: {
									$select: true
								},
								dependsOn: {
									$select: true
								}
					 		},
					*/
					_.forEach(typeDef.eachItemOf, (typeDef, itemType) => {
						// inject the translated SyntaxObject to the type-definition for String, Number, Object
						// For type Boolean we have the possibility to define a syntax object with two
						// different syntax-style depend on the bool value true or false
						if (_.isPlainObject(typeDef.syntax)) {
							// syntax is an Object, so we have a value-based Syntax like:
							/*			allowedTypes: {
								 			Object: {
												eachItemOf: {
													Boolean: {
														syntax: {
															true: '<key-ident>[ , ... ]',
															false: ''
														}
													},
							*/
							// so iterate each value and translate it's syntax
							definition.allowedTypes[type].eachItemOf[itemType].translated = {};
							_.forEach(typeDef.syntax, (valueBasedSyntax, key)=>{
								definition.allowedTypes[type].eachItemOf[itemType].translated[key] = _translate(valueBasedSyntax);
							});
						} else {
							// we have subItem-based Type-Syntax like:
							/*	allowedTypes: {
						 			Object: {
										eachItemOf: {
											String: { syntax: '<key-ident> AS <value-ident>[ , ... ]' },
											Object: { syntax: '<value> AS <key-ident>[ , ... ]' },
										},
							*/
							definition.allowedTypes[type].eachItemOf[itemType].translated = _translate(typeDef.syntax);
						}
					});
				} else {
					// we have a simple Type-Based syntax like:
					/*	definition: {
							allowedTypes: {
					 			Object: {
									syntax: `SELECT [$distinct] [$all] <$columns>
												{ FROM [$from]}
												{* INNER | LEFT OUTER | RIGHT OUTER JOIN [$joins] *}
												{ WHERE [$where] }
												{ GROUP BY [$groupBy] }
												{ HAVING [$having] }
												{ ORDER BY [$sort] | [$orderBy] }`
								},
								String: {
									syntax: {
										ALL: 'my value-based syntax '
									}
								}
							}
					*/
					// check for a value-based Syntax
					if (_.isPlainObject(definition.allowedTypes[type].syntax)) {
						// so iterate each value and translate it's syntax
						definition.allowedTypes[type].translated = {};
						_.forEach(definition.allowedTypes[type].syntax, (valueBasedSyntax, key)=>{
							definition.allowedTypes[type].translated[key] = _translate(valueBasedSyntax);
						});
					} else {
						// inject the translated SyntaxObject to the type-definition
						definition.allowedTypes[type].translated = _translate(typeDef.syntax);
					}
				}
			});

			return results;
		}

		let _aliasIdent = (identifier) => {
			return (identifier ? 'AS ' + this.quote(identifier) : '');
		}

		/**** Internal
		 * Replacing the rplv's (replacment-values) in the
		 * given Syntax string with real values
		 *
		 * Pass the rplv as Object like:
		 * {
		 * 		key: "any key value"  	// means the key or property of an object
		 * 		value: "any value"		// Specifies the value of any Primitiv or the value of and object with it's vaue as primitiv
		 * 		identifier: "string"	// Specifies a detected ientifier from the previous build-process
		 * 		result: "string"		// Specifies the SQL-result of the build-process
		 * }
		 *
		 * @param syntax 		{String} 	Specifies the Syntax a string to replace wit current values
		 * @param rplv 			{Object} 	Specifies the values to use on replace
		 * @param [rplv.key]	{Primitiv}	Value to replace on <key>, <key-param> or <key-ident>
		 * @param [rplv.value]	{Primitiv}	Value to replace on <value>, <value-param> or <value-ident>
		 * @param [rplv.identifier]	{String}	Value to replace on <identifier>
		 * @param [rplv.result]	{String}	Value to replace on <result> given from the internal build-process
		 *
		 * @return {String} replaced Syntax-String
		 */
		let _replaceSyntaxWithValues = (syntax, rplv) => {
			if (rplv.key) {
				if (syntax.indexOf('<key>') > -1) {
					syntax = syntax.replace('<key>', rplv.key);
				}
				if (syntax.indexOf('<key-param>') > -1) {
					syntax = syntax.replace('<key-param>', this.addValue(rplv.key));
				}
				if (syntax.indexOf('<key-ident>') > -1) {
					syntax = syntax.replace('<key-ident>', this.quote(rplv.key));
				}
			}

			if (rplv.value) {
				if (syntax.indexOf('<value>') > -1) {
					syntax = syntax.replace('<value>', rplv.value);
				}
				if (syntax.indexOf('<value-param>') > -1) {
					syntax = syntax.replace('<value-param>', this.addValue(rplv.value));
				}
				if (syntax.indexOf('<value-ident>') > -1){
					syntax = syntax.replace('<value-ident>', this.quote(rplv.value));
				}
			}

			if (rplv.identifier){
				if (syntax.indexOf('<identifier>') > -1){
					syntax = syntax.replace('<identifier>', this.quote(rplv.identifier));
				}
			}
			return syntax;
		}

		// calling the linkerHook to change the query or make magic things
		// The Linker will call the nested operators linkerHook before
		// the current query will be performed, against the the beforeExecute hook
		// that will be called for the current query.
		// the changed query will be returned as deep-clone
		let _linker = (query, outerQuery) => {
			let _query = _.cloneDeep(query);

			if (_.isPlainObject(_query)){
				// checking each helper, operator in this query
				// if there is a linkHoo defined for and call it
				// to give a chance to change the query before anything
				// will do with it
				_.forEach(_query, (value, helperName) => {
					if (helperName.startsWith('$') && this._helpers2[helperName]) {
						let hooks = this._helpers2[helperName].hooks;
						if (hooks && _.isFunction(hooks.link)) {
							hooks.link.call(this, _query, outerQuery);
						}
					}
				});
			}
			return _query;
		}

		let _helper = (query, outerQuery, identifier) => {
			query = _linker(query, outerQuery);

			// checking allowed query-types
			// and throw an Error if we got another type as allowed by helperDefinition
			var queryType = checkQueryType(query, helperDefinition.definition.allowedTypes),
				currentAllowedType = helperDefinition.definition.allowedTypes[queryType],
				currentSyntax = currentAllowedType.translated && currentAllowedType.translated.cleanedSyntax,
				joinedWith = currentAllowedType.translated && currentAllowedType.translated.joinedWith;

			// check for a value-based-syntax for "normal" use of Types
			// that means not ! eachItemOf-Type-declaration
			if (_.isPlainObject(helperDefinition.definition.allowedTypes[queryType].syntax)) {
				// it's a value based syntax
				// just overwrite the syntax with the value-based
				currentSyntax = currentAllowedType.translated[query] && currentAllowedType.translated[query].cleanedSyntax;
			}

			// check for before-hook and call if available
			if (helperDefinition.hooks && _.isFunction(helperDefinition.hooks.beforeExecute)){
				query = helperDefinition.hooks.beforeExecute.call(this, query, {
					queryType: queryType,
					sqlDialect: this.sqlDialect,
					outerQuery: outerQuery,
					identifier: identifier
				});
			}

			// execute the syntax of the given type
			switch (queryType) {
				case 'Number':
				case 'Boolean':
				case 'String':
					currentSyntax = _replaceSyntaxWithValues(currentSyntax, {
						value: query
					});
					break;

				case 'Object':
				case 'Array':
					// check if we got a valid syntax or
					// if there is a definition for eachItemOf
					if (!currentSyntax) {
						if (!currentAllowedType.eachItemOf) {
							throw new Error ('Execute query: ' + JSON.stringify(query) + ' There is no "syntax" property nor "eachItemOf" to work with.')
						}

						let resultsOnIterate = '';

						// okay we have to iterate as told by property eachItemOf
						_.forEach(query, (value, key) => {
							let itemType = checkQueryType(value, currentAllowedType.eachItemOf, queryType);
							let translated = currentAllowedType.eachItemOf[itemType].translated;
							let iteratingSyntax,
								joinedWith;

							// check for cleanedSyntax to decide if we have a eachItemOf Type-base Syntax
							// or we have a value base Syntax
							if (!translated.cleanedSyntax) {
								// we have a value-based Syntax --> get the current value and
								// let's hope we have a syntax for that value
								if (!translated[value]) {
									throw new Error (`The value '${value}' using Type '${queryType}->${itemType}' on Helper or Operator '${name}' is not allowed. Possible values are '${Object.keys(translated)}'.`);
								}

								iteratingSyntax = translated[value].cleanedSyntax;
								joinedWith = translated[value].joinedWith || '';
							} else {
								iteratingSyntax = translated.cleanedSyntax;
								joinedWith = translated.joinedWith || '';
							}

							if (itemType == 'Boolean' || itemType == 'String' || itemType == 'Number') {
								resultsOnIterate += (resultsOnIterate == '' ? '' : joinedWith);
								resultsOnIterate += _replaceSyntaxWithValues(iteratingSyntax, {
									key: key,
									value: value
								});
							} else if (itemType == 'Function') {
								let functionResult = value.call(this);
								resultsOnIterate += (resultsOnIterate == '' ? '' : joinedWith);
								resultsOnIterate += _replaceSyntaxWithValues(iteratingSyntax, {
									key: key,
									value: functionResult
								});
							} else if (itemType == 'Object') {
								if (Object.keys(translated.registeredHelpers).length == 0) {
									// okay, here we've got an Object from it's parent -> Object or Array
									// which has no Syntax-helpers like $select or $distinct...
									// it's a plain syntax with <value> <key-ident>[ , ... ]
									// so we iterate the object and see what comes next :-)
									// it can be anything! maybe { first_name: { $gt: 18 } }
									let buildUnknown = (query, joinedWith) => {
										let results = [];
										_.forEach(query, (innerQuery, key) => {
											// check if we have an identifier or operator/helper
											if (key.startsWith('$')) {
												// key is an helper/operater
												// callHelper(name, query, outerQuery, identifier){
												let result = this.callHelper(/*name*/key, /*query*/innerQuery, /*outerquery*/query /*, identifier*/);
												results.push(result);
											} else {
												// key is an identifier
												// if the value of the identifier is a primitiv (String, Number, Boolean)
												// then we are using temp $eq
												if (_.isString(innerQuery) || _.isNumber(innerQuery) || _.isBoolean(innerQuery)) {
													results.push(this.quote(key) + ' = ' + this.addValue(innerQuery));
												} else if (_.isPlainObject(innerQuery)) {
													let bu = buildUnknown(innerQuery, '++');
													results.push(this.quote(key) + ' ' + bu);
												} else if (_.isArray(query)) {
													throw new Error('Type Array inside unknown query detected!');
												} else {
													throw new Error('Unknown Type inside unknown query detected!');
												}
											}
										});
										return results.join(joinedWith);
									}
									// after getting the results, just put them
									// into the syntax-template for iterating
									let retval = buildUnknown(value, joinedWith);
									resultsOnIterate += (resultsOnIterate == '' ? '' : joinedWith);
									resultsOnIterate += _replaceSyntaxWithValues(iteratingSyntax, {
										key: key,
										value: retval
									});

									/*let buildResult = this.build(value, key);
									resultsOnIterate += (resultsOnIterate == '' ? '' : joinedWith);
									resultsOnIterate += _replaceSyntaxWithValues(iteratingSyntax, {
										key: key,
										value: buildResult
									});*/
								} else {
									let buildResult = _buildQuery(value, translated.registeredHelpers, iteratingSyntax.indexOf('[AS <identifier>]') > -1 ? undefined:identifier);
									// after building each part of the query, we have
									// to replace the placeholders in the syntax with the
									// current result of the buildQuery func
									_.forEach(buildResult, (result, helperName) => {
										let helper = translated.registeredHelpers[helperName];
										// do we have a subSyntax declared in curly braces?
										if (helper.subSyntax) {
											let rplSubSyntax = helper.subSyntax.replace(helper.token, result);
											currentSyntax = currentSyntax.replace(helper.token, rplSubSyntax);
										} else {
											currentSyntax = currentSyntax.replace(helper.token, result)
										}
									});
									resultsOnIterate += (resultsOnIterate == '' ? '':translated.joinedWith) +
										iteratingSyntax.replace('<value>', this.addValue(value));
								}
							} else if (itemType == 'Array') {
								throw new Error(`Type Array is not supported for ${queryType}.eachItemOf`);
							} else {
								throw new Error(`Unknown itemType '${itemType}' on iterating current Object using Object.eachItemOf`);
							}
						});

						currentSyntax = resultsOnIterate;

					} else {
						if (queryType == 'Object') {
							// no iteration, just build and see what's happening :-)

							if (Object.keys(currentAllowedType.translated.registeredHelpers).length == 0) {
								let buildResult = this.build(query/*value*/);
								currentSyntax = _replaceSyntaxWithValues(currentSyntax, {
									value: buildResult
								});
							} else {
								let buildResult = _buildQuery(query, currentAllowedType.translated.registeredHelpers, currentSyntax.indexOf('[AS <identifier>]') > -1 ? undefined:identifier);

								// after building each part of the query, we have
								// to replace the placeholders in the syntax with the
								// current result of the buildQuery func
								_.forEach(buildResult, (result, helperName) => {
									let helper = currentAllowedType.translated.registeredHelpers[helperName];
									// do we have a subSyntax declared in curly braces?
									if (helper.subSyntax) {
										let rplSubSyntax = helper.subSyntax.replace(helper.token, result);
										currentSyntax = currentSyntax.replace(helper.token, rplSubSyntax);
									} else {
										currentSyntax = currentSyntax.replace(helper.token, result)
									}
								});
							}
						} else if (queryType == 'Array') {
							let resultsOnIterate = '';
							let iteratingSyntax = currentSyntax;
							_.forEach(query, (value, key) => {
								resultsOnIterate += (resultsOnIterate == '' ? '' : joinedWith);
								resultsOnIterate += _replaceSyntaxWithValues(iteratingSyntax, {
									key: key,
									value: value
								});
							});

							currentSyntax = resultsOnIterate;
						}
					}
					break;

				default:
					throw new Error(`Unknown queryType '${queryType}' detected!`);
			}

			// replace all remaining helpers and operators with ''
			// because not all of the optional helpers may be used
			currentSyntax = currentSyntax.replace(/(>->->[0-9]+<-<-<)/g, '');

			// check for AS clause with identifier and replace it with the
			// identifier if there is some
			currentSyntax = currentSyntax.replace('[AS <identifier>]', _aliasIdent(identifier));

			if (helperDefinition.hooks && _.isFunction(helperDefinition.hooks.afterExecute)){
				currentSyntax = helperDefinition.hooks.afterExecute.call(this, currentSyntax);
			}
			return currentSyntax;
		};

		// check if all neccessary data is defined for this helper
		if (!_.isString(helperDefinition.description)) {
			throw new Error(`Register helper '${name}'. Please support a short description.`);
		}
		if (!_.isPlainObject(helperDefinition.supportedBy)) {
			throw new Error(`Register helper '${name}'. Make sure you have defined the "supportedBy" property as Object.`);
		}
		// check if supported sql-system is known by json-sql-builder
		_.forEach(helperDefinition.supportedBy, (officialDocs, sqlDialect) => {
			if (!(sqlDialect in this.supportedSQLDialects)) {
				throw new Error(`Register helper '${name}'. Please check the "supportedBy" property. The language dialect "${sqlDialect}" is currently unknown.`);
			}
			// check for current doc's
			if (!_.isString(officialDocs) || !officialDocs.startsWith('http')) {
				throw new Error(`Register helper '${name}'. Please make sure you have linked the official docs for this operator or helper.`);
			}
		});
		// check for syntax
		if (!_.isPlainObject(helperDefinition.definition) || !_.isPlainObject(helperDefinition.definition.allowedTypes)){
			throw new Error(`Register helper '${name}'. Please make sure you have a definition section for this operator or helper.`);
		}

		if (!_.isPlainObject(helperDefinition.examples)) {
			throw new Error(`Register helper '${name}'. Please provide tests and examples.`);
		}

		// checking valid, supported types
		var supportedTypes = ['Object', 'String', 'Number', 'Boolean', 'Array', 'Function'];
		_.forEach(helperDefinition.definition.allowedTypes, (typeDef, type)=>{
			if (supportedTypes.indexOf(type) == -1){
				throw new Error(`Register helper '${name}'. The Type "${type}" in definition.allowedTypes is currently not supported.`);
			}

			if (!_.isPlainObject(typeDef)) {
				throw new Error(`Register helper '${name}'. The allowedTypes defined for Type "${type}" must be an Object with { syntax: '...' | eachItemOf: { ... } }`);
			}

			if (typeDef.syntax && typeDef.eachItemOf) {
				throw new Error(`Register helper '${name}'. The allowedTypes defined for Type "${type}" can only defined with { syntax: '...' | eachItemOf: { ... } } but NOT both of them.`);
			}

			// checking eachItemOf declaration
			if (typeDef.eachItemOf) {
				// check tests and examples for each sub-type declaration
				_.forEach(typeDef.eachItemOf, (itemTypeDef, itemType) =>{
					if (supportedTypes.indexOf(itemType) == -1){
						throw new Error(`Register helper '${name}'. The Type "${itemType}" in definition.allowedTypes.${type}->eachItemOf is currently not supported.`);
					}

					if (itemTypeDef.syntax && !_.isString(itemTypeDef.syntax) && !_.isPlainObject(itemTypeDef.syntax)) {
						throw new Error(`Register helper '${name}'. The syntax defined for Type "${type}.eachItemOf.${itemType}" can either be a String or Object.`);
					}

					if (!_.isPlainObject(helperDefinition.examples[type])) {
						throw new Error(`Register helper '${name}'. Please provide Tests and Examples for Type "${type}.eachItemOf.${itemType}" in section examples.`);
					}
					if (!_.isPlainObject(helperDefinition.examples[type].eachItemOf)) {
						throw new Error(`Register helper '${name}'. Please provide Tests and Examples for Type "${type}.eachItemOf.${itemType}" in section examples.`);
					}
					if (!_.isPlainObject(helperDefinition.examples[type].eachItemOf[itemType])) {
						throw new Error(`Register helper '${name}'. Please provide Tests and Examples for Type "${type}.eachItemOf.${itemType}" in section examples.`);
					}
					if (_.isString(itemTypeDef.syntax)) {
						// checking tests and examples for each allowed type
						if (!_.isPlainObject(helperDefinition.examples[type].eachItemOf[itemType].basicUsage)) {
							throw new Error(`Register helper '${name}'. Please provide a basic Test and Example for Type "${type}.eachItemOf.${itemType}"`);
						}
						if (!_.isPlainObject(helperDefinition.examples[type].eachItemOf[itemType].basicUsage.test)
							|| !_.isPlainObject(helperDefinition.examples[type].eachItemOf[itemType].basicUsage.expectedResult)) {
							throw new Error(`Register helper '${name}'. The basic Test and Example fails on definition for Type "${type}.eachItemOf.${itemType}". Please make sure you provide "test" and "expectedResult" for property "basicUsage".`);
						}
					} else {
						// syntax as object like
						/*	definition: {
								allowedTypes: {
									Object: {
									eachItemOf: {
										Boolean: {
											syntax: {
												true: '<key-ident>[ , ... ]',
												false: ''
											}
										},
									}
								}
							}*/

						// sub-syntaxing only allowed for
						// Boolean, Number and String
						if (!(itemType == 'Boolean' || itemType == 'String' || itemType == 'Number')) {
							throw new Error(`Register helper '${name}'. The definition for Type "${type}.eachItemOf.${itemType}.syntax" fails. Sub-Syntaxing is only allowed for Type Boolean, String or Number.`);
						}

						// at least one item must be in there
						if (Object.keys(itemTypeDef.syntax).length == 0) {
							throw new Error(`Register helper '${name}'. The definition for Type "${type}.eachItemOf.${itemType}.syntax" is an empty Object. Please provide at least one Item with a String-value representing the Syntax.`);
						}

						// check that all items be type of string and include the current Syntax for the value (=key)
						// AND !!! each value must have it's own Test and Example
						_.forEach(itemTypeDef.syntax, (value, key)=>{
							// check that value is the syntax and for that it must be a string
							if (!_.isString(value)) {
								throw new Error(`Register helper '${name}'. The syntax defined for Type "${type}.eachItemOf.${itemType}.syntax->${key}" must be a string representing the Syntax for this value.`);
							}
							// check the key, that it's value expect the itemType, so if we have a Boolean it key's
							// can only be true or false. Or if we have a Number, the value ca only be a number-value
							if (itemType == 'Boolean' && !(key=='true' || 'false')) {
								throw new Error(`Register helper '${name}'. The value '${key}' given for Type "${type}.eachItemOf.${itemType}" is not allowed. Only 'true' or 'false' are valid.`);
							}

							if (itemType == 'Number' && isNaN(key)) {
								throw new Error(`Register helper '${name}'. The value '${key}' given for Type "${type}.eachItemOf.${itemType}" is not allowed. Only numeric values are allowed.`);
							}

							// check Tests
							if (!_.isPlainObject(helperDefinition.examples[type].eachItemOf[itemType][key])) {
								throw new Error(`Register helper '${name}'. Please provide Tests and Examples for Type "${type}.eachItemOf.${itemType}->${key}" in section examples.`);
							}
							if (!_.isPlainObject(helperDefinition.examples[type].eachItemOf[itemType][key].basicUsage)) {
								throw new Error(`Register helper '${name}'. Please provide a basic Test and Example for Type "${type}.eachItemOf.${itemType}->${key}"`);
							}
							if (!_.isPlainObject(helperDefinition.examples[type].eachItemOf[itemType][key].basicUsage.test) ||
								!_.isPlainObject(helperDefinition.examples[type].eachItemOf[itemType][key].basicUsage.expectedResult)) {
								throw new Error(`Register helper '${name}'. The basic Test and Example fails on definition for Type "${type}.eachItemOf.${itemType}->${key}". Please make sure you provide "test" and "expectedResult" for property "basicUsage".`);
							}
						});
					}
				});
			} // eachItemOf
			else {
				// checking tests and examples for each allowed type
				if (!_.isPlainObject(helperDefinition.examples[type])) {
					throw new Error(`Register helper '${name}'. Please provide Tests and Examples for Type "${type}" in section examples.`);
				}

				// check if we have a value-based syntax
				if (_.isPlainObject(helperDefinition.definition.allowedTypes[type].syntax)) {
					// okay, it's value-based
					// so iterate each value and check the examples for each value
					_.forEach(helperDefinition.definition.allowedTypes[type].syntax, (valueBasedSyntax, value) =>{
						if (!_.isPlainObject(helperDefinition.examples[type][value].basicUsage)) {
							throw new Error(`Register helper '${name}'. Please provide a basic Test and Example for Type "${type}" in section examples.${type}.basicUsage.`);
						}
						if (!_.isPlainObject(helperDefinition.examples[type][value].basicUsage.test) || !_.isPlainObject(helperDefinition.examples[type][value].basicUsage.expectedResult)) {
							throw new Error(`Register helper '${name}'. The basic Test and Example fails on definition for Type "${type}". Please make sure you have provide "test" and "expectedResult" for property "basicUsage".`);
						}
					})
				} else {
					if (!_.isPlainObject(helperDefinition.examples[type].basicUsage)) {
						throw new Error(`Register helper '${name}'. Please provide a basic Test and Example for Type "${type}" in section examples.${type}.basicUsage.`);
					}
					if (!_.isPlainObject(helperDefinition.examples[type].basicUsage.test) || !_.isPlainObject(helperDefinition.examples[type].basicUsage.expectedResult)) {
						throw new Error(`Register helper '${name}'. The basic Test and Example fails on definition for Type "${type}". Please make sure you have provide "test" and "expectedResult" for property "basicUsage".`);
					}
				}
			}
		});


		// registering the operator as function
		if (helperDefinition.definition.function && helperDefinition.definition.function.inline) {
			if (_.isFunction(helperDefinition.definition.function.inline)) {
				let funcName = name.replace('$', '');
				this[funcName] = helperDefinition.definition.function.inline;
			}
		} else {
			// TODO check allowedTypes for function: true

		}


		// after all checks are done, we have to translate the syntax
		// in a more clean way. For this we strip all tabs, linefeeds and returns.
		// In the second step we register all optional and required helpers and
		// keep track of the sub-syntax
		_translateSyntax(helperDefinition.definition);

		this.registerHelper(name, _helper);
	}

	/**
	 * @after
	 *
	 * # Update an existing Syntax
	 *
	 * If you extend an existing Helper - maybe the ` $select ` helper you have to update the existing Syntax.
	 * On the same way this module archives the different language dialects.
	 *
	 * **Example**
	 *
	 * The Example shows the update of the ANSI Select helper Syntax with the new one supported by the MySQL Select-Helper.
	 *
	 * ```javascript
	 * // overwrite the SYNTAX for the ANSI SELECT Statement
	 * sqlBuilder.updateSyntax('$select', `SELECT [$calcFoundRows] [$distinct] [$all]
	 * 											{ <$columns> [$into] }
	 * 											{ FROM [$table] | [$from] }
	 * 											{ WHERE [$where] }
	 * 											{ GROUP BY [$groupBy]
	 * 												{ WITH ROLLUP [$rollup] }
	 * 												{ HAVING [$having] }
 	 * 											}
	 * 											{ ORDER BY { [$sort] | [$orderBy] } }
	 * 											{ LIMIT [$limit] { OFFSET [$offset] } }`);
	 *
	 * ```
	 * As you can see to the example of the `registerSyntax` the MySQL Select - Syntax extends the ANSI Syntax with the following helpers/operators:
	 * - **[$calcFoundRows]** Helper for `SQL_CALC_FOUND_ROWS`
	 * - **[$into]** Helper for `SELECT ... INTO OUTFILE` or `SELECT ... INTO DUMPFILE`
	 * - **[$rollup]** Helper for `WITH ROLLUP` option after the `GROUP BY` clause
	 * - **[$limit]** and **[$offset]** Helper
	 *
	 * @summary Updates an existing Syntax to use later on the build process.
	 * @memberof SQLBuilder
	 *
	 * @param  {String} name		Specifies the name of the Syntax.
	 * @param  {String} newSyntax	Specifies the Syntax. See the example below.
	 */
	updateSyntax(name, newSyntax){
		// check if a syntaxt with this name already exists
		if (!this._syntax[name]) {
			throw new Error('Can\'t update Syntax \'' + name + '\'. A Syntax with this name does not exists.');
		}
		this._syntax[name] = newSyntax;
	}

	/**
	 * @summary Returns the given, existing Syntax. If the Syntax does not exists an error will be thrown.
	 * @memberof SQLBuilder
	 *
	 * @param  {String} name       Specifies the name of the Syntax.
	 *
	 * @return {String} Available Syntax-Definition
	 */
	getSyntax(name){
		// check if a syntaxt with this name already exists
		if (!this._syntax[name]) {
			throw new Error('A Syntax with name \'' + name + '\' does not exists.');
		}
		return this._syntax[name];
	}

	/**
	 * @after
	 *
	 * # Create a new Helper
	 *
	 * If you like to extend any language you have to register a new Helper.
	 *
	 * **Example**
	 *
	 * The Example shows the declaration of a new Helper for the `SELECT... INTO` clause by using the MySQL language dialect.
	 *
	 * ```javascript
// create a new Helper for the MySQL   INTO clause
sqlBuilder.registerHelper('$into', function(query, outerQuery, identifier){
	var result = '',
		results = [];

	// check the type of the query
	if (_.isArray(query)){
		// Array like example
		// $into: ['@firstname', '@lastname']
		_.forEach(query, (column) => {
			// check the type of the column definition, they must all of type String
			if (_.isString(column)){
				results.push(this.quote(column));
			} else {
				throw new Error('The items of the $into array must be type of string.');
			}
		});

		result = (results.length > 0 ? 'INTO ' + results.join(', ') : '');
	} else if (_.isPlainObject(query)) {
		// the query is an object like:
		// $into: {
		// 		$outfile: { $file: '/tmp/people.csv', $terminatedBy: ';' }
		// }
		// lets call the build-method, that will do the job!
		// --> the build-method will call the $outfile helper-function, $file-helper and $terminatedBy-helper
		result = 'INTO ' + this.build(query, null, this.getSyntax('$into'));
	} else {
		throw new Error('$columns must be either array of strings or objects.');
	}

	return result;

}, 'INTO [$outfile] [$dumpfile]'); // this is our Syntax
	 *
	 * ```
	 * > **Info**
	 * >
	 * > After registering the helper don't forget to update the corresponding Syntax and add the new helper.
	 * >
	 * > See [SQLBuilder#updateSyntax](#SQLBuilder-updateSyntax)
	 *
	 * @summary Registers a new helper, operator for the SQLBuilder.
	 * @memberof SQLBuilder
	 *
	 * @param  {String} 	name		Specifies the name of the Syntax.
	 * @param  {Function} 	callback	Specifies the callback-function, which is called each time the SQLBuilder detects the helper inside the query.
	 * @param  {String} 	[syntax]	**Optional**. Specifies the Syntax for this query helper. If a Syntax is provided it will be registered with the same name as the helper itself.
	 */
	registerHelper(name, callback, syntax){
		// check if a heler already exists
		if (this._helpers[name]){
			// in that case we copy the existing helper, because it's defined
			// by the ANSI standard and it's now extended by an language dialect
			// For Example check the $into used from the ANSI standard $insert: {$into: <table-identifier}
			// and extended by MySQL for $select: {$into: {$outfile: ...}}
			this._helpers['ansi->' + name] = _.clone(this._helpers[name]);
			// overwrite the helper with the new one
			this._helpers[name] = {
				name: name,
				fn: callback
			};
		}
		// add new helper
		this._helpers[name] = {
			name: name,
			fn: callback
		};

		if (syntax){
			this.registerSyntax(name, syntax);
		}
	}
}

module.exports = SQLBuilder;
