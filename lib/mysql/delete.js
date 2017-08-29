'use strict';

const _ 		= require('lodash');

module.exports = function(sqlBuilder){
	/**
	 * @name Delete
	 * @summary MySQL operator to generate an `DELETE` Statement.
	 *
	 * **Syntax** using `$columns` and `$values` Helper
	 * ```syntax
	 * DELETE FROM <$table>
	 * 	{ WHERE [$where] }
	 * 	{ ORDER BY [$sort] | [$orderBy] }
	 * 	{ LIMIT [$limit] }
	 * ```
	 * @isquerying true
	 * @mysql true
	 *
	 * @param query 	 {Object}		Specifies the details for the $insert
	 */
	sqlBuilder.updateSyntax('$delete', `
		DELETE FROM <$table>
			{ WHERE [$where] }
			{ ORDER BY [$sort] | [$orderBy] }
			{ LIMIT [$limit] }
	`);
};
