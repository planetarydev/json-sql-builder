'use strict';

const _ 		= require('lodash');

module.exports = function(sqlBuilder){
	// ANSI INSERT Statement Syntax
/* V2
	sqlBuilder.registerSyntax('$insertWithColsAndVals', `
		INSERT { INTO <$into> } (
			<$columns>
		)
		{ VALUES ( [$values] ) }
		{ SELECT [$select] }
	`);

	sqlBuilder.registerSyntax('$insertWithDocuments', `
		INSERT { INTO <$into> } <$documents>
	`);
*/
	sqlBuilder.registerSyntax('$insert', {
		description: 'Specifies the main operator for the `INSERT` Statement.',
		supportedBy: {
			mysql: 'https://dev.mysql.com/doc/refman/5.7/en/insert.html',
			postgreSQL: 'https://www.postgresql.org/docs/9.5/static/sql-insert.html',
			sqlite: 'https://sqlite.org/lang_insert.html'
		},
		definition: {
			allowedTypes: {
	 			Object: {
					syntax:
`INSERT INTO <$table> { ([$columns])} { VALUES [$values]} | {*[$documents]*}
	{ [$select]}
	{ ON DUPLICATE KEY UPDATE [$onDuplicateKeyUpdate]}-->(mysql)
	{ ON CONFLICT [$conflict]}-->(postgreSQL)`
				}
			}
		},
		examples: {
			Object: {
				basicUsage: {
					test: {
						$insert: {
							$table: 'people',
							$columns: ['first_name', 'last_name', 'age'],
							$values: ['John', 'Doe', 27]
						}
					},
					expectedResult: {
						sql: 'INSERT INTO people (first_name, last_name, age) VALUES ($1, $2, $3)',
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

	//sqlBuilder.registerSyntax('$insertWithDocuments', `
	//	INSERT { INTO <$table> } <$documents>
	//`);

	/**
	 * @before
	 *
	 * # INSERT Statements
	 *
	 * To query the database and inserting new rows to a table you have to take the `$insert` operator.
	 * This operator could be used in different ways. Check the Syntax and Examples.
	 *
	 * **Example**
	 * ```javascript
	 * $insert: {
	 * 	$into: 'people',
	 * 	$columns: ['first_name', 'last_name', 'age']
	 * 	$values: ['John', 'Doe', 45]
	 * }
	 * ```
	 *
	 * @name Insert
	 * @summary Main operator to generate an `INSERT INTO` Statement
	 *
	 * **Syntax** using `$columns` and `$values` Helper
	 * ```syntax
	 * INSERT { INTO <$into> } (
	 * 	<$columns>
	 * )
	 * { VALUES ( [$values] ) }
	 * { SELECT [$select] }
	 * );
	 * ```
	 *
	 * **Syntax** using `$documents` - a more mongo like way
	 * ```syntax
	 * INSERT { INTO <$into> } <$documents>
	 * ```
	 * @isquerying true
	 * @ansi true
	 *
	 * @param query 	 {Object}		Specifies the details for the $insert
	 */
 	/*sqlBuilder.registerHelper('$insert', function(query, outerQuery, identifier) {
		// check the type of the query, it must always be an object
		if (!_.isPlainObject(query)){
			throw new Error('$insert must always be an object.');
		}
		// set the main operator for any following helper (in this case the $into)
		this.mainOperator = '$insert';

		// check the query to choose the right Syntax
		if ('$documents' in query) {
			// perform the insert with the given syntax
			return 'INSERT ' + this.build(query, null, this.getSyntax('$insertWithDocuments'));
		} else {
			// perform the insert with the given syntax
			return 'INSERT ' + this.build(query, null, this.getSyntax('$insertWithColsAndVals'));
		}
	});*/

	/**
	 * @name $into
	 * @summary Specifies the table-identifier for the `INSERT INTO` Statement
	 * @memberOf Insert
	 * @isquerying true
	 * @ansi true
	 *
	 * @param into 	 {String}		Specifies the table-identifier by using the $insert-operator.
	 * `$insert: { $into: 'people', $columns: [...], $values: [...] }`
	 */
	/*sqlBuilder.registerHelper('$into', function(query, outerQuery, identifier){
		// $into is replaced by table using the $insert operator
		if (this.mainOperator == '$insert') {
			// $into: people  --> in this case the string will be the table
			if (_.isString(query)) {
				return 'INTO ' + this.quote(query);
			} else {
				throw new Error('Using the operator $insert->$into the $into must be type of String.');
			}
		} else {
			throw new Error('Using the operator $into it is only allowed for $insert.');
		}
	});*/

	/**
	 * @name $values
	 * @summary Specifies the `VALUES` for the `INSERT INTO` Statement
	 * @memberOf Insert
	 * @isquerying true
	 * @ansi true
	 *
	 * @param values 	 {Array}		Specifies the VALUES by using the $insert-operator.
	 * `$insert: { $into: 'people', $columns: ['first_name', 'last_name', 'age'], $values: ['John', 'Doe', 45] }`
	 */
 	/*sqlBuilder.registerHelper('$values', function(values, outerQuery, identifier){
		// check the primary-type of the query
		if (this.mainOperator == '$insert') {
			// check the type of the values
			if (_.isArray(values)) {
				var results = [];

				_.forEach(values, (value) => {
					if (_.isPlainObject(value)){
						results.push(this.build(value));
					} else {
						// any primitive -> add the value to the results
						// $values: ['John', 'Doe', 45]
						results.push(this.addValue(value));
					}
				});

				return 'VALUES (' + results.join(', ') + ')';
			} else {
				throw new Error('$values must be type of Array.');
			}
		} else {
			throw new Error('Using $values is only allowed for $insert.');
		}
	});*/
	sqlBuilder.registerSyntax('$values', {
		description: 'Specifies the values as Helper for the `VALUES` clause on the `INSERT` Statement.',
		supportedBy: {
			mysql: 'https://dev.mysql.com/doc/refman/5.7/en/insert.html',
			postgreSQL: 'https://www.postgresql.org/docs/9.5/static/sql-insert.html',
			sqlite: 'https://sqlite.org/lang_insert.html'
		},
		hooks: {
			afterExecute: function(result) {
				if (!result.startsWith('(')) {
					result = '(' + result + ')';
				}

				if (this.isCurrent('$onDuplicateKeyUpdate')) {
					result = 'VALUES' + result;
				}
				return result;
			}
		},
		definition: {
			allowedTypes: {
				Object: {
					eachItemOf: {
						Object: { syntax: '<value>[ , ... ]', delegatedSyntax: '<$values>' }
					}
				},
	 			Array: { syntax: '<value-param>[ , ... ]' },
				String: { syntax: '<value-param>' }
			}
		},
		examples: {
			Object: {
				eachItemOf: {
					Object: {
						basicUsage: {
							test: {
								$insert: {
									$table: 'people',
									$columns: ['first_name', 'last_name', 'age'],
									$values: {
										1: { $values: ['John', 'Doe', 27] },
										2: { $values: ['Jane', 'Doe', 29] },
										3: { $values: ['Michael', 'Goodman', 65] },
									}
								}
							},
							expectedResult: {
								sql: 'INSERT INTO people (first_name, last_name, age) VALUES ($1, $2, $3), ($4, $5, $6), ($7, $8, $9)',
								values: {
									$1: 'John',
									$2: 'Doe',
									$3: 27,
									$4: 'Jane',
									$5: 'Doe',
									$6: 29,
									$7: 'Michael',
									$8: 'Goodman',
									$9: 65,
								}
							}
						}
					}
				}
			},
			Array: {
				basicUsage: {
					test: {
						$insert: {
							$table: 'people',
							$columns: ['first_name', 'last_name', 'age'],
							$values: ['John', 'Doe', 27]
						}
					},
					expectedResult: {
						sql: 'INSERT INTO people (first_name, last_name, age) VALUES ($1, $2, $3)',
						values: {
							$1: 'John',
							$2: 'Doe',
							$3: 27
						}
					}
				}
			},
			String: {
				basicUsage: {
					test: {
						$insert: {
							$table: 'people',
							$columns: ['first_name'],
							$values: 'John'
						}
					},
					expectedResult: {
						sql: 'INSERT INTO people (first_name) VALUES ($1)',
						values: {
							$1: 'John'
						}
					}
				},
				"Using $values on DUPLICATE KEY clause": {
					supportedBy: {
						mysql: true
					},
					test: {
						$insert: {
							$table: 'people',
							$columns: ['first_name', 'last_name', 'age'],
							$values: ['John', 'Doe', 45],
							$onDuplicateKeyUpdate: {
								first_name: 'John-Duplicated',
								last_name: { $values: '~~last_name' },
								age: { $inc: 1 }
							}
						}
					},
					expectedResult: {
						sql: 'INSERT INTO people (first_name, last_name, age) VALUES ($1, $2, $3) ON DUPLICATE KEY UPDATE first_name = $4, last_name = VALUES(last_name), age = age + $5',
						values: {
							$1: 'John',
							$2: 'Doe',
							$3: 45,
							$4: 'John-Duplicated',
							$5: 1
						}
					}
				}
			}
		}
	});

	/**
	 * @name $documents
	 * @summary Specifies the columns and `VALUES` for the `INSERT INTO` Statement
	 * @memberOf Insert
	 * @isquerying true
	 * @ansi true
	 *
	 * @param documents 	{Object | Array}		Specifies the columns and `VALUES` by using the $insert-operator.
	 * - documents as **Object**: `{ $into: 'people', $documents: { first_name: 'John', last_name: 'Doe', age: 45 } }`
	 * - documents as **Array**: `{ $into: 'people', $documents: [ { first_name: 'John', last_name: 'Doe', age: 45 }, { first_name: 'Jasmin', last_name: 'Dan', age: 32 } ] }`
	 *
	 * @after
	 *
	 * # Examples using `$documents`
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
	 * 		}
	 * 	}
	 * });
	 * ```
	 *
	 * If you would insert more than one record you can pass an Array of Objects instead of a single Object.
	 *
	 * The properties for all objactes have to be the same.
	 * For the INSERT statement only the properties of the first Array-item will be checked and processed as column-identifiers.
	 *
	 * ```javascript
	 * var outputQuery = sqlbuilder.build({
	 * 	$insert: {
	 * 		$into: 'people',
	 * 		// $documents as Array of Objects
	 * 		$documents: [
	 * 			{ first_name: 'John', last_name: 'Doe', age: 45	},
	 * 			{ first_name: 'Mike', last_name: 'Oldfield', age: 67 },
	 * 			{ first_name: 'Jane', last_name: 'Dan',	age: 32	}
	 *		 ]
	 * 	}
	 * });
	 *
	 * ```
	 */
 	/*sqlBuilder.registerHelper('$documents', function(documents, outerQuery, identifier){
		var self = this;
		var getColumns = function(doc){
			var cols = [];
			// iterate the docs properties and return the as Array of string
			_.forEach(doc, function(value, key){
				if (!_.isPlainObject(value)){
					cols.push(self.quote(key));
				}
			});
			return cols;
		}
		var getValues = (doc) => {
			var vals = [];
			// iterate the docs properties and return the as Array of string
			_.forEach(doc, function(value, key) {
				vals.push(value);
			});
			return vals;
		}

		// check the primary-type of the query
		if (this.mainOperator == '$insert') {
			// check the type of the values
			if (_.isPlainObject(documents)) {
				// Example:
				// $insert: {
				// 	$into:'people',
				// 	$documents: {
				// 		first_name: 'John',
				// 		last_name: 'Doe',
				// 		age: 45
				// 	}
				// }
				// documents is a plain/single object
				var columns = getColumns(documents);
				var results = getValues(documents).map(function(value){
					return self.addValue(value);
				});

				return '(' + columns.join(', ') + ') VALUES (' + results.join(', ') + ')';
			} else if (_.isArray(documents)) {
				//  Example: // documents as Array of Objects
				// $insert: {
				// 	$into:'people',
				// 	$documents: [
				// 		{ first_name: 'John', last_name: 'Doe', age: 45 },
				// 		{ first_name: 'Mike', last_name: 'Oldfield', age: 67 },
				// 		{ first_name: 'Jane', last_name: 'Dan', age: 32 }
				// 	]
				// }
				// get the columns from the first doc
				var columns = getColumns(documents[0]);
				var results = [];

				// iterate each document. It should be an Array of Objects
				_.forEach(documents, (doc) => {
					if (_.isPlainObject(doc)){
						results.push(getValues(doc));
					} else {
						throw new Error('$documents must be Array of Objects.');
					}
				});

				var docResults = results.map(function(docValues){
					return docValues.map(function(value){
						return self.addValue(value);
					}).join(', ');
				});
				return '(' + columns.join(', ') + ') VALUES (' + docResults.join('), (') + ')'; //.split('#COMMA#').join(', ');
			} else {
				throw new Error('$documents must be type of Array or Object.');
			}
		} else {
			throw new Error('Using $documents only allowed for $insert.');
		}
	});*/
	sqlBuilder.registerSyntax('$documents', {
		description: 'Specifies the $columns and $values as combined Helper for the `INSERT` Statement. This Helper turn the objected data into $columns and $values.',
		supportedBy: {
			mysql: 'https://dev.mysql.com/doc/refman/5.7/en/insert.html',
			postgreSQL: 'https://www.postgresql.org/docs/9.5/static/sql-insert.html',
			sqlite: 'https://sqlite.org/lang_insert.html'
		},
		definition: {
			allowedTypes: {
	 			Object: {
					syntax: '',
					comments: [
						{ note: 'No syntax supported, because everything works on the linkHook and will be changed from $documents to $columns and $values Helper' }
					]
				},
				Array: {
					syntax: '',
					comments: [
						{ note: 'No syntax supported, because everything works on the linkHook and will be changed from $documents to $columns and $values Helper' }
					]
				}
			}
		},
		hooks: {
			link: function(query/* is the outer query! */) {
				// check if we dont have $columns and $values helper
				// at this time
				if (query.$columns || query.$values) {
					throw new Error (`Try to link query. Can't use '$documents' Helper together with '$columns' or '$values' Helper. Query is: '${JSON.stringify(query)}'`);
				}

				// check $documents must be Object or Array of Objects
				if (!(_.isPlainObject(query.$documents) || (_.isArray(query.$documents) && _.isPlainObject(query.$documents[0])))) {
					throw new Error (`Try to link query. Helper '$documents' must be an Object or an array of Objects. Query is: '${JSON.stringify(query)}'`);
				}

				query.$columns = [];
				query.$values = _.isArray(query.$documents) ? {} : [];

				let refColumnObj = _.isArray(query.$documents) ? query.$documents[0] : query.$documents;

				_.forEach(refColumnObj, (value, key) => {
					query.$columns.push(key);
					if (!_.isArray(query.$documents)){
						query.$values.push(value);
					}
				});

				if (_.isArray(query.$documents)){
					_.forEach(query.$documents, function(record, index){
						let values = [];
						_.forEach(record, function(value, key){
							values.push(value);
						});
						query.$values[index] = { $values: values };
					});
				}

				delete query.$documents;
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
							}
						}
					},
					expectedResult: {
						sql: 'INSERT INTO people (first_name, last_name, age) VALUES ($1, $2, $3)',
						values: {
							$1: 'John',
							$2: 'Doe',
							$3: 27
						}
					}
				}
			},
			Array: {
				basicUsage: {
					test: {
						$insert: {
							$table: 'people',
							$documents: [
								{ first_name: 'John', last_name: 'Doe', age: 27 },
								{ first_name: 'Jane', last_name: 'Doe', age: 29 },
								{ first_name: 'Michael', last_name: 'Goodman', age: 65 },
							]
						}
					},
					expectedResult: {
						sql: 'INSERT INTO people (first_name, last_name, age) VALUES ($1, $2, $3), ($4, $5, $6), ($7, $8, $9)',
						values: {
							$1: 'John',
							$2: 'Doe',
							$3: 27,
							$4: 'Jane',
							$5: 'Doe',
							$6: 29,
							$7: 'Michael',
							$8: 'Goodman',
							$9: 65,
						}
					}
				}
			}
		}
	});

};
