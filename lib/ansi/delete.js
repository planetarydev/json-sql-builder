'use strict';

const _ 		= require('lodash');

module.exports = function(sqlBuilder){
	// ANSI DELETE Statement Syntax
	sqlBuilder.registerSyntax('$delete', {
		description: 'Specifies the operator for the `DELETE` Statement.',
		supportedBy: {
			mysql: 'https://dev.mysql.com/doc/refman/5.7/en/delete.html',
			postgreSQL: 'https://www.postgresql.org/docs/9.5/static/sql-delete.html',
			sqlite: 'https://sqlite.org/lang_delete.html'
		},
		definition: {
			allowedTypes: {
	 			Object: {
					syntax:
`DELETE FROM <$table>
	{ WHERE [$where]}
	{ ORDER BY [$sort] | [$orderBy]}-->(mysql)
	{ LIMIT [$limit]}-->(mysql)`
				}
			}
 		},
		examples: {
			Object: {
				basicUsage: {
					test: {
						$delete: {
							$table: 'people',
							$where: {
								people_id: 4524
							}
						}
					},
					expectedResult: {
						sql: 'DELETE FROM people WHERE people_id = $1',
						values: {
							$1: 4524
						}
					}
				}
			}
		}

	});

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
 	/*sqlBuilder.registerHelper('$delete', function(query, outerQuery, identifier) {
		// check the type of the query, it must always be an object
		if (!_.isPlainObject(query)){
			throw new Error('$delete must always be an object.');
		}
		// set the main operator for any following helper
		this.mainOperator = '$delete';

		// perform the insert with the given syntax
		return 'DELETE FROM ' + this.build(query, null, this.getSyntax('$delete'));
	});*/
};
