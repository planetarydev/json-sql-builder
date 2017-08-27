'use strict';

const _ = require('lodash');
const helpers = require('../helpers');

function ninInHelper(helperName, ninIn/*IN or NOT IN*/, query, outerQuery, identifier){
	var results = [];
	var result;

	if (_.isArray(query)) {
		_.forEach(query, (value) => {
			if (!_.isObject(value) && !_.isSymbol(value)){
				results.push(this.addValue(value));
			} else {
				throw new Error('The items of helpers.comparison ' + helperName + ' must be type of primitive.');
			}
		});

		if (identifier){
			result = this.quote(identifier) + ' ' + ninIn + ' (' + results.join(', ') + ')';
		} else {
			result = ninIn + ' (' + results.join(', ') + ')';
		}
	} else if (_.isPlainObject(query)) {
		result = this.build(query);
	} else {
		throw new Error('Comaprison operator ' + helperName + ' must either be an array or object.');
	}

	return result;
}

function likeHelper(helperName, operator, saltedQueryValue, query, outerQuery, identifier){
	if (!_.isString(query)){
		throw new Error('The value of ' + helperName + ' must be a string.');
	}

	if (identifier){
		return this.quote(identifier) + ' ' + operator + ' ' + this.addValue(saltedQueryValue);
	} else {
		return operator + ' ' + this.addValue(saltedQueryValue);
	}
}

