'use strict';

const _ 		= require('lodash');

module.exports = function(sqlBuilder){
	/**
	 * @name Insert
	 * @summary MySQL operator to generate an `INSERT INTO` Statement with additional support for:
	 * - `ON DUPLICATE KEY`
	 *
	 * **Syntax** using `$columns` and `$values` Helper
	 * ```syntax
	 * INSERT { INTO <$into> } (
	 * 	<$columns>
	 * )
	 * { VALUES ( [$values] ) }
	 * { SELECT [$select] }
	 * [$onDuplicateKey]
	 *
	 * ```
	 *
	 * **Syntax** using `$documents` - a more mongo like way
	 * ```syntax
	 * INSERT { INTO <$into> } <$documents> [$onDuplicateKey]
	 * ```
	 * @isquerying true
	 * @mysql true
	 *
	 * @param query 	 {Object}		Specifies the details for the $insert
	 */
	/*sqlBuilder.updateSyntax('$insertWithColsAndVals', `
		INSERT { INTO <$into> } (
			<$columns>
		)
		{ VALUES ( [$values] ) }
		{ SELECT [$select] }
		[$onDuplicateKeyUpdate]
	`);

	sqlBuilder.updateSyntax('$insertWithDocuments', `
		INSERT { INTO <$into> } <$documents> [$onDuplicateKeyUpdate]
	`);*/

	/**
	 * @name $values
	 * @summary Specifies the `VALUES` function for the `INSERT INTO` Statement on using the `ON DUPLICATE KEY UPDATE` clause.
	 * @memberOf Insert.$onDuplicateKeyUpdate
	 * @isquerying true
	 * @mysql true
	 *
	 * @param values 	 {String}
	 * Using `$values` on the $onDuplicateKeyUpdate is must be a string. Otherwise it's an Array.
	 * `$insert: { ... $onDuplicateKeyUpdate:{ last_name: { $values: 'last_name' } } ... }`
	 */
 	/*sqlBuilder.registerHelper('$values', function(values, outerQuery, identifier){
		// check if we are in the $onDuplicateKeyUpdate path
		if (this.mainOperator == '$insert' && this.isCurrent('$onDuplicateKeyUpdate')) {
			// check values - on dup key it must be an String
			if (_.isString(values)){
				return 'VALUES(' + this.quote(values) + ')';
			} else {
				throw new Error('Using $values on $onDuplicateKeyUpdate - $values must be a String.')
			}
		} else {
			// call the ANSI standard
			return this.callHelper('ansi->$values', values);
		}
	});*/
	sqlBuilder.registerSyntax('$into', {
		description: 'Specifies the `INTO` clause Helper for the `SELECT` Statement.',
		supportedBy: {
			mysql: 'https://dev.mysql.com/doc/refman/5.7/en/select.html',
		},
		definition: {
			allowedTypes: {
	 			Array: {
					eachItemOf: {
						String: { syntax: '<value-ident>[ , ... ]' },
					},
				},
				String: { syntax: '<value-ident>' },
			},
			belongsTo: {
				$select: true
			},
			dependsOn: {
				$select: true
			}
 		},
		examples: {
			Array: {
				eachItemOf: {
					String: {
						basicUsage: {
							test: {
								$select: {
									people_id: 1,
									first_name: 1,
									last_name: 1,
									$into: ['@people_id', '@first_name', '@last_name'],
									$from: 'people'
								}
							},
							expectedResult: {
								sql: 'SELECT people_id, first_name, last_name INTO @people_id, @first_name, @last_name FROM people'
							}
						}
					}
				} // eachItemOf
			}, // Object
			String: {
				basicUsage: {
					test: {
						$select: {
							first_name: 1, $into: '@first_name',
							$from: 'people'
						}
					},
					expectedResult: {
						sql: 'SELECT first_name INTO @first_name FROM people'
					}
				}
			}
		}
 	});

	/**
	 * @name $onDuplicateKeyUpdate
	 * @summary Specifies the `ON DUPLICATE KEY UPDATE` option for the `INSERT` Statement.
	 * @memberOf Insert
	 * @isquerying true
	 * @mysql true
	 *
	 * @param onDuplicateKeyUpdate 	 {Object} Specifies the update clause on duplicate-key-entry
	 * ```
	 * $insert: {
	 * 	$into: 'people',
	 * 	$values: {
	 * 		first_name: 'John',
	 * 		last_name: 'Doe',
	 * 	},
	 * 	$onDuplicateKeyUpdate: {
	 * 		first_name: 'John',
	 * 		last_name: { $values: 'last_name' }
	 * }
	 * ```
	 */
	sqlBuilder.registerHelper('$onDuplicateKeyUpdate', function(onDuplicateKeyUpdate/*, outerQuery, identifier*/) {
		// set is always an object
		if (!_.isPlainObject(onDuplicateKeyUpdate)){
			throw new Error('$onDuplicateKeyUpdate must be an Object.');
		}

		var results = [];
		_.forEach(onDuplicateKeyUpdate, (value, key) => {
			if (_.isPlainObject(value)) {
				results.push( this.quote(key) + ' = ' + this.build(value, key) );
			} else {
				results.push( this.quote(key) + ' = ' + this.addValue(value) );
			}
		});

		// V2 return 'ON DUPLICATE KEY UPDATE ' + results.join(', ');
		return results.join(', ');
	});

};
