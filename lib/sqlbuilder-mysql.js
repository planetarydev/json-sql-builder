'use strict';

const _ = require('lodash');

const SYNTAX_SELECT = 'SELECT [$sqlFoundRows] [$distinct] [$all] <$columns> { FROM [$table] } [$where] [$groupBy] [$having]';
const REVERSE_HELPER = true;

function whereClause(sqlBuilder, usedFor, where, outerQuery, identifier) {
	var result = '',
		conditions = [];

	if (_.isPlainObject(where)){
		// the where clause is an object
		// $where: {
		//    first_name: 'John',
		//    last_name: 'Doe'
		// }
		_.forEach(where, function(value, key){
			// check if there is a helper, maybe $or, $and ?
			if (key.startsWith('$')){
				// $or: [...]
				var tmpQuery = {};
				tmpQuery[key] = value;
				conditions.push(sqlBuilder.build(tmpQuery));
			} else {
				if (_.isString(value)){
					//    first_name: 'John',
					conditions.push(sqlBuilder.quote(key) + ' = ' + sqlBuilder.addValue(value));
				} else if (_.isPlainObject(value)) {
					//    last_name: { $eq: 'Doe' }
					conditions.push(sqlBuilder.quote(key) + sqlBuilder.build(value));
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


module.exports = function(sqlBuilder){
	// Setup the specific MySQL value placeholder and quotes for the identifiers
	sqlBuilder.placeholder = function(){
		//postgreSQL style: return '$' + this._values.length;
		return '?';
	};
	sqlBuilder.quoteChar = '`'; // MySQL uses the backticks like `column`.`table`

	sqlBuilder.registerHelper('$select', function(query, outerQuery, identifier) {
		var result = '(SELECT ';

		// check the type of the query, it must always be an object
		if (!_.isPlainObject(query)){
			throw new Error('$select must always be an object.');
		}

		// check for $fields or $columns definition, otherwise we add '*' as columns
		if (!query.$columns){
			query.$columns = ['*'];
		}

		result += sqlBuilder.build(query, SYNTAX_SELECT);

		result += ')';
		return result;
	});

	sqlBuilder.registerHelper('$table', function(table, outerQuery, identifier){
		if (_.isString(table)){
			// the table is a string like $table: 'people'
			return ' FROM ' + sqlBuilder.quote(table);
		} else if (_.isPlainObject(table)) {
			// table is an object like $table: { people: { $as: 'alias_people' } }
			return ' FROM ' + sqlBuilder.build(table);
		} else {
			throw new Error('$table expression must be either a string or object.');
		}
	});

	sqlBuilder.registerHelper('$columns', function(query, outerQuery, identifier){
		var results = [];

		// the table is a string like $table: 'people'
		if (_.isArray(query)){
			_.forEach(query, function(column){
				// check the type of the column definition
				if (_.isString(column)){
					results.push(sqlBuilder.quote(column));
				} else if (_.isPlainObject(column)) {
					results.push(sqlBuilder.build(column));
				} else {
					throw new Error('The items of $columns array should either be a string or an object.');
				}
			});
		} else if (_.isPlainObject(query)) {
			_.forEach(query, function(value, column){
				// check the type of the column definition
				if (_.isString(value)){
					results.push(sqlBuilder.addValue(value) + ' AS ' + sqlBuilder.quote(column));
				} else if (_.isPlainObject(value)) {
					results.push(sqlBuilder.build(value) + ' AS ' + sqlBuilder.quote(column));
				} else {
					throw new Error('The items of the $columns array should either be a string or an object.');
				}
			});
		} else {
			throw new Error('$columns must be either array of strings or objects.');
		}

		return results.join(', ');
	});

	sqlBuilder.registerHelper('$where', function(where, outerQuery, identifier){
		var result = whereClause(sqlBuilder, '$where', where, outerQuery, identifier);
		return (result.length > 0 ? ' WHERE ' + result : '');
	});

	sqlBuilder.registerHelper('$and', function(query, outerQuery, identifier){
		var results = [];

		if (!_.isArray(query)){
			throw new Error('$and must be an array.');
		}

		/* Example
		$where: {
			$and : [
				{ first_name: 'John' },
				{ last_name: { $eq: 'Doe' } },
				{ $or : [
					{ age : { $gt: 18 } },
					{ gender : { $ne: 'female' } }
				]}
			]
		}*/
		_.forEach(query, function(andItem){
			if (_.isPlainObject(andItem)) {
				results.push(sqlBuilder.build(andItem));
			} else {
				throw new Error('Each item using locical operator $and must be an object.');
			}
		});

		if (results.length > 0){
			return '(' + results.join(' AND ') + ')';
		} else {
			return '';
		}
	});

	sqlBuilder.registerHelper('$or', function(query, outerQuery, identifier){
		var results = [];

		if (!_.isArray(query)){
			throw new Error('$or must be an array.');
		}

		_.forEach(query, function(andItem){
			if (_.isPlainObject(andItem)) {
				results.push(sqlBuilder.build(andItem));
			} else {
				throw new Error('Each item using locical operator $or must be an object.');
			}
		});

		if (results.length > 0){
			return '(' + results.join(' OR ') + ')';
		} else {
			return '';
		}
	});

	sqlBuilder.registerHelper('$groupBy', function(groupBy, outerQuery, identifier){
		// the groupBy can be handeld with the columns-helper because it has the
		// same syntax and definition
		var result = sqlBuilder.callHelper('$columns', groupBy, outerQuery, identifier);
		return ' GROUP BY ' + result;
	});

	sqlBuilder.registerHelper('$having', function(where, outerQuery, identifier){
		// the $having expression is the same as the where clause
		var result = whereClause(sqlBuilder, '$having', where, outerQuery, identifier);
		return (result.length > 0 ? ' HAVING ' + result : '');
	});

	sqlBuilder.registerHelper('$count', function(count, outerQuery, identifier){
		console.log(count, outerQuery, identifier);
		return ' COUNT(' + sqlBuilder.quote(count) + ') ';
	}, REVERSE_HELPER);

	sqlBuilder.registerHelper('$as', function(alias, outerQuery, identifier){
		return ' AS ' + sqlBuilder.quote(alias);
	});

	sqlBuilder.registerHelper('$alias', function(alias, outerQuery, identifier){
		return ' AS ' + sqlBuilder.quote(alias);
	});

	sqlBuilder.registerHelper('$val', function(val, outerQuery, identifier){
		return sqlBuilder.addValue(val);
	});

	sqlBuilder.registerHelper('$eq', function(val, outerQuery, identifier){
		return ' = ' + sqlBuilder.addValue(val);
	});

	sqlBuilder.registerHelper('$ne', function(val, outerQuery, identifier){
		return ' != ' + sqlBuilder.addValue(val);
	});

	sqlBuilder.registerHelper('$gt', function(val, outerQuery, identifier){
		return ' > ' + sqlBuilder.addValue(val);
	});

};
