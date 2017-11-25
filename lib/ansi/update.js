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
 /*sqlBuilder.registerHelper('$set', function(set, outerQuery, identifier) {
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
	});*/

	sqlBuilder.registerSyntax('$set', {
		description: 'Specifies the `SET` clause for the `UPDATE` Statement.',
		supportedBy: {
			mysql: 'https://dev.mysql.com/doc/refman/5.7/en/update.html',
			postgreSQL: 'https://www.postgresql.org/docs/9.5/static/sql-update.html',
			sqlite: 'https://sqlite.org/lang_update.html'
		},
		definition: {
			allowedTypes: {
				Object: {
					eachItemOf: {
						Boolean: { syntax: '<key-ident> = <value-param>[ , ... ]' },
						String: { syntax: '<key-ident> = <value-param>[ , ... ]' },
						Number: { syntax: '<key-ident> = <value-param>[ , ... ]' },
						Object: { syntax: '<key-ident> = <value>[ , ... ]' }
					}
				}
			}
		},
		hooks: {
			link: function(query) {
				// only for postgreSQL !!!
				if (this.sqlDialect == 'postgreSQL'){
					// advanced Syntax for update jsonb data like
					/*
						$set: {
							'data->myobj->a': 'hello World',
							'data->myobj->b': 'foo'
						}

						this will turn to nested $jsonbSet object structure
						$set: {
							data: {
								$jsonbSet: {
									$jsonbTarget: {
										$jsonbSet: {
											$jsonbTarget: '~~data',
											$jsonbPath: '{myobj, b}',
											$jsonbValue: 'foo'
										},
									},
									$jsonbPath: '{myobj,a}',
									$text: 'hello World'
								}
							}
						}

						finally sql output:
						UPDATE ...
						SET
							data = jsonb_set(jsonb_set(data, '{myobj,b}', $1), '{myobj,a}', $2)

					}
					*/

					// now iterate each key a merge all identifiers with the same main parent (like data)
					let mainColumns = {};
					_.forEach(query.$set, (value, key) => {
						// check if we have a json-column with "->"
						if (key.indexOf('->') > -1) {
							let colName = key.substring(0, key.indexOf('->'));

							// check if this column arrives twice
							if (!mainColumns[colName]) {
								mainColumns[colName] = {
									originalKey: key,
									data: []
								};
							}

							mainColumns[colName].data.push({
								originalKey: key,
								path: '{' + key.split('->').slice(1).join(',') + '}',
								value: value
							});
						}
					});

					// after iterating each key
					// rebuild the new $set-object
					_.forEach(mainColumns, (colDef, colName) => {
						let lastOperator = {}

						_.forEach(colDef.data, (jsonCol, index) => {
							let jsonOperator = {};
							jsonOperator.$jsonbTarget = index ? { $jsonbSet: lastOperator } : '~~' + colName;
							jsonOperator.$jsonbPath = jsonCol.path;
							jsonOperator.$jsonbValue = jsonCol.value;

							lastOperator = jsonOperator;

							delete query.$set[jsonCol.originalKey];
						});

						query.$set[colName] = {
							$jsonbSet: lastOperator
						};
					});
				}

				return query;
			}
		},
		examples: {
			Object: {
				eachItemOf: {
					Boolean: {
						basicUsage: {
							test: {
								$update: {
									$table: 'people',
									$set: {
										verified: true
									},
									$where: {
										people_id: 4524
									}
								}
							},
							expectedResult: {
								sql: 'UPDATE people SET verified = $1 WHERE people_id = $2',
								values: {
									$1: true,
									$2: 4524
								}
							}
						}
					},
					String: {
						basicUsage: {
							test: {
								$update: {
									$table: 'people',
									$set: {
										first_name: 'John',
										last_name: 'Doe'
									},
									$where: {
										people_id: 4524
									}
								}
							},
							expectedResult: {
								sql: 'UPDATE people SET first_name = $1, last_name = $2 WHERE people_id = $3',
								values: {
									$1: 'John',
									$2: 'Doe',
									$3: 4524
								}
							}
						}
					},
					Number: {
						basicUsage: {
							test: {
								$update: {
									$table: 'people',
									$set: {
										first_name: 'John',
										last_name: 'Doe',
										age: 27
									},
									$where: {
										people_id: 4524
									}
								}
							},
							expectedResult: {
								sql: 'UPDATE people SET first_name = $1, last_name = $2, age = $3 WHERE people_id = $4',
								values: {
									$1: 'John',
									$2: 'Doe',
									$3: 27,
									$4: 4524
								}
							}
						}
					},
					Object: {
						basicUsage: {
							test: {
								$update: {
									$table: 'people',
									$set: {
										first_name: 'John',
										last_name: 'Doe',
										total_likes: {
											$select: {
												tcnt: { $count : '*' },
												$from: 'people_likes',
												$where: {
													people_id: 4524,
													liked: true
												}
											}
										}
									},
									$where: {
										people_id: 4524
									}
								}
							},
							expectedResult: {
								sql: 'UPDATE people SET first_name = $1, last_name = $2, total_likes = (SELECT COUNT(*) AS tcnt FROM people_likes WHERE people_id = $3 AND liked = $4) WHERE people_id = $5',
								values: {
									$1: 'John',
									$2: 'Doe',
									$3: 4524,
									$4: true,
									$5: 4524
								}
							}
						},
						"Advanced Usage for postgreSQL > Updating a jsonb-Column": {
							supportedBy: {
								postgreSQL: true
							},
							test: {
								$update: {
									$table: 'people',
									$set: {
										'data->profile->firstName': 'John'
									},
									$where: {
										people_id: 4524
									}
								}
							},
							expectedResult: {
								sql: 'UPDATE people SET data = jsonb_set(data, $1, $2) WHERE people_id = $3',
								values: {
									$1: '{profile,firstName}',
									$2: '"John"',
									$3: 4524
								}
							}
						},
						"Advanced Usage for postgreSQL > Updating more than 1 property in the same jsonb-Column": {
							supportedBy: {
								postgreSQL: true
							},
							test: {
								$update: {
									$table: 'people',
									$set: {
										'data->profile->firstName': 'John',
										'data->profile->lastName': 'Doe'
									},
									$where: {
										people_id: 4524
									}
								}
							},
							expectedResult: {
								sql: 'UPDATE people SET data = jsonb_set(jsonb_set(data, $1, $2), $3, $4) WHERE people_id = $5',
								values: {
									$1: '{profile,firstName}',
									$2: '"John"',
									$3: '{profile,lastName}',
									$4: '"Doe"',
									$5: 4524
								}
							}
						},
						"Advanced Usage for postgreSQL > Updating more than 1 property in the same jsonb-Column, using different types and a table prefix": {
							supportedBy: {
								postgreSQL: true
							},
							test: {
								$update: {
									$table: 'people',
									$set: {
										'people.data->profile->firstName': 'John',
										'people.data->profile->lastName': 'Doe',
										'misc->age': 30
									},
									$where: {
										people_id: 4524
									}
								}
							},
							expectedResult: {
								sql: 'UPDATE people SET people.data = jsonb_set(jsonb_set(people.data, $1, $2), $3, $4), misc = jsonb_set(misc, $5, $6) WHERE people_id = $7',
								values: {
									$1: '{profile,firstName}',
									$2: '"John"',
									$3: '{profile,lastName}',
									$4: '"Doe"',
									$5: '{age}',
									$6: '30',
									$7: 4524
								}
							}
						}
					}
				}
			}
		}
	});

	sqlBuilder.registerSyntax('$jsonbSet', {
		description: 'Specifies the `jsonb_set` function.',
		supportedBy: {
			postgreSQL: 'https://www.postgresql.org/docs/9.5/static/functions-json.html#FUNCTIONS-JSON-PROCESSING-TABLE',
		},
		definition: {
			allowedTypes: {
				Object: { syntax: 'jsonb_set(<$jsonbTarget>, <$jsonbPath>, <$jsonbValue>{, [$jsonbCreateMissing]})' }
			}
		},
		examples: {
			Object: {
				basicUsage: {
					test: {
						$select: {
							test: { $jsonbSet: {
								$jsonbTarget: '~~data',
								$jsonbPath: '{profile,firstName}',
								$jsonbValue: 'John'
							}}
						}
					},
					expectedResult: {
						sql: 'SELECT jsonb_set(data, $1, $2) AS test',
						values: {
							$1: '{profile,firstName}',
							$2: '"John"'
						}
					}
				}
			}
		}
	});

	sqlBuilder.registerSyntax('$jsonbTarget', {
		description: 'Specifies the `target` Parameter for a `jsonb_xxx` function.',
		supportedBy: {
			postgreSQL: 'https://www.postgresql.org/docs/9.5/static/functions-json.html#FUNCTIONS-JSON-PROCESSING-TABLE',
		},
		definition: {
			allowedTypes: {
				String: { syntax: '<value-param>' },
				Object: { syntax: '<value>' } // for nested $jsonbSet
			}
		},
		hooks: {
			beforeExecute: function(value){
				// turn each parameter to a String with JSON.stringify
				// excepted the values started with ~~
				if (! (_.isString(value) && value.startsWith('~~'))) {
					// check for objected data with Helpers or Operaters
					// then we cant stringify and should leave it as it is
					let helperDetected = false;
					if (_.isPlainObject(value)) {
						_.forEach(value, (value, key)=>{
							if (key.startsWith('$')) {
								helperDetected = true;
							}
						});
					}
					if (!helperDetected){
						value = JSON.stringify(value);
					}
				}
				return value;
			}
		},
		examples: {
			String: {
				basicUsage: {
					test: {
						$select: {
							test: { $jsonbSet: {
								$jsonbTarget: '~~data',
								$jsonbPath: '{profile,firstName}',
								$jsonbValue: 'John'
							}}
						}
					},
					expectedResult: {
						sql: 'SELECT jsonb_set(data, $1, $2) AS test',
						values: {
							$1: '{profile,firstName}',
							$2: '"John"'
						}
					}
				}
			},
			Object: {
				basicUsage: {
					test: {
						$select: {
							test: {
								$jsonbSet: {
									$jsonbTarget: {
										$jsonbSet: {
											$jsonbTarget: '~~data',
											$jsonbPath: '{profile,firstName}',
											$jsonbValue: 'John'
										}
									},
									$jsonbPath: '{profile,lastName}',
									$jsonbValue: 'Doe'
								}
							}
						}
					},
					expectedResult: {
						sql: 'SELECT jsonb_set(jsonb_set(data, $1, $2), $3, $4) AS test',
						values: {
							$1: '{profile,firstName}',
							$2: '"John"',
							$3: '{profile,lastName}',
							$4: '"Doe"'
						}
					}
				}
			}
		}
	});

	sqlBuilder.registerSyntax('$jsonbPath', {
		description: 'Specifies the `path` Parameter for a `jsonb_xxx` function.',
		supportedBy: {
			postgreSQL: 'https://www.postgresql.org/docs/9.5/static/functions-json.html#FUNCTIONS-JSON-PROCESSING-TABLE',
		},
		definition: {
			allowedTypes: {
				String: { syntax: '<value-param>' }
			}
		},
		examples: {
			String: {
				basicUsage: {
					test: {
						$select: {
							test: { $jsonbSet: {
								$jsonbTarget: '~~data',
								$jsonbPath: '{profile,firstName}',
								$jsonbValue: 'John'
							}}
						}
					},
					expectedResult: {
						sql: 'SELECT jsonb_set(data, $1, $2) AS test',
						values: {
							$1: '{profile,firstName}',
							$2: '"John"'
						}
					}
				}
			}
		}
	});

	sqlBuilder.registerSyntax('$jsonbValue', {
		description: 'Specifies the `value` or `new Value` Parameter for a `jsonb_xxx` function.',
		supportedBy: {
			postgreSQL: 'https://www.postgresql.org/docs/9.5/static/functions-json.html#FUNCTIONS-JSON-PROCESSING-TABLE',
		},
		definition: {
			allowedTypes: {
				String: { syntax: '<value-param>' }
			}
		},
		hooks: {
			link: function(query){
				if (query.$jsonbValue){
					// turn each parameter to a String with JSON.stringify
					// excepted the queries started with ~~
					if (! (_.isString(query.$jsonbValue) && query.$jsonbValue.startsWith('~~'))) {
						query.$jsonbValue = JSON.stringify(query.$jsonbValue);
						// convert always to string, because Numeric data is a string.
						// and a "real" String will be quoted by the stringify in double quotes
						if (!_.isString(query.$jsonbValue)) {
							query.$jsonbValue = '' + query.$jsonbValue;
						}
					}
				}
				return query;
			}
		},
		examples: {
			String: {
				basicUsage: {
					test: {
						$select: {
							test: { $jsonbSet: {
								$jsonbTarget: '~~data',
								$jsonbPath: '{profile,firstName}',
								$jsonbValue: 'John'
							}}
						}
					},
					expectedResult: {
						sql: 'SELECT jsonb_set(data, $1, $2) AS test',
						values: {
							$1: '{profile,firstName}',
							$2: '"John"'
						}
					}
				}
			}
		}
	});
};
