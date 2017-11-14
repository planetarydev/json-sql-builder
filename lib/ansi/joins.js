'use strict';

const _ 		= require('lodash');

function joinHelper(operator, sql, join, outerQuery, identifier) {
	if (!_.isPlainObject(join)) {
		throw new Error ( operator + ' must be an Object.');
	}

	// check for an alias
	if ('$as' in outerQuery) {
		return sql + ' ' + this.quote(identifier) + ' AS ' + this.quote(outerQuery['$as']) + ' ON ' + this.build(join);
	}
	return sql + ' ' + this.quote(identifier) + ' ON ' + this.build(join);
}

module.exports = function(sqlBuilder){
	// ANSI SELECT Statement Syntax
	sqlBuilder.registerSyntax('$joins', `
		INNER JOIN [$innerJoin]
		LEFT JOIN [$leftJoin]
		RIGHT JOIN [$rightJoin]
		FULL OUTER JOIN [$fullOuterJoin]
	`);

	/**
	 * @name $joins
	 * @summary Specifies the Joins-Object for all Tables and Views to join to the current Table or View
	 *
	 * @memberOf Select
	 * @isquerying true
	 * @ansi true
	 *
	 * @param joins	 {Object}
	 * Specifies on or more Table, View as Property to join
	 *
	 * ```javascript
	 * var query = sqlbuilder.build({
	 * 	$select: {
	 * 		$from: 'people',
	 * 		$joins: {
	 * 			hobbies: { $leftJoin: { 'people.id': $eq: { $column: 'hobbies.people_id' } } },
	 * 			...
 	 * 		}
 	 * 	}
	 * });
	 * ```
	 */
	sqlBuilder.registerHelper('$joins', function(joins, outerQuery/*, identifier*/){
		if (!_.isPlainObject(joins)) {
			throw new Error ('$joins must be an Object.');
		}

		let results = [];
		_.forEach(joins, (joinCondition, tableOrView) => {
			if (_.isPlainObject(joinCondition)) {
				results.push(this.build(joinCondition, tableOrView, sqlBuilder.getSyntax('$joins')));
			} else {
				throw new Error ('$joins properties/items must be an Object.');
			}
		});

		return results.join(' ');
	});

	/**
	 * @name $leftJoin
	 * @summary Specifies the `LEFT JOIN` clause
	 *
	 * @memberOf Select.$joins
	 * @isquerying true
	 * @ansi true
	 *
	 * @param leftJoin	 {Object}
	 * Specifies the table to join using `LEFT JOIN`
	 *
	 * ```javascript
	 * var query = sqlbuilder.build({
	 * 	$select: {
	 * 		$from: 'people',
	 * 		$joins: {
	 * 			hobbies: { $leftJoin: { 'people.id': $eq: { $column: 'hobbies.people_id' } } },
	 * 			...
	 * 		}
	 * 	}
	 * });
	 * ```
	 */
	sqlBuilder.registerHelper('$leftJoin', function(join, outerQuery, identifier){
		return joinHelper.call(this, '$leftJoin', 'LEFT JOIN', join, outerQuery, identifier);
	});

	/**
	 * @name $rightJoin
	 * @summary Specifies the `RIGHT JOIN` clause
	 *
	 * @memberOf Select.$joins
	 * @isquerying true
	 * @ansi true
	 *
	 * @param rightJoin	 {Object}
	 * Specifies the table to join using `RIGHT JOIN`
	 *
	 * ```javascript
	 * var query = sqlbuilder.build({
	 * 	$select: {
	 * 		$from: 'people',
	 * 		$joins: {
	 * 			hobbies: { $leftJoin: { 'people.id': $eq: { $column: 'hobbies.people_id' } } },
	 * 			...
	 * 		}
	 * 	}
	 * });
	 * ```
	 */
	sqlBuilder.registerHelper('$rightJoin', function(join, outerQuery, identifier){
		return joinHelper.call(this, '$rightJoin', 'RIGHT JOIN', join, outerQuery, identifier);
	});

	/**
	 * @name $innerJoin
	 * @summary Specifies the `INNER JOIN` clause
	 *
	 * @memberOf Select.$joins
	 * @isquerying true
	 * @ansi true
	 *
	 * @param innerJoin	 {Object}
	 * Specifies the table to join using `INNER JOIN`
	 *
	 * ```javascript
	 * var query = sqlbuilder.build({
	 * 	$select: {
	 * 		$from: 'people',
	 * 		$joins: {
	 * 			hobbies: { $innerJoin: { 'people.id': $eq: { $column: 'hobbies.people_id' } } },
	 * 			...
	 * 		}
	 * 	}
	 * });
	 * ```
	 */
	sqlBuilder.registerHelper('$innerJoin', function(join, outerQuery, identifier){
		return joinHelper.call(this, '$innerJoin', 'INNER JOIN', join, outerQuery, identifier);
	});

	/**
	 * @name $fullOuterJoin
	 * @summary Specifies the `FULL OUTER JOIN` clause
	 *
	 * @memberOf Select.$joins
	 * @isquerying true
	 * @ansi true
	 *
	 * @param fullOuterJoin	 {Object}
	 * Specifies the table to join using `FULL OUTER JOIN`
	 *
	 * ```javascript
	 * var query = sqlbuilder.build({
	 * 	$select: {
	 * 		$from: 'people',
	 * 		$joins: {
	 * 			hobbies: { $fullOuterJoin: { 'people.id': $eq: { $column: 'hobbies.people_id' } } },
	 * 			...
	 * 		}
	 * 	}
	 * });
	 * ```
	 */
	sqlBuilder.registerHelper('$fullOuterJoin', function(join, outerQuery, identifier){
		return joinHelper.call(this, '$fullOuterJoin', 'FULL OUTER JOIN', join, outerQuery, identifier);
	});
};
