'use strict';

const _ 		= require('lodash');

module.exports = function(sqlBuilder){
	// ANSI DELETE Statement Syntax
	sqlBuilder.registerSyntax('$delete', `
		DELETE FROM <$table>
			{ WHERE [$where] }
	`);

	/**
	 * @before
	 *
	 * # DELETE Statements
	 *
	 * To query the database and delete existing records you have to use the `$delete` operator.
	 * Check the Syntax and Examples.
	 *
	 * **Example**
	 * ```javascript
	 * $delete: {
	 * 	$table: 'people',
	 * 	$where: { age: { $gte: 18 } }
	 * }
	 * ```
	 *
	 * @name Delete
	 * @summary Main operator to generate an `DELETE` Statement
	 *
	 * **Syntax**
	 * ```syntax
	 * DELETE FROM <$table>
	 * 	{ WHERE [$where] }
	 * ```
	 * @isquerying true
	 * @ansi true
	 *
	 * @param query 	 {Object}		Specifies the details for the $insert
	 */
	sqlBuilder.registerHelper('$delete', function(query/*, outerQuery, identifier*/) {
		// check the type of the query, it must always be an object
		if (!_.isPlainObject(query)){
			throw new Error('$delete must always be an object.');
		}
		// set the main operator for any following helper (in this case the $into)
		this.mainOperator = '$delete';

		// perform the insert with the given syntax
		return 'DELETE FROM ' + this.build(query, null, this.getSyntax('$delete'));
	});
};
