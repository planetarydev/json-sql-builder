'use strict';

const _ = require('lodash');

function whereClause(usedFor, where /*, outerQuery, identifier*/) {
	var result = '',
		conditions = [];

	if (_.isPlainObject(where)){
		// $where: {
		//    first_name: 'John',
		//    last_name: 'Doe'
		// }
		_.forEach(where, (value, key) => {
			// check if there is a helper, maybe $or, $and ?
			if (key.startsWith('$')){
				// $or: [...]
				var tmpQuery = {};
				tmpQuery[key] = value;
				conditions.push(this.build(tmpQuery));
			} else {
				if (_.isString(value)){
					//    first_name: 'John',
					conditions.push(this.quote(key) + ' = ' + this.addValue(value));
				} else if (_.isPlainObject(value)) {
					//    last_name: { $eq: 'Doe' }
					conditions.push(this.build(value, key));
				} else {
					// TODO: check if array is a possible value
					throw new Error ('Unknown value inside ' + usedFor + ' clause. The value must be either string or object.');
				}
			}
		});
	} else {
		throw new Error(usedFor + ' expression must be an object.');
	}

	result += conditions.join(' AND ');

	if (result.startsWith('(')){
		// remove the outer most parenthetes
		result = result.substring(1, result.length - 1);
	}

	return result;
}
module.exports.whereClause = whereClause;

function aggregationHelper(sqlCommand, aggregation, outerQuery, identifier) {
	if (identifier){
		// SUM(`salary`) AS `total_salary`
		return sqlCommand + '(' + this.quote(aggregation) + ') AS ' + this.quote(identifier);
	} else {
		// SUM(`salary`)
		return sqlCommand + '(' + this.quote(aggregation) + ')';
	}
}
module.exports.aggregation = aggregationHelper;

function comparisonHelper(condition, val, outerQuery, identifier) {
	if (identifier){
		return this.quote(identifier) + ' ' + condition + ' ' + this.addValue(val);
	} else {
		return condition + ' ' + this.addValue(val);
	}
}
module.exports.comparison = comparisonHelper;

function sortHelper(helperName, sort/*, outerQuery, identifier*/){
	var results = [];

	if (_.isString(sort)){
		// $sort: 'first_name'
		results.push(this.quote(sort));
	} else if (_.isArray(sort)) {
		/*
		$sort: ['last_name', 'first_name'],

		$sort: [
			{ last_name : 'ASC' },
			{ first_name : 'DESC' }
		]*/
		_.forEach(sort, (column) => {
			// check the type of the column definition
			if (_.isString(column)){
				// $sort: ['last_name', 'first_name'],
				results.push(this.quote(column));
			} else if (_.isPlainObject(column)) {
				/*$sort: [
					{ last_name : 'ASC' },
					{ first_name : 'DESC' }
				]*/
				_.forEach(column, (value, key) => {
					var ascdesc = '';
					if (_.isPlainObject(value)) ascdesc = this.build(value);
					if (_.isString(value) && value.toLowerCase() === 'asc') ascdesc = 'ASC';
					if (_.isString(value) && value.toLowerCase() === 'desc') ascdesc = 'DESC';
					if (_.isNumber(value) && value === 1) ascdesc = 'ASC';
					if (_.isNumber(value) && value === -1) ascdesc = 'DESC';
					results.push(this.quote(key) + ' ' + ascdesc);
				});
			} else {
				throw new Error('The items of the ' + helperName + ' array should either be a string or an object.');
			}
		});
	} else if (_.isPlainObject(sort)) {
		/*$sort: {
			{ last_name : 'ASC' },
			{ first_name : 'DESC' }
		}*/
		_.forEach(sort, (value, column) => {
			var ascdesc = '';

			if (_.isString(value)){
				if (value.toLowerCase() === 'asc') ascdesc = ' ASC';
				if (value.toLowerCase() === 'desc') ascdesc = ' DESC';
				results.push(this.quote(column) + ascdesc);
			} else if (_.isNumber(value)){
				if (value === 1) ascdesc = ' ASC';
				if (value === -1) ascdesc = ' DESC';
				results.push(this.quote(column) + ascdesc);
			} else if (_.isPlainObject(value)) {
				if (_.isPlainObject(value)) ascdesc = this.build(value);
				results.push(this.quote(column) + ' ' + ascdesc);
			} else {
				throw new Error('The properties of the ' + helperName + ' object should either be a string or an object.');
			}
		});
	}

	return results;
}
module.exports.sort = sortHelper;