module.exports = function(sqlBuilder){
	/**
	 * @name $eq
	 * @summary Comparison where expression is equal to a value
	 * @memberOf Comparison
	 * @isquerying true
	 * @ansi true
	 *
	 * @param expr 	 {Property}		Specifies an Expression, Column name either table.column or column
	 * @param value  {Primitive}	Specifies the value to compare with
	 */
	sqlBuilder.registerHelper('$eq', function(val, outerQuery, identifier){
		return helpers.comparison.call(this, '=', val, outerQuery, identifier);
	});

	/**
	 * @name $ne
	 * @summary Comparison where expression is not equal to a value
	 * @memberOf Comparison
	 * @isquerying true
	 * @ansi true
	 *
	 * @param expr 	 {Property}		Specifies an Expression, Column name either table.column or column
	 * @param value  {Primitive}	Specifies the value to compare with
	 */
	sqlBuilder.registerHelper('$ne', function(val, outerQuery, identifier){
		return helpers.comparison.call(this, '!=', val, outerQuery, identifier);
	});

	/**
	 * @name $gt
	 * @summary Comparison where expression is greater than a value
	 * @memberOf Comparison
	 * @isquerying true
	 * @ansi true
	 *
	 * @param expr 	 {Property}		Specifies an Expression, Column name either table.column or column
	 * @param value  {Primitive}	Specifies the value to compare with
	 */
	sqlBuilder.registerHelper('$gt', function(val, outerQuery, identifier){
		return helpers.comparison.call(this, '>', val, outerQuery, identifier);
	});

	/**
	 * @name $gte
	 * @summary Comparison where expression is greater or equal than a value
	 * @memberOf Comparison
	 * @isquerying true
	 * @ansi true
	 *
	 * @param expr 	 {Property}		Specifies an Expression, Column name either table.column or column
	 * @param value  {Primitive}	Specifies the value to compare with
	 */
	sqlBuilder.registerHelper('$gte', function(val, outerQuery, identifier){
		return helpers.comparison.call(this, '>=', val, outerQuery, identifier);
	});

	/**
	 * @name $lt
	 * @summary Comparison where expression is lower than a value
	 * @memberOf Comparison
	 * @isquerying true
	 * @ansi true
	 *
	 * @param expr 	 {Property}		Specifies an Expression, Column name either table.column or column
	 * @param value  {Primitive}	Specifies the value to compare with
	 */
	sqlBuilder.registerHelper('$lt', function(val, outerQuery, identifier){
		return helpers.comparison.call(this, '<', val, outerQuery, identifier);
	});

	/**
	 * @name $lte
	 * @summary Comparison where expression is lower or equal than a value
	 * @memberOf Comparison
	 * @isquerying true
	 * @ansi true
	 *
	 * @param expr 	 {Property}		Specifies an Expression, Column name either table.column or column
	 * @param value  {Primitive}	Specifies the value to compare with
	 */
	sqlBuilder.registerHelper('$lte', function(val, outerQuery, identifier){
		return helpers.comparison.call(this, '<=', val, outerQuery, identifier);
	});

	/**
	 * @name $in
	 * @summary Comparison where expression is in the given list of items
	 * @memberOf Comparison
	 * @isquerying true
	 * @ansi true
	 *
	 * @param expr 	 {Property}	Specifies the Expression, Column name either table.column or column
	 * @param value  {Array}	Specifies the items of the IN clause
	 */
	sqlBuilder.registerHelper('$in', function(query, outerQuery, identifier){
		return ninInHelper.call(this, '$in', 'IN', query, outerQuery, identifier);
	});

	/**
	 * @name $nin
	 * @summary Comparison where expression is not in the given list of items
	 * @memberOf Comparison
	 * @isquerying true
	 * @ansi true
	 *
	 * @param expr 	 {String}	Specifies the Expression, Column name either table.column or column
	 * @param value  {Array}	Specifies the items of the IN clause
	 */
	sqlBuilder.registerHelper('$nin', function(query, outerQuery, identifier){
		return ninInHelper.call(this, '$nin', 'NOT IN', query, outerQuery, identifier);
	});

	/**
	 * @name $startsWith
	 * @summary Comparison where expression starts with a value
	 * @memberOf Comparison
	 * @isquerying true
	 * @ansi true
	 *
	 * @param expr 	 {String}	Specifies the Expression, Column name either table.column or column
	 * @param value  {String}	Specifies the value to compare with
	 *
	 * @return {String}		`expr` LIKE 'value%'
	 */
	sqlBuilder.registerHelper('$startsWith', function(query, outerQuery, identifier){
		return likeHelper.call(this, '$startsWith', 'LIKE', query + this.wildcardChar, query, outerQuery, identifier);
	});

	/**
	 * @name $endsWith
	 * @summary Comparison where expression ends with a value
	 * @memberOf Comparison
	 * @isquerying true
	 * @ansi true
	 *
	 * @param expr 	 {String}	Specifies the Expression, Column name either table.column or column
	 * @param value  {String}	Specifies the value to compare with
	 *
	 * @return {String}		`expr` LIKE '%value'
	 */
	sqlBuilder.registerHelper('$endsWith', function(query, outerQuery, identifier){
		return likeHelper.call(this, '$endsWith', 'LIKE', this.wildcardChar + query, query, outerQuery, identifier);
	});

	/**
	 * @name $contains
	 * @summary Comparison where expression contains a value
	 * @memberOf Comparison
	 * @isquerying true
	 * @ansi true
	 *
	 * @param expr 	 {String}	Specifies the Expression, Column name either table.column or column
	 * @param value  {String}	Specifies the value to compare with
	 *
	 * @return {String}		`expr` LIKE '%value%'
	 */
	sqlBuilder.registerHelper('$contains', function(query, outerQuery, identifier){
		return likeHelper.call(this, '$contains', 'LIKE', this.wildcardChar + query + this.wildcardChar, query, outerQuery, identifier);
	});

	/**
	 * @name $like
	 * @summary Comparison where expression equals a pattern value
	 * @memberOf Comparison
	 * @isquerying true
	 * @ansi true
	 *
	 * @param expr 	 {String}	Specifies the Expression, Column name either table.column or column
	 * @param value  {String}	Specifies the value to compare with
	 *
	 * @return {String}		`expr` LIKE <value>
	 */
	sqlBuilder.registerHelper('$like', function(query, outerQuery, identifier){
		return likeHelper.call(this, '$like', 'LIKE', query, query, outerQuery, identifier);
	});

	/**
	 * @name $isNull
	 * @summary Comparison where expression IS NULL or IS NOT NULL, depending on the given value `true` or `false`.
	 * @memberOf Comparison
	 * @isquerying true
	 * @ansi true
	 *
	 * @param expr 	 {String}	Specifies the Expression, Column name either table.column or column
	 * @param value  {Boolean}	Specifies IS NULL (true) or IS NOT NULL (false)
	 *
	 * @return {String}		`expr` IS NULL or `expr` IS NOT NULL
	 */
	sqlBuilder.registerHelper('$isNull', function(isnull, outerQuery, identifier){
		var result = '';

		if (!_.isBoolean(isnull)) {
			throw new Error('$isNull must be a true or false.');
		}

		if (identifier){
			result = this.quote(identifier) + ' IS ' + (isnull ? 'NULL':'NOT NULL');
		} else {
			result = 'IS ' + (isnull ? 'NULL':'NOT NULL');
		}
		return result;
	});

	/**
	 * @name $between
	 * @summary Comparison where expression is between the given array item 0 and item 1.
	 * @memberOf Comparison
	 * @isquerying true
	 * @ansi true
	 *
	 * @param expr 	 {String}	Specifies the Expression, Column name either table.column or column
	 * @param value  {Array}	Specifies the range, from and til. It must be an Array with exactly 2 items.
	 *
	 * @return {String}		`expr` BETWEEN item1 AND item2
	 */
	sqlBuilder.registerHelper('$between', function(between, outerQuery, identifier){
		var result = '';

		if (!_.isArray(between)) {
			throw new Error('$between must be an array.');
		}
		if (!between.length == 2) {
			throw new Error('$between must be an array with length of 2.');
		}

		if (identifier){
			result = this.quote(identifier) + ' BETWEEN ' + this.addValue(between[0]) + ' AND ' + this.addValue(between[1]);
		} else {
			result = 'BETWEEN ' + this.addValue(between[0]) + ' AND ' + this.addValue(between[1]);
		}
		return result;
	});

};
