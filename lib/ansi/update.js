'use strict';

const _ 		= require('lodash');

module.exports = function(sqlBuilder){
	// ANSI UPDATE Statement Syntax
	/*sqlBuilder.registerSyntax('$update', `
		UPDATE <$table>
			{ SET <$set> }
			{ WHERE [$where] }
			{ ORDER BY [$sort] | [$orderBy] }
	`);*/

	sqlBuilder.registerSyntax('$update', {
		description: 'Specifies the operator for the `UPDATE` Statement.',
		supportedBy: {
			mysql: 'https://dev.mysql.com/doc/refman/5.7/en/update.html',
			postgreSQL: 'https://www.postgresql.org/docs/9.5/static/sql-update.html',
			sqlite: 'https://sqlite.org/lang_update.html'
		},
		definition: {
			allowedTypes: {
				Object: {
					syntax:
`UPDATE <$table>
	{ SET <$set>}
	{ WHERE [$where]}
	{ ORDER BY [$sort] | [$orderBy]}`
				}
			}
		},
		examples: {
			Object: {
				basicUsage: {
					test: {
						$update: {
							$table: 'people',
							$set: {
								first_name: 'Jane'
							},
							$where: {
								people_id: 4524
							}
						}
					},
					expectedResult: {
						sql: 'UPDATE people SET first_name = $1 WHERE people_id = $2',
						values: {
							$1: 'Jane',
							$2: 4524
						}
					}
				}
			}
		}

	});
	/**
	 * @before
	 *
	 * # UPDATE Statements
	 *
	 * To query the database and update existing records you have to use the `$update` operator.
	 * Check the Syntax and Examples.
	 *
	 * **Example**
	 * ```javascript
	 * $update: {
	 * 	$table: 'people',
	 * 	$set: {
	 * 		first_name: 'John',
	 * 		last_name: 'Doe',
	 * 	},
	 * 	$where: { age: { $gte: 18 } }
	 * }
	 * ```
	 *
	 * @name Update
	 * @summary Main operator to generate an `UPDATE` Statement
	 *
	 * **Syntax**
	 * ```syntax
	 * UPDATE <$table>
	 * 	{ SET <$set> }
	 * 	{ WHERE [$where] }
	 * 	{ ORDER BY [$sort] | [$orderBy] }
	 * ```
	 * @isquerying true
	 * @ansi true
	 *
	 * @param query 	 {Object}		Specifies the details for the $insert
	 */
 	/*sqlBuilder.registerHelper('$update', function(query, outerQuery, identifier) {
		// check the type of the query, it must always be an object
		if (!_.isPlainObject(query)){
			throw new Error('$update must always be an object.');
		}
		// set the main operator for any following helper (in this case the $into)
		this.mainOperator = '$update';

		// perform the insert with the given syntax
		return 'UPDATE ' + this.build(query, null, this.getSyntax('$update'));
	});*/

	/**
	 * @name $set
	 * @summary Specifies the `SET` part for the `UPDATE` Statement.
	 * @memberOf Update
	 * @isquerying true
	 * @ansi true
	 *
	 * @param set 	 {Object}
	 * ```
	 * $update: {
	 * 	$table: 'people',
	 * 	$set: {
	 * 		first_name: 'John',
	 * 		last_name: 'Doe',
	 * 	},
	 * 	$where: { age: { $gte: 18 } }
	 * }
	 * ```
	 */
	sqlBuilder.registerHelper('$set', function(set/*, outerQuery, identifier*/) {
		// set is always an object
		if (!_.isPlainObject(set)){
			throw new Error('$set must be an Object.');
		}

		var results = [];
		_.forEach(set, (value, key) => {
			if (_.isPlainObject(value)) {
				results.push( this.quote(key) + ' = ' + this.build(value, key) );
			} else {
				results.push( this.quote(key) + ' = ' + this.addValue(value) );
			}
		});

		// V2 return 'SET ' + results.join(', ');
		return '' + results.join(', ');
	});

};
