'use strict';

const _ 		= require('lodash');

function unionHelper(operatorSqlText, operatorName, union){
	// check the type of the query, it must always be an object
	if (!_.isArray(union)){
		throw new Error(operatorName + ' must always be an Array.');
	}
	// set the main operator for any following helper (in this case the $into)
	this.mainOperator = operatorName;

	var results = [];
	_.forEach(union, (selectStmt) => {
		var query;

		if (!_.isPlainObject(selectStmt)){
			throw new Error('Using ' + operatorName + ' - all items of the Array must be type of Object->$select.')
		}

		if (operatorName == '$unionAllEx') {
			query = { $select: selectStmt }
		}
		results.push(this.build(query || selectStmt, null, null, false/*strip most outer parentheses*/));
	});

	// join with ' UNION ' or ' UNION ALL '
	return '(' + results.join(operatorSqlText) + ')';
}

module.exports = function(sqlBuilder){
	/**
	 * @after
	 *
	 * # UNION SELECT Statements
	 *
	 * To create a query using the `UNION` clause you have to use the `$union` operator and define an Array of $select-Objects.
	 * Check the Syntax and Examples.
	 *
	 * **Example**
	 * ```javascript
	 * var query = sqlbuilder.build({
	 * 	$union: [{
	 * 		$select: {
	 * 			$from: 'people',
	 * 			$columns: ['first_name', 'last_name'],
	 * 			$where: { id: 1 }
	 * 		}}, {
	 * 		$select: {
	 * 			$from: 'people_history',
	 * 			$columns: ['first_name', 'last_name'],
	 * 			$where: { id: 1 }
	 *		}
	 *	}]
	 * });
	 * ```
	 *
	 * @name $union
	 * @summary Main operator to generate an `UNION SELECT` Statement
	 * @memberOf Select
	 * @isquerying true
	 * @ansi true
	 *
	 * @param union 	 {Array}		Specifies the all $select objects
	 */
	sqlBuilder.registerHelper('$union', function(union/*, outerQuery, identifier*/) {
		return unionHelper.call(this, ') UNION (', '$union', union);
	});

	/**
	 * @after
	 *
	 * # Using `$unionAll`
	 *
	 * **Example**
	 * ```javascript
	 * var query = sqlbuilder.build({
	 * 	$unionAll: [
	 * 		{ $select: {
	 * 			$from: 'people',
	 * 			$columns: ['first_name', 'last_name'],
	 * 			$where: { id: 1 }
	 * 		}},
	 * 		{ $select: {
	 * 			$from: 'people_history',
	 * 			$columns: ['first_name', 'last_name'],
	 * 			$where: { id: 1 }
	 *		}}
	 *	]
	 * });
	 * ```
	 * @name $unionAll
	 * @summary Main operator to generate an `UNION ALL SELECT` Statement
	 * @memberOf Select
	 * @isquerying true
	 * @ansi true
	 *
	 * @param unionAll 	 {Array}		Specifies the Array of $select objects
	 */
	sqlBuilder.registerHelper('$unionAll', function(union/*, outerQuery, identifier*/) {
		return unionHelper.call(this, ') UNION ALL (', '$unionAll', union);
	});

	/**
	 * @after
	 *
	 * # Using `$unionAllEx`
	 *
	 * **Example**
	 * ```javascript
	 * var query = sqlbuilder.build({
	 * 	$unionAllEx: [{
	 * 			$from: 'people',
	 * 			$columns: ['first_name', 'last_name'],
	 * 			$where: { id: 1 }
	 * 		}, {
	 * 			$from: 'people_history',
	 * 			$columns: ['first_name', 'last_name'],
	 * 			$where: { id: 1 }
	 * 		}
	 *	]
	 * });
	 * ```
	 * @name $unionAllEx
	 * @summary Same as `$unionAll`, but you don't have to specifiy the `$select` operator - only inner part.
	 * This will help you to reduce the complex of the query-structure.
	 * @memberOf Select
	 * @isquerying true
	 * @ansi true
	 *
	 * @param unionAllEx 	 {Array}		Specifies the Array of `$select` operators. **ONLY the inner part of the `$select` operator**
	 */
	sqlBuilder.registerHelper('$unionAllEx', function(union/*, outerQuery, identifier*/) {
		return unionHelper.call(this, ') UNION ALL (', '$unionAllEx', union);
	});

};
