'use strict';

const _ 		= require('lodash');
const helpers 	= require('./helpers');

module.exports = function(sqlBuilder){
	// ANSI SELECT Statement Syntax
	sqlBuilder.registerSyntax('$select', `SELECT [$distinct] [$all]
											 <$columns>
											{ FROM [$table] | [$from] }
											{ WHERE [$where] }
											{ GROUP BY [$groupBy]
												{ HAVING [$having] }
											}
											{ ORDER BY { [$sort] | [$orderBy] } }`);

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

		result += this.build(query, null, sqlBuilder.getSyntax('$select'));

		result += ')';
		return result;
	});

	sqlBuilder.registerHelper('$table', function(table/*, outerQuery, identifier*/){
		if (_.isString(table)){
			// the table is a string like $table: 'people'
			return 'FROM ' + this.quote(table);
		} else if (_.isPlainObject(table)) {
			// table is an object like $table: { people: { $as: 'alias_people' } }
			return 'FROM ' + this.build(table);
		} else {
			throw new Error('$table expression must be either a string or object.');
		}
	});

	sqlBuilder.registerHelper('$from', function(table/*, outerQuery, identifier*/){
		return sqlBuilder.callHelper('$table', table);
	});

	sqlBuilder.registerHelper('$columns', function(query/*, outerQuery, identifier*/){
		var results = [];

		// the table is a string like $table: 'people'
		if (_.isArray(query)){
			_.forEach(query, (column) => {
				// check the type of the column definition
				if (_.isString(column)){
					results.push(this.quote(column));
				} else if (_.isPlainObject(column)) {
					results.push(this.build(column));
				} else {
					throw new Error('The items of the $columns array should either be a string or an object.');
				}
			});
		} else if (_.isPlainObject(query)) {
			_.forEach(query, (value, column) => {
				// check the type of the column definition
				if (_.isString(value)){
					results.push(this.addValue(value) + ' AS ' + this.quote(column));
				} else if (_.isPlainObject(value)) {
					results.push(this.build(value, column));
				} else {
					throw new Error('The items of the $columns array should either be a string or an object.');
				}
			});
		} else {
			throw new Error('$columns must be either array of strings or objects.');
		}

		return results.join(', ');
	});

	sqlBuilder.registerHelper('$where', function(where/*, outerQuery, identifier*/){
		var result = helpers.whereClause.call(this, '$where', where/*, outerQuery, identifier*/);
		return (result.length > 0 ? 'WHERE ' + result : '');
	});

	sqlBuilder.registerHelper('$groupBy', function(groupBy, outerQuery, identifier){
		// the groupBy can be handeld with the columns-helper because it has the
		// same syntax and definition
		var result = sqlBuilder.callHelper('$columns', groupBy, outerQuery, identifier);
		return 'GROUP BY ' + result;
	});

	sqlBuilder.registerHelper('$having', function(where, outerQuery, identifier){
		// the $having expression is the same as the where clause
		var result = helpers.whereClause.call(this, '$having', where, outerQuery, identifier);
		return (result.length > 0 ? 'HAVING ' + result : '');
	});

	sqlBuilder.registerHelper('$sort', function(sort/*, outerQuery, identifier*/){
		var results = helpers.sort.call(this, '$sort', sort);
		return (results.length > 0 ? 'ORDER BY ' + results.join(', ') : '');
	});

	sqlBuilder.registerHelper('$orderBy', function(sort/*, outerQuery, identifier*/){
		var results = helpers.sort.call(this, '$orderBy', sort);
		return (results.length > 0 ? 'ORDER BY ' + results.join(', ') : '');
	});

	sqlBuilder.registerHelper('$asc', function(asc, outerQuery, identifier){
		// $asc: true,
		if (_.isBoolean(asc)) {
			if (identifier){
				return this.quote(identifier) + (asc ? ' ASC' : '');
			} else {
				return asc ? 'ASC' : '';
			}
		} else {
			throw new Error ('$asc must be true or false.');
		}
	});

	sqlBuilder.registerHelper('$desc', function(desc, outerQuery, identifier){
		// $desc: true,
		if (_.isBoolean(desc)) {
			if (identifier){
				return this.quote(identifier) + (desc ? ' DESC' : '');
			} else {
				return desc ? 'DESC' : '';
			}
		} else {
			throw new Error ('$desc must be true or false.');
		}
	});

	sqlBuilder.registerHelper('$distinct', function(distinct/*, outerQuery, identifier*/){
		if (_.isBoolean(distinct)) {
			return distinct ? 'DISTINCT' : '';
		} else {
			throw new Error ('$distinct must be true or false.');
		}
	});
};
