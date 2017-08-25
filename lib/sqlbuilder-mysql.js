'use strict';

const _ = require('lodash');

const SYNTAX_SELECT 		= 'SELECT [$sqlFoundRows] [$distinct] [$all] <$columns> [$into] { FROM [$table] } [$where] [$groupBy] [$rollup] [$having] [$sort] [$orderBy] [$limit] [$offset]';

const SYNTAX_GROUP_CONCAT	= 'GROUP_CONCAT ( [$distinct] <$column> [$sort] [$orderBy] [$separator] ) ';

const SYNTAX_SELECT_INTO			= '[$outfile] [$dumpfile]';
const SYNTAX_SELECT_INTO_OUTFILE			= 'INTO OUTFILE <$file> [$fields] [$lines]';
const SYNTAX_SELECT_INTO_OUTFILE_FIELDS		= 'FIELDS [$terminatedBy] [$enclosedBy] [$escapedBy]';
const SYNTAX_SELECT_INTO_OUTFILE_LINES		= 'LINES [$terminatedBy]';

const SYNTAX_SELECT_INTO_DUMPFILE			= 'INTO DUMPFILE <$file>';


function whereClause(sqlBuilder, usedFor, where /*, outerQuery, identifier*/) {
	var result = '',
		conditions = [];

	if (_.isPlainObject(where)){
		// $where: {
		//    first_name: 'John',
		//    last_name: 'Doe'
		// }
		_.forEach(where, function(value, key) {
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
					// TEST: conditions.push(sqlBuilder.quote(key) + sqlBuilder.build(value));
					conditions.push(sqlBuilder.build(value, key));
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

function aggregationHelper(sqlBuilder, sqlCommand, aggregation, outerQuery, identifier) {
	if (identifier){
		// SUM(`salary`) AS `total_salary`
		return sqlCommand + '(' + sqlBuilder.quote(aggregation) + ') AS ' + sqlBuilder.quote(identifier);
	} else {
		// SUM(`salary`)
		return sqlCommand + '(' + sqlBuilder.quote(aggregation) + ') ';
	}
}

function conditionalHelper(sqlBuilder, condition, val, outerQuery, identifier) {
	if (identifier){
		return sqlBuilder.quote(identifier) + ' ' + condition + ' ' + sqlBuilder.addValue(val);
	} else {
		return condition + ' ' + sqlBuilder.addValue(val);
	}
}

function sortHelper(sqlBuilder, helperName, sort/*, outerQuery, identifier*/){
	var results = [];

	if (_.isString(sort)){
		// $sort: 'first_name'
		results.push(sqlBuilder.quote(sort));
	} else if (_.isArray(sort)) {
		/*
		$sort: ['last_name', 'first_name'],

		$sort: [
			{ last_name : 'ASC' },
			{ first_name : 'DESC' }
		]*/
		_.forEach(sort, function(column){
			// check the type of the column definition
			if (_.isString(column)){
				// $sort: ['last_name', 'first_name'],
				results.push(sqlBuilder.quote(column));
			} else if (_.isPlainObject(column)) {
				/*$sort: [
					{ last_name : 'ASC' },
					{ first_name : 'DESC' }
				]*/
				_.forEach(column, function(value, key){
					var ascdesc = '';
					if (_.isPlainObject(value)) ascdesc = sqlBuilder.build(value);
					if (_.isString(value) && value.toLowerCase() === 'asc') ascdesc = ' ASC';
					if (_.isString(value) && value.toLowerCase() === 'desc') ascdesc = ' DESC';
					if (_.isNumber(value) && value === 1) ascdesc = ' ASC';
					if (_.isNumber(value) && value === -1) ascdesc = ' DESC';
					results.push(sqlBuilder.quote(key) + ascdesc);
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
		_.forEach(sort, function(value, column){
			var ascdesc = '';

			if (_.isString(value)){
				if (value.toLowerCase() === 'asc') ascdesc = ' ASC';
				if (value.toLowerCase() === 'desc') ascdesc = ' DESC';
				results.push(sqlBuilder.quote(column) + ascdesc);
			} else if (_.isNumber(value)){
				if (value === 1) ascdesc = ' ASC';
				if (value === -1) ascdesc = ' DESC';
				results.push(sqlBuilder.quote(column) + ascdesc);
			} else if (_.isPlainObject(value)) {
				if (_.isPlainObject(value)) ascdesc = sqlBuilder.build(value);
				results.push(sqlBuilder.quote(column) + ascdesc);
			} else {
				throw new Error('The properties of the ' + helperName + ' object should either be a string or an object.');
			}
		});
	}

	return results;
}


module.exports = function(sqlBuilder){
	// Setup the specific MySQL value placeholder and quotes for the identifiers
	sqlBuilder.placeholder = function(){
		//postgreSQL style: return '$' + this._values.length;
		return '?';
	};
	sqlBuilder.quoteChar = '`'; // MySQL uses the backticks like `column`.`table`

	sqlBuilder.registerHelper('$select', function(query/*, outerQuery, identifier*/) {
		var result = '(SELECT ';

		// check the type of the query, it must always be an object
		if (!_.isPlainObject(query)){
			throw new Error('$select must always be an object.');
		}

		// check for $fields or $columns definition, otherwise we add '*' as columns
		if (!query.$columns){
			query.$columns = ['*'];
		}

		result += sqlBuilder.build(query, null, SYNTAX_SELECT);

		result += ')';
		return result;
	});

	sqlBuilder.registerHelper('$table', function(table/*, outerQuery, identifier*/){
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

	sqlBuilder.registerHelper('$columns', function(query/*, outerQuery, identifier*/){
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
					throw new Error('The items of the $columns array should either be a string or an object.');
				}
			});
		} else if (_.isPlainObject(query)) {
			_.forEach(query, function(value, column){
				// check the type of the column definition
				if (_.isString(value)){
					results.push(sqlBuilder.addValue(value) + ' AS ' + sqlBuilder.quote(column));
				} else if (_.isPlainObject(value)) {
					// TEST: results.push(sqlBuilder.build(value) + ' AS ' + sqlBuilder.quote(column));
					results.push(sqlBuilder.build(value, column));
				} else {
					throw new Error('The items of the $columns array should either be a string or an object.');
				}
			});
		} else {
			throw new Error('$columns must be either array of strings or objects.');
		}

		return results.join(', ');
	});

	sqlBuilder.registerHelper('$into', function(query/*, outerQuery, identifier*/){
		var result = '',
			results = [];

		if (_.isArray(query)){
			// $into: ['@firstname', '@lastname']
			_.forEach(query, function(column){
				// check the type of the column definition
				if (_.isString(column)){
					results.push(sqlBuilder.quote(column));
				} else {
					throw new Error('The items of the $into array must be type of string.');
				}
			});

			result = (results.length > 0 ? ' INTO ' + results.join(', ') : '');
		} else if (_.isPlainObject(query)) {
			result = ' INTO ' + sqlBuilder.build(query, null, SYNTAX_SELECT_INTO);
		} else {
			throw new Error('$columns must be either array of strings or objects.');
		}

		return result;
	});

	sqlBuilder.registerHelper('$outfile', function(query/*, outerQuery, identifier*/){
		if (!_.isPlainObject(query)) {
			throw new Error('$outfile must be an objects.');
		}

		return 'OUTFILE ' + sqlBuilder.build(query, null, SYNTAX_SELECT_INTO_OUTFILE);
	});

	sqlBuilder.registerHelper('$file', function(file/*, outerQuery, identifier*/){
		if (!_.isString(file)) {
			throw new Error('$file must be a string.');
		}

		return sqlBuilder.addValue(file);
	});

	sqlBuilder.registerHelper('$fields', function(fields/*, outerQuery, identifier*/){
		if (!_.isObject(fields)) {
			throw new Error('$fields must be an object.');
		}

		return ' FIELDS' + sqlBuilder.build(fields, null, SYNTAX_SELECT_INTO_OUTFILE_FIELDS);
	});

	sqlBuilder.registerHelper('$lines', function(lines/*, outerQuery, identifier*/){
		if (!_.isObject(lines)) {
			throw new Error('$lines must be an object.');
		}

		return ' LINES' + sqlBuilder.build(lines, null, SYNTAX_SELECT_INTO_OUTFILE_LINES);
	});

	sqlBuilder.registerHelper('$terminatedBy', function(terminatedBy/*, outerQuery, identifier*/){
		if (!_.isString(terminatedBy)) {
			throw new Error('$terminatedBy must be a string.');
		}

		return ' TERMINATED BY ' + sqlBuilder.addValue(terminatedBy);
	});

	sqlBuilder.registerHelper('$enclosedBy', function(enclosedBy/*, outerQuery, identifier*/){
		if (!_.isString(enclosedBy)) {
			throw new Error('$enclosedBy must be a string.');
		}

		return ' ENCLOSED BY ' + sqlBuilder.addValue(enclosedBy);
	});

	sqlBuilder.registerHelper('$escapedBy', function(escapedBy/*, outerQuery, identifier*/){
		if (!_.isString(escapedBy)) {
			throw new Error('$escapedBy must be a string.');
		}

		return ' ESCAPED BY ' + sqlBuilder.addValue(escapedBy);
	});

	sqlBuilder.registerHelper('$dumpfile', function(query/*, outerQuery, identifier*/){
		if (!_.isPlainObject(query)) {
			throw new Error('$dumpfile must be an objects.');
		}

		return sqlBuilder.build(query, null, SYNTAX_SELECT_INTO_DUMPFILE);
	});

	sqlBuilder.registerHelper('$where', function(where/*, outerQuery, identifier*/){
		var result = whereClause(sqlBuilder, '$where', where/*, outerQuery, identifier*/);
		return (result.length > 0 ? ' WHERE ' + result : '');
	});

	sqlBuilder.registerHelper('$and', function(query/*, outerQuery, identifier*/){
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

	sqlBuilder.registerHelper('$or', function(query/*, outerQuery, identifier*/){
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

	sqlBuilder.registerHelper('$calcFoundRows', function(calcFoundRows/*, outerQuery, identifier*/){
		if (_.isBoolean(calcFoundRows)) {
			return calcFoundRows ? 'SQL_CALC_FOUND_ROWS ' : '';
		} else {
			throw new Error ('$calcFoundRows must be true or false.');
		}
	});

	sqlBuilder.registerHelper('$groupBy', function(groupBy, outerQuery, identifier){
		// the groupBy can be handeld with the columns-helper because it has the
		// same syntax and definition
		var result = sqlBuilder.callHelper('$columns', groupBy, outerQuery, identifier);
		return ' GROUP BY ' + result;
	});

	sqlBuilder.registerHelper('$rollup', function(rollup/*, outerQuery, identifier*/){
		// $rollup: true,
		if (_.isBoolean(rollup)) {
			return rollup ? ' WITH ROLLUP' : '';
		} else {
			throw new Error ('$calcFoundRows must be true or false.');
		}
	});

	sqlBuilder.registerHelper('$having', function(where, outerQuery, identifier){
		// the $having expression is the same as the where clause
		var result = whereClause(sqlBuilder, '$having', where, outerQuery, identifier);
		return (result.length > 0 ? ' HAVING ' + result : '');
	});

	sqlBuilder.registerHelper('$limit', function(limit/*, outerQuery, identifier*/){
		const LIMIT_MAX_ALL = 18446744073709551615;

		if (limit === 'ALL') {
			return ' LIMIT ' + sqlBuilder.addValue(LIMIT_MAX_ALL);
		}
		else if (_.isNumber(limit)) {
			return ' LIMIT ' + sqlBuilder.addValue(limit);
		} else {
			throw new Error ('$limit must be \'ALL\' or a number.');
		}
	});

	sqlBuilder.registerHelper('$offset', function(offset, outerQuery/*, identifier*/){
		// on MySQL we can't use offset without limit
		if ('$limit' in outerQuery) {
			if (_.isNumber(offset)) {
				return ' OFFSET ' + sqlBuilder.addValue(offset);
			} else {
				throw new Error ('$offset must be a number.');
			}
		} else {
			throw new Error ('Can\'t use $offset without $limit.');
		}
	});

	sqlBuilder.registerHelper('$expr', function(expr/*, outerQuery, identifier*/){
		return sqlBuilder.build(expr);
	});

	sqlBuilder.registerHelper('$count', function(aggregation, outerQuery, identifier){
		return aggregationHelper(sqlBuilder, 'COUNT', aggregation, outerQuery, identifier);
	});

	sqlBuilder.registerHelper('$sum', function(aggregation, outerQuery, identifier){
		return aggregationHelper(sqlBuilder, 'SUM', aggregation, outerQuery, identifier);
	});

	sqlBuilder.registerHelper('$min', function(aggregation, outerQuery, identifier){
		return aggregationHelper(sqlBuilder, 'MIN', aggregation, outerQuery, identifier);
	});

	sqlBuilder.registerHelper('$max', function(aggregation, outerQuery, identifier){
		return aggregationHelper(sqlBuilder, 'MAX', aggregation, outerQuery, identifier);
	});

	sqlBuilder.registerHelper('$avg', function(aggregation, outerQuery, identifier){
		return aggregationHelper(sqlBuilder, 'AVG', aggregation, outerQuery, identifier);
	});

	sqlBuilder.registerHelper('$groupConcat', function(groupConcat, outerQuery, identifier){
		// check for standard group_contact without addinal stuff
		if (_.isString(groupConcat)){
			return aggregationHelper(sqlBuilder, 'GROUP_CONCAT', groupConcat, outerQuery, identifier);
		} else if (_.isPlainObject(groupConcat)) {
			return 'GROUP_CONCAT(' + sqlBuilder.build(groupConcat, identifier, SYNTAX_GROUP_CONCAT) + ')' + (identifier ? ' AS ' + sqlBuilder.quote(identifier) : '');
		}
	});

	sqlBuilder.registerHelper('$sort', function(sort/*, outerQuery, identifier*/){
		var results = sortHelper(sqlBuilder, '$sort', sort);
		return (results.length > 0 ? ' ORDER BY ' + results.join(', ') : '');
	});

	sqlBuilder.registerHelper('$orderBy', function(sort/*, outerQuery, identifier*/){
		var results = sortHelper(sqlBuilder, '$orderBy', sort);
		return (results.length > 0 ? ' ORDER BY ' + results.join(', ') : '');
	});

	sqlBuilder.registerHelper('$asc', function(asc, outerQuery, identifier){
		// $asc: true,
		if (_.isBoolean(asc)) {
			if (identifier){
				return sqlBuilder.quote(identifier) + (asc ? ' ASC' : '');
			} else {
				return asc ? ' ASC' : '';
			}
		} else {
			throw new Error ('$asc must be true or false.');
		}
	});

	sqlBuilder.registerHelper('$desc', function(desc, outerQuery, identifier){
		// $desc: true,
		if (_.isBoolean(desc)) {
			if (identifier){
				return sqlBuilder.quote(identifier) + (desc ? ' DESC' : '');
			} else {
				return desc ? ' DESC' : '';
			}
		} else {
			throw new Error ('$desc must be true or false.');
		}
	});

	sqlBuilder.registerHelper('$column', function(column/*, outerQuery, identifier*/){
		if (_.isString(column)){
			return sqlBuilder.quote(column);
		} else {
			throw new Error ('$column must be a string.');
		}
	});

	sqlBuilder.registerHelper('$separator', function(separator/*, outerQuery, identifier*/){
		if (!_.isString(separator)) {
			throw new Error ('$separator must be a string.');
		}
		return ' SEPERATOR ' + sqlBuilder.addValue(separator);
	});

	sqlBuilder.registerHelper('$distinct', function(distinct/*, outerQuery, identifier*/){
		if (_.isBoolean(distinct)) {
			return distinct ? 'DISTINCT ' : '';
		} else {
			throw new Error ('$distinct must be true or false.');
		}
	});

	sqlBuilder.registerHelper('$as', function(alias, outerQuery, identifier){
		if (identifier){
			return sqlBuilder.quote(identifier) + ' AS ' + sqlBuilder.quote(alias);
		} else {
			return 'AS ' + sqlBuilder.quote(alias);
		}
	});

	sqlBuilder.registerHelper('$alias', function(alias, outerQuery, identifier){
		// only an alias for $as :-)
		return sqlBuilder.callHelper('$as', alias, outerQuery, identifier);
	});

	sqlBuilder.registerHelper('$val', function(val, outerQuery, identifier){
		if (identifier) {
			return sqlBuilder.addValue(val) + ' AS ' + sqlBuilder.quote(identifier);
		} else {
			return sqlBuilder.addValue(val);
		}
	});

	sqlBuilder.registerHelper('$eq', function(val, outerQuery, identifier){
		return conditionalHelper(sqlBuilder, '=', val, outerQuery, identifier);
	});

	sqlBuilder.registerHelper('$ne', function(val, outerQuery, identifier){
		return conditionalHelper(sqlBuilder, '!=', val, outerQuery, identifier);
	});

	sqlBuilder.registerHelper('$gt', function(val, outerQuery, identifier){
		return conditionalHelper(sqlBuilder, '>', val, outerQuery, identifier);
	});
};
