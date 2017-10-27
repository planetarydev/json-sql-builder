'use strict';

const _ 		= require('lodash');
const helpers 	= require('./helpers');

module.exports = function(sqlBuilder){
	// ANSI SELECT Statement Syntax
	sqlBuilder.registerSyntax('$select', `SELECT [$distinct] [$all]
											 <$columns>
											{ FROM [$from] }
											{ WHERE [$where] }
											{ GROUP BY [$groupBy]
												{ HAVING [$having] }
											}
											{ ORDER BY { [$sort] | [$orderBy] } }`);

	/**
	 * @before
	 *
	 * # SELECT Statements
	 *
	 * To query the database using a select statement you have to take the `$select` operator.
	 *
	 * The minimum `$select` must supply the `$columns` operator, to specify at least one column.
	 * Optionally you can use:
	 * - $distinct
	 * - $all
	 * - $from
	 * - $where
	 * - $groupBy
	 * - $having
	 * - $sort
	 * - **and all operators from your specific language dialect**
	 *
	 * Just a short example:
	 * ```javascript
	 * $select: {
	 * 		$columns: [
	 * 			'first_name',
	 * 			{ first_name_count: { $count: '*' } }
	 * 		],
	 * 		$from: 'people',
	 * 		$groupBy: ['first_name'],
	 * 		$having: {
	 * 			$expr: { $count: '*', $gt: 2 }
	 * 		}
	 * }
	 * ```
	 *
	 * @name Select
	 * @summary Main operator to generate a SELECT Statement
	 * ```syntax
	 * SELECT [$distinct] [$all]
	 * 		<$columns>
	 * 		{ FROM [$from] }
	 * 		{ WHERE [$where] }
	 * 		{ GROUP BY [$groupBy]
	 * 			{ HAVING [$having] }
	 * 		}
	 * 		{ ORDER BY { [$sort] | [$orderBy] } }
	 * ```
	 * @isquerying true
	 * @ansi true
	 *
	 * @param expr 	 {Object}		Specifies the details for the $select
	 */
	sqlBuilder.registerHelper('$select', function(query/*, outerQuery, identifier*/) {
		var result = 'SELECT ';

		// check the type of the query, it must always be an object
		if (!_.isPlainObject(query)){
			throw new Error('$select must always be an object.');
		}

		// set the main operator for any following helper (in this case the $into)
		this.mainOperator = '$select';

		// check for $fields or $columns definition, otherwise we add '*' as columns
		if (!query.$columns){
			query.$columns = ['*'];
		}

		result += this.build(query, null, sqlBuilder.getSyntax('$select'));
		return result;
	});

	/**
	 * @name $from
	 * @summary Specifies the FROM clause for the SELECT statement
	 *
	 * @memberOf Select
	 * @isquerying true
	 * @ansi true
	 *
	 * @param value	 {String | Object}
	 * Specifies the table-identifier as string or an Object to use an alias
	 * - value is a **String** like: `$from: 'people'`
	 * - value is an **Object** like: `$from: { people: { $as: 'alias_people' } }`
	 *
	 */
	sqlBuilder.registerHelper('$from', function(table/*, outerQuery, identifier*/){
		if (_.isString(table)){
			// the table is a string like $from: 'people'
			return 'FROM ' + this.quote(table);
		} else if (_.isPlainObject(table)) {
			// table is an object like $from: { people: { $as: 'alias_people' } }
			return 'FROM ' + this.build(table);
		} else {
			throw new Error('$from expression must be either a string or object.');
		}
	});

	/**
	 * @name $columns
	 * @summary Specifies the columns for the `INSERT` and `SELECT` Statement
	 *
	 * @memberOf Select
	 * @isquerying true
	 * @ansi true
	 *
	 * @param columns	 {Array | Object}
	 * Specifies the columns as Array or Object used by §insert or $select
	 * - columns as **Array** like: `$columns: ['first_name', 'last_name']`
	 * - columns as **Object** like: `$columns: { first_name: { $as: 'alias_first_name' }, last_name: { $val: 'Always Doe' } }`
	 */
	sqlBuilder.registerHelper('$columns', function(query/*, outerQuery, identifier*/){
		var results = [];

		// add support for primitive String
		if (_.isString(query)){
			query = [query];
		}

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
			console.log(query);
			throw new Error('$columns must be either array of strings or objects.');
		}

		// output the columns with "( col1, col2, ...col-n )" when running an $insert
		if (this.mainOperator == '$insert'){
			return '(' + results.join(', ') + ')';
		}
		return results.join(', ');
	});

	/**
	 * @name $where
	 * @summary Specifies the WHERE clause for the SELECT statement
	 *
	 * @memberOf Select
	 * @isquerying true
	 * @ansi true
	 *
	 * @param where	 {Object}
	 * Specifies the WHERE clause as Object to use on the select statement
	 * - where is an **Object** like: `$where: { first_name: 'John', last_name: 'Doe' }`
	 */
	sqlBuilder.registerHelper('$where', function(where/*, outerQuery, identifier*/){
		var result = helpers.whereClause.call(this, '$where', where/*, outerQuery, identifier*/);
		return (result.length > 0 ? 'WHERE ' + result : '');
	});

	/**
	 * @name $groupBy
	 * @summary Specifies the GROUP BY clause for the SELECT statement
	 *
	 * @memberOf Select
	 * @isquerying true
	 * @ansi true
	 *
	 * @param groupBy	 {Array | Object}
	 * Specifies the GROUP BY clause as Array or Object to use on the select statement
	 * - groupBy is an **Array** like: `$groupBy: ['first_name', 'last_name']`
	 */
	sqlBuilder.registerHelper('$groupBy', function(groupBy, outerQuery, identifier){
		// the groupBy can be handeld with the columns-helper because it has the
		// same syntax and definition
		var result = sqlBuilder.callHelper('$columns', groupBy, outerQuery, identifier);
		return 'GROUP BY ' + result;
	});

	/**
	 * @name $having
	 * @summary Specifies the HAVING clause on a SELECT ... GROUP BY Statement
	 *
	 * @memberOf Select
	 * @isquerying true
	 * @ansi true
	 *
	 * @param having	 {Object}
	 * Specifies the HAVING clause as an Object
	 * - having is an **Object** like: `$having: { $expr: { $count: '*', $gt: 2 } }`
	 */
	sqlBuilder.registerHelper('$having', function(where, outerQuery, identifier){
		// the $having expression is the same as the where clause
		var result = helpers.whereClause.call(this, '$having', where, outerQuery, identifier);
		return (result.length > 0 ? 'HAVING ' + result : '');
	});

	/**
	 * @name Sorting
	 * @summary Specifies the ORDER BY clause for a statement
	 *
	 * @ishelper true
	 * @ansi true
	 *
	 * @param sort	 {String | Array | Object}
	 * Specifies the ORDER BY clause in different variations:
	 * - sort is a **String** like: `$sort: 'last_name'`
	 * - sort is an **Array** of Strings like: `$sort: ['last_name', 'first_name']`
	 * - sort is an **Array** of Objects like: `$sort: [ { last_name: 1 }, { first_name: -1 } ]`
	 * - sort is an **Array** of Objects like: `$sort: [ { last_name: 'ASC' }, { first_name: 'DESC' } ]`
	 * - sort is an **Object** like: `$sort: { last_name: 'ASC', first_name: 'DESC' }`
	 * - sort is an **Object** like: `$sort: { last_name: 1, first_name: -1 }`
	 * - sort is an **Object** like: `$sort: { last_name: { $asc: true }, first_name: { $desc: true } }`
	 */
	sqlBuilder.registerHelper('$sort', function(sort/*, outerQuery, identifier*/){
		var results = helpers.sort.call(this, '$sort', sort);
		return (results.length > 0 ? 'ORDER BY ' + results.join(', ') : '');
	});

	/**
	 * @name $orderBy
	 * @summary Specifies the ORDER BY clause for a statement
	 *
	 * This is an alias for the `$sort` operator. See [$sort](#Query-select-sort)
	 *
	 * @memberOf Sorting
	 * @ishelper true
	 * @ansi true
	 */
	sqlBuilder.registerHelper('$orderBy', function(sort/*, outerQuery, identifier*/){
		var results = helpers.sort.call(this, '$orderBy', sort);
		return (results.length > 0 ? 'ORDER BY ' + results.join(', ') : '');
	});

	/**
	 * @name $asc
	 * @summary Specifies the order direction ASC for an identifier used on ORDER BY clause
	 *
	 * @memberOf Sorting
	 * @ishelper true
	 * @ansi true
	 *
	 * @param asc	 {Boolean}
	 * Specifies the ORDER BY clause in different variations:
	 * - asc is an **Boolean** like: `$sort: { last_name: { $asc: true }, first_name: { $desc: true } }`
	 */
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

	/**
	 * @name $desc
	 * @summary Specifies the order direction DESC for an identifier used on ORDER BY clause
	 *
	 * @memberOf Sorting
	 * @ishelper true
	 * @ansi true
	 *
	 * @param asc	 {Boolean}
	 * Specifies the ORDER BY clause in different variations:
	 * - asc is an **Boolean** like: `$sort: { last_name: { $asc: true }, first_name: { $desc: true } }`
	 */
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

	/**
	 * @name $distinct
	 * @summary Specifies the DISTINCT keyword for an Statement.
	 *
	 * @memberOf Select
	 * @isquerying true
	 * @ansi true
	 *
	 * @param distinct	 {Boolean}
	 * Specifies the DISTINCT keyword:
	 * - example: `$select: { $distinct: true, $columns: [ ... ], ... }`
	 */
	sqlBuilder.registerHelper('$distinct', function(distinct/*, outerQuery, identifier*/){
		if (_.isBoolean(distinct)) {
			return distinct ? 'DISTINCT' : '';
		} else {
			throw new Error ('$distinct must be true or false.');
		}
	});
};
