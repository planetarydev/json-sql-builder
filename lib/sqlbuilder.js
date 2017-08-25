'use strict';

const _ 		= require('lodash');
const SQLQuery	= require('./sqlquery');

function loadLanguageModule(language){
	try {
		return require('./sqlbuilder-' + language);
	} catch(e) {
		return undefined;
	}
}

const loadHelpers = {
	mysql: loadLanguageModule('mysql'),
	postgres: loadLanguageModule('postgres')
};

class _SQLBuilder {
	constructor(language) {
		this.quoteChar = '`';
		this._helpers = {};
		this._recursions = 0;
		this._initBuilder();

		// use a specific language or only standard?
		if (language){
			// check if the specific helper-module for the language is installed
			// if yes -> run it, otherwise error
			if (loadHelpers[language]) {
				loadHelpers[language](this);
			} else {
				throw new Error('Language extension is not installed. Make sure you have installed the language using "npm install sqlbuilder-' + language + '"');
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
			result += items.map((helper) => {
				// check if the helper is registered and if the query has this property
				if (this._helpers[helper.name] && query[helper.name]) {
					// TEST: return this.callHelper(helper.name, query[helper.name], query, helper.name /*identifier*/);
					return this.callHelper(helper.name, query[helper.name], query, identifier);
				} else if (helper.required && !query[helper.name]) {
					throw new Error('Required expression missing: ' + helper.name + '.');
				} else if (query[helper.name] && !this._helpers[helper.name]) {
					throw new Error('Unknown expression/operator detected: ' + helper.name + '.');
				} else {
					return '';
				}
			}).join('');
		} else {
			// there is no syntax, so we iterate each item as it is
			for (var key in query){
				// check if we know the helper -> each helper starts with $
				if (key.startsWith('$') && this._helpers[key]) {
					// TEST: result += this.callHelper(key, query[key], query, key /*identifier*/);
					result += this.callHelper(key, query[key], query, identifier);
				} else {
					// there was no helper detected or the key did not startwith '$'
					// check if it didnt start with $, so we have an identifier as key
					if (!key.startsWith('$')) {
						// identifier detected -> example "first_name: 'John'" or "first_name:{$eq:'John'}"
						if (_.isPlainObject(query[key])){
							// TEST: result += this.quote(key) + this.build(query[key]);
							// "first_name:{$eq:'John'}"
							result += this.build(query[key], key);
						} else if (_.isString(query[key])){
							// "first_name: 'John'"
							result += this.quote(key) + ' = ' + this.addValue(query[key]);
						} else {
							throw new Error('Unknown expression/operator detected: ' + key);
						}

					} else {
						// unknown helper
						throw new Error('Unknown expression/operator detected -> ' + key);
					}
				}
			}
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
		var result = this._helpers[name].fn(query, outerQuery, identifier);
		this._helperChain.pop();
		return result;
	}

	registerHelper(name, callback, reverse){
		this._helpers[name] = {
			fn: callback,
			reverse: reverse || false
		};
	}
}

module.exports = _SQLBuilder;
