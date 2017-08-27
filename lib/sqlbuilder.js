'use strict';

const _ 		= require('lodash');
const SQLQuery	= require('./sqlquery');

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
	postgreSQL: loadLanguageModule('postgreSQL')
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
		this.quoteChar = '`';
		this.wildcardChar = '%';
		this._syntax = {};
		this._helpers = {};
		this._recursions = 0;
		this._initBuilder();

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
		this._sql = '';
		this._values = [];
		this._helperChain = [];
		this._logicalJoiner = [];
	}

	/**
	 * @summary Builds the given query and returns an new SQLQuery object.
	 * @memberof SQLBuilder
	 *
	 * @param  {Object} query			Specifies the JSON query-object.
	 * @param  {String} [identifier]	Optional. Specifies the identifier detected before.
	 * @param  {String} [syntax]		Specifies the Syntax that the SQLBuilder has to use for this query.
	 *
	 * @return {SQLQuery}
	 */
	build(query, identifier, syntax){
		var result = '';

		// if the build was started more than once with different queries
		// we have to reset the _sql, _values and _helperChain
		if (this._recursions == 0) {
			this._initBuilder();
		}
		this._recursions++;

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
					result += (result.length > 0 ? ' ' : '') + value;
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
						} else if (_.isString(query[key])){
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

			result = results.join(' ');
		}

		this._recursions--;
		if (this._recursions == 0) {
			this._sql = result;
			// we are finished and remove the outer most parentheses
			var finalSql = result.startsWith('(') ? result.substring(1, result.length - 1) : result;
			return new SQLQuery(finalSql, this._values);
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
		// do not quote identifiers starts with '@'
		// SELECT `first_name` INTO @firstname FROM `people`
		if (column.startsWith('@')){
			return column;
		}

		if (table){
			return this.quoteChar + table + this.quoteChar + '.' + (column === '*' || column === 'ALL' ? column : this.quoteChar + column + this.quoteChar);
		} else {
			return (column === '*' || column === 'ALL' ? column : this.quoteChar + column + this.quoteChar);
		}
	}

	/**
	 * @summary Specifies the placeholder function for the ANSI SQL Standard. This function can be overwrite from any SQL dialect loaded on instancing the builder.
	 * @memberof SQLBuilder
	 *
	 * @return {String} placeholder
	 */
	placeholder(){
		return '?';
	}

	/**
	 * @summary Adds the given value to the current value stack and returns the language specific placeholder as string.
	 * @memberof SQLBuilder
	 *
	 * @param {Primitive} val Specifies the value to add.
	 */
	addValue(val){
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
		// check if a syntax with this name already exists
		if (this._syntax[name]) {
			throw new Error('Can\'t register new Syntax \'' + name + '\'. A Syntax with this name already exists.');
		}
		this._syntax[name] = syntax;
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
			throw new Error('A Syntax with named \'' + name + '\' does not exists.');
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
	 * > **Keep in mind!**
	 * >
	 * > After registering the helper you don't have to forget to update the `$select` Syntax and add the new helper.
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
		// check if a heler allready exists
		if (this._helpers[name]){
			throw new Error('Can\'t register new helper \'' + name + '\'. A helper with this name already exists.');
		}
		// add new helper
		this._helpers[name] = {
			fn: callback
		};

		if (syntax){
			this.registerSyntax(name, syntax);
		}
	}
}

module.exports = SQLBuilder;
