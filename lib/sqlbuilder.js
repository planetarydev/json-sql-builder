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

class _SQLBuilder {
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

	placeholder(){
		return '?';
	}

	addValue(val){
		this._values.push(val);
		return this.placeholder();
	}

	callHelper(name, query, outerQuery, identifier){
		this._helperChain.push(name);
		var result = this._helpers[name].fn.call(this, query, outerQuery, identifier);
		this._helperChain.pop();
		return result;
	}

	registerSyntax(name, syntax){
		// check if a syntaxt with this name already exists
		if (this._syntax[name]) {
			throw new Error('Can\'t register new Syntax \'' + name + '\'. A Syntax with this name already exists.');
		}
		this._syntax[name] = syntax;
	}

	updateSyntax(name, newSyntax){
		// check if a syntaxt with this name already exists
		if (!this._syntax[name]) {
			throw new Error('Can\'t update Syntax \'' + name + '\'. A Syntax with this name does not exists.');
		}
		this._syntax[name] = newSyntax;
	}

	getSyntax(name){
		// check if a syntaxt with this name already exists
		if (!this._syntax[name]) {
			throw new Error('A Syntax with named \'' + name + '\' does not exists.');
		}
		return this._syntax[name];
	}

	registerHelper(name, callback, syntax){
		// check if a heler allready exists
		if (this._helpers[name]){
			throw new Error('Can\'t register new helper \'' + name + '\'. A helper with this name already exists.');
		}
		// add new helper
		this._helpers[name] = {
			fn: callback,
			syntax: syntax
		};
	}
}

module.exports = _SQLBuilder;
