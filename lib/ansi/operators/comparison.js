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
	sqlBuilder.registerHelper('$eq', function(val, outerQuery, identifier){
		return helpers.comparison.call(this, '=', val, outerQuery, identifier);
	});

	sqlBuilder.registerHelper('$ne', function(val, outerQuery, identifier){
		return helpers.comparison.call(this, '!=', val, outerQuery, identifier);
	});

	sqlBuilder.registerHelper('$gt', function(val, outerQuery, identifier){
		return helpers.comparison.call(this, '>', val, outerQuery, identifier);
	});

	sqlBuilder.registerHelper('$gte', function(val, outerQuery, identifier){
		return helpers.comparison.call(this, '>=', val, outerQuery, identifier);
	});

	sqlBuilder.registerHelper('$lt', function(val, outerQuery, identifier){
		return helpers.comparison.call(this, '<', val, outerQuery, identifier);
	});

	sqlBuilder.registerHelper('$lte', function(val, outerQuery, identifier){
		return helpers.comparison.call(this, '<=', val, outerQuery, identifier);
	});

	sqlBuilder.registerHelper('$in', function(query, outerQuery, identifier){
		return ninInHelper.call(this, '$in', 'IN', query, outerQuery, identifier);
	});

	sqlBuilder.registerHelper('$nin', function(query, outerQuery, identifier){
		return ninInHelper.call(this, '$nin', 'NOT IN', query, outerQuery, identifier);
	});

	sqlBuilder.registerHelper('$startsWith', function(query, outerQuery, identifier){
		return likeHelper.call(this, '$startsWith', 'LIKE', query + this.wildcardChar, query, outerQuery, identifier);
	});

	sqlBuilder.registerHelper('$endsWith', function(query, outerQuery, identifier){
		return likeHelper.call(this, '$endsWith', 'LIKE', this.wildcardChar + query, query, outerQuery, identifier);
	});

	sqlBuilder.registerHelper('$contains', function(query, outerQuery, identifier){
		return likeHelper.call(this, '$contains', 'LIKE', this.wildcardChar + query + this.wildcardChar, query, outerQuery, identifier);
	});

	sqlBuilder.registerHelper('$like', function(query, outerQuery, identifier){
		return likeHelper.call(this, '$like', 'LIKE', query, query, outerQuery, identifier);
	});

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
