'use strict';

const _ 		= require('lodash');

module.exports = function(sqlBuilder){
	// Update the ANSI INSERT Statement Syntax
	// and add the ON CONFLICT option
	/*V2 sqlBuilder.updateSyntax('$insertWithColsAndVals', `
		INSERT { INTO <$into> } (
			<$columns>
		)
		{ VALUES ( [$values] ) }
		{ SELECT [$select] }
		{ ON CONFLICT [$conConflict] }
	`);*/

	/* V2 sqlBuilder.updateSyntax('$insertWithDocuments', `
		INSERT { INTO <$into> } <$documents> { ON CONFLICT [$conflict] }
	`);*/

	sqlBuilder.registerSyntax('$conflict', {
		description: 'Specifies the `ON CONFLICT` clause for the `INSERT` Statement.',
		supportedBy: {
			postgreSQL: 'https://www.postgresql.org/docs/9.5/static/sql-insert.html#SQL-ON-CONFLICT',
		},
		definition: {
			allowedTypes: {
				Object: {
					syntax:
`{([$checkColumns])} | {ON CONSTRAINT [$checkConstraint]}
	{ DO [$doNothing]}
	{ DO [$doUpdate]}`
				}
			}
		},
		examples: {
			Object: {
				basicUsage: {
					test: {
						$insert: {
							$table: 'people',
							$documents: {
								first_name: 'John',
								last_name: 'Doe',
								age: 27
							},
							$conflict: {
								$checkColumns: ['first_name', 'last_name'],
								$doNothing: true,
							}
						}
					},
					expectedResult: {
						sql: 'INSERT INTO people (first_name, last_name, age) VALUES ($1, $2, $3) ON CONFLICT (first_name, last_name) DO NOTHING',
						values: {
							$1: 'John',
							$2: 'Doe',
							$3: 27
						}
					}
				}
			}
		}
	});



	/**
	 * @name $conflict
	 * @summary Specifies the `ON CONFLICT` clause
	 *
	 * ```syntax
 	 * ON CONFLICT { ( [$checkColumns] ) } | { ON CONSTRAINT [$checkConstraint] }
 	 * 		{ DO [$doNothing] }
 	 * 		{ DO [$doUpdate] }
 	 * ```
	 *
	 * @memberOf Insert
	 * @isquerying true
	 * @postgres true
	 *
	 * @param conflict 	{Object}		Specifies the conflict clause
	 *
	 * ```javascript
	 * var outputQuery = sqlbuilder.build({
	 * 	$insert: {
	 * 		$into: 'people',
	 * 		// $documents as single/plain Object
	 * 		$documents: {
	 * 			first_name: 'John',
	 * 			last_name: 'Doe',
	 * 			age: 45
	 * 		},
	 * 		$conflict: {
	 * 			$checkColumns: 'myUniqueField', // or as Array of Strings ['myUniqueField_1', 'myUniqueField_2']
	 * 			$doNothing: true // or $doUpdate: { ... }
	 *		}
	 * 	}
	 *
	 * // using $doUpdatea dn set new values:
	 * var outputQuery = sqlbuilder.build({
	 * 	$insert: {
	 * 		$into: 'people',
	 * 		// $documents as single/plain Object
	 * 		$documents: {
	 * 			first_name: 'John',
	 * 			last_name: 'Doe',
	 * 			age: 45
	 * 		},
	 * 		$conflict: {
	 * 			$checkColumns: 'myUniqueField', // or as Array of Strings ['myUniqueField_1', 'myUniqueField_2']
	 * 			$doUpdate: {
	 * 				first_name: 'J.',
	 * 				last_name: 'Doe',
	 * 				age: 57
	 * 			}
	 *		}
	 * 	}
	 * });
	 * ```
	 *
	 */
 	/*sqlBuilder.registerHelper('$conflict', function(onConflict, outerQuery, identifier){
		// check the type of the query, it must always be an object
		if (!_.isPlainObject(onConflict)){
			throw new Error('$conflict must always be an Object.');
		}
		// perform the conflict with the given syntax
		return 'ON CONFLICT ' + this.build(onConflict, null, this.getSyntax('$conflict'));
	});*/

	/**
	 * @name $checkColumns
	 * @summary Specifies the columns tho check for a unique key violation by using `ON CONFLICT` clause
	 * @memberOf Insert.$conflict
	 * @isquerying true
	 * @postgres true
	 *
	 * @param checkColumns 	{String | Array}		Specifies the Columns to check
 	 */
	sqlBuilder.registerHelper('$checkColumns', function(checkColumns, outerQuery, identifier){
		// we can use the $columns helper to define the results
		try {
			return sqlBuilder.callHelper('$columns', checkColumns, outerQuery, identifier);
		} catch (e) {
			throw new Error('Error on using $checkColumns. Details: ' + e.message);
		}
	});

	/**
	 * @name $checkConstraint
	 * @summary Specifies the constraint name tho check for a unique key by using `ON CONFLICT` clause
	 * @memberOf Insert.$conflict
	 * @isquerying true
	 * @postgres true
	 *
	 * @param checkConstraint 	{String}		Specifies the Name of the Constraint
 	 */
	sqlBuilder.registerHelper('$checkConstraint', function(checkConstraint/*, outerQuery, identifier*/){
		// check the type of the query, it must always be an object
		if (!_.isString(checkConstraint)){
			throw new Error('$checkConstraint must always be a String.');
		}
		// V2 return 'ON CONSTRAINT ' + this.quote(checkConstraint);
		return '' + this.quote(checkConstraint);
	});

	/**
	 * @name $doNothing
	 * @summary Specifies the `DO NOTHING` option while using `ON CONFLICT` clause
	 * @memberOf Insert.$conflict
	 * @isquerying true
	 * @postgres true
	 *
	 * @param doNothing 	{String}		Must always set to `true`.
 	 */
	sqlBuilder.registerHelper('$doNothing', function(doNothing/*, outerQuery, identifier*/){
		// check the type of the query, it must always be an object
		if (!_.isBoolean(doNothing) && doNothing !== true){
			throw new Error('$doNothing must always be an Boolean and set to true.');
		}
		return 'NOTHING'; //'DO NOTHING';
	});

	/**
	 * @name $doUpdate
	 * @summary Specifies the `DO UPDATE` option while using `ON CONFLICT` clause
	 * @memberOf Insert.$conflict
	 * @isquerying true
	 * @postgres true
	 *
	 * @param doUpdate 	{String}		Specifies the Update-Part of the conflict handling.
 	 */
	sqlBuilder.registerHelper('$doUpdate', function(doUpdate, outerQuery, identifier){
		// check the type of the query, it must always be an object
		if (!_.isPlainObject(doUpdate)){
			throw new Error('$doUpdate must always be an Object.');
		}
		try {
			// V2 return 'DO UPDATE ' + sqlBuilder.callHelper('$set', doUpdate, outerQuery, identifier);
			return 'UPDATE SET ' + sqlBuilder.callHelper('$set', doUpdate, outerQuery, identifier);
		} catch (e) {
			throw new Error('Error on using $doUpdate. Details: ' + e.message);
		}
	});
};
