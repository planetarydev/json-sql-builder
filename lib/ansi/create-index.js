'use strict';

const _ 		= require('lodash');

module.exports = function(sqlBuilder){
	// ANSI CREATE TABLE Statement Syntax
	sqlBuilder.registerSyntax('$createIndex', `
		CREATE { UNIQUE [$unique] } INDEX { IF NOT EXISTS [$ine] } <$index>
			ON <$table> { USING [$using] } (
				<$columns>
		);
	`);

	/**
	 * @before
	 *
	 * # CREATE INDEX Statements
	 *
	 * To create a new Index in the database you have to use the `$create` operator.
	 * Check the Syntax and Examples.
	 *
	 * **Example**
	 * ```javascript
	 * $create: {
	 * 	$index: 'idx_last_name',
	 * 	$table: 'people',
	 * 	$columns: {
	 * 		last_name: { $asc: true },
	 * 		first_name: { $asc: true }
	 * 	},
	 * 	$using: 'btree'
	 * }
	 * ```
	 *
	 * @name CreateIndex
	 * @summary Main operator to generate an `CREATE INDEX` Statement
	 *
	 * **Syntax**
	 * ```syntax
	 * CREATE { UNIQUE [$unique] } INDEX { IF NOT EXISTS [$ine] } <$index>
	 * 	ON <$table> { USING [$using] } ( <$columns> );
	 * ```
	 * @isddl true
	 * @ansi true
	 *
	 * @param query 	 {Object}		Specifies the details of the $create operator
	 */
	//sqlBuilder.registerHelper('$create', function(query/*, outerQuery, identifier*/) {
	// XXX this Operator is located at "ansi/create-table.js"
	//});

	/**
	 * @name $index
	 * @summary Specifies the name of the Index for the `CREATE INDEX` Statement
	 *
	 * @memberOf CreateIndex
	 * @isddl true
	 * @ansi true
	 *
	 * @param index	 {String}
	 * Specifies the Name of the Index.
	 */
	sqlBuilder.registerHelper('$index', function(index, outerQuery, identifier){
		if (_.isString(index)){
			if (this.mainOperator == '$createIndex') {
				return 'INDEX ' + this.quote(index);
			}
			// the index is a string like $index: 'idx_people'
			return this.quote(index);
		} else if (_.isPlainObject(index)) {
			// index is an object like $create: { $index: { $ine: 'idx_people' } }
			if (this.mainOperator == '$createIndex') {
				return 'INDEX ' + this.build(index);
			}
			return this.build(index);
		} else {
			throw new Error('$index must be either a string or object.');
		}
	});

	/**
	 * @name $using
	 * @summary Specifies the `USING` option for the `CREATE INDEX` statement.
	 *
	 * @memberOf CreateIndex
	 * @isddl true
	 * @ansi true
	 *
	 * @param value	 {Boolean}
	 * Specifies the name of the index method to be used. Choices are btree or hash. (additionally for PostgreSQL: gist, spgist, gin, and brin)
	 *
	 * **Example**
	 *
	 * ```javascript
	 * $create: {
	 * 	$index: 'idx_people',
	 * 	$using: 'btree',
	 * 	...
	 * }
	 * ```
	 */
	sqlBuilder.registerHelper('$using', function(query/*, outerQuery, identifier*/) {
		if (!_.isString(query)){
			throw new Error('$using must always be a String.');
		}
		return 'USING ' + query;
	});

};
