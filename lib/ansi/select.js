'use strict';

const _ 		= require('lodash');
const helpers 	= require('./helpers');

// Checking if the current $select operator is the only one
// then we have NO sub-select, but if there are more than one --> sub-select
//
// Using sub-selct's the helperChain looks like: ['$select', '$columns', '$select']
//
// NOTE always call this function in the context of the current sqlBuilder instance
function isSubSelect() {
	let selectCount = 0;
	for (var i=0, max=this._helperChain.length; i<max; i++){
		if (this._helperChain[i] == '$select') selectCount++;
	}

	return selectCount > 1;
}

module.exports = function(sqlBuilder){
	// ANSI SELECT Statement Syntax
	sqlBuilder.registerSyntax('$select', `
		SELECT [$distinct] [$all]
			 <$columns>
			{ FROM [$from] }
			{ INNER | LEFT | RIGHT ... JOIN [$joins] }
			{ WHERE [$where] }
			{ GROUP BY [$groupBy]
				{ HAVING [$having] }
			}
			{ ORDER BY { [$sort] | [$orderBy] } }
	`);

	/**
	 * @before
	 *
	 * # SELECT Statements
	 *
	 * To query the database using a select statement you have to take the `$select` operator.
	 *
	 * The minimum `$select` must supply the `$columns` operator, to specify at least one column.
	 * Optionally you can use:
	 * - $distinct
	 * - $all
	 * - $from
	 * - $where
	 * - $groupBy
	 * - $having
	 * - $sort
	 * - **and all operators from your specific language dialect**
	 *
	 * Just a short example:
	 * ```javascript
	 * $select: {
	 * 		$columns: [
	 * 			'first_name',
	 * 			{ first_name_count: { $count: '*' } }
	 * 		],
	 * 		$from: 'people',
	 * 		$groupBy: ['first_name'],
	 * 		$having: {
	 * 			$expr: { $count: '*', $gt: 2 }
	 * 		}
	 * }
	 * ```
	 *
	 * @name Select
	 * @summary Main operator to generate a SELECT Statement
	 * ```syntax
	 * SELECT [$distinct] [$all]
	 * 		<$columns>
	 * 		{ FROM [$from] }
	 * 		{ WHERE [$where] }
	 * 		{ GROUP BY [$groupBy]
	 * 			{ HAVING [$having] }
	 * 		}
	 * 		{ ORDER BY { [$sort] | [$orderBy] } }
	 * ```
	 * @isquerying true
	 * @ansi true
	 *
	 * @param expr 	 {Object}		Specifies the details for the $select
	 */
	/*sqlBuilder.registerHelper('$select', function(query, outerQuery, identifier) {
		var result = 'SELECT ';

		// check the type of the query, it must always be an object
		if (!_.isPlainObject(query)){
			throw new Error('$select must always be an object.');
		}

		// set the main operator for any following helper (in this case the $into)
		this.mainOperator = '$select';

		// check for $fields or $columns definition, otherwise we add '*' as columns
		if (!query.$columns){
			// add a shorthand for $columns --> all properties declared directly in $select object
			// that are no operators will be a Column!
			query.$columns = {};
			_.forEach(query, (value, key)=>{
				// skip all operators and helpers
				if (! key.startsWith('$')) {
					query.$columns[key] = value;
					delete query[key];
				}
			});
			// if there is no column, we add '*' for ALL --> SELECT * FROM ...
			if (Object.keys(query.$columns).length == 0) {
				query.$columns['*'] = true;
			}
		}

		result += this.build(query, null, sqlBuilder.getSyntax('$select'));

		// check if this select is a subselect, then we have to put the result in round brackets
		if (isSubSelect.call(this)) {
			return '(' + result + ')' + (identifier ? ' AS ' + this.quote(identifier) : '');
		}
		return result;
	});*/

	sqlBuilder.registerSyntax('$select', {
		description: 'Specifies the operator for the `SELECT` Statement.',
		supportedBy: {
			mysql: 'https://dev.mysql.com/doc/refman/5.7/en/select.html',
			postgreSQL: 'https://www.postgresql.org/docs/9.5/static/sql-select.html',
			sqlite: 'https://sqlite.org/lang_select.html'
		},
		definition: {
			allowedTypes: {
	 			Object: {
					syntax:
`SELECT	{ TOP [$top]}-->(mssql)	{ DISTINCT[$distinct]}	{ SQL_CALC_FOUND_ROWS[$calcFoundRows]}-->(mysql)	[$all]	{ <$columns>}	{ INTO [$into]}-->(mysql,mssql)
	{ FROM [$from]}
	{ [$joins]}
	{ WHERE [$where]}
	{ GROUP BY [$groupBy]} { WITH ROLLUP[$rollup]}-->(mysql)
	{ HAVING [$having]}
	{ ORDER BY [$sort] | [$orderBy]}
	{ LIMIT [$limit]}-->(mysql,postgreSQL,sqlite)
	{ OFFSET [$offset]}-->(mysql,postgreSQL,sqlite)
	{ INTO OUTFILE [$outfile]}-->(mysql)
	{ INTO DUMPFILE [$dumpfile]}-->(mysql)`
				}
			}
 		},
		hooks: {
			beforeExecute: function(query, type) {
				if (!query.$columns){
					// add a shortcut for $columns
					// so that all properties declared directly in $select object
					// that are no operators or helpers will become a column!
					query.$columns = {};
					_.forEach(query, (value, key)=>{
						// skip all operators and helpers
						if (! key.startsWith('$')) {
							query.$columns[key] = value;
							delete query[key];
						}
					});
					// if there is no column, we add '*' for ALL --> SELECT * FROM ...
					if (Object.keys(query.$columns).length == 0) {
						query.$columns['*'] = true;
					}
				}
				return query;
			},
			afterExecute: function(result) {
				// check for a sub-query and put this in round brackets
				let selectCount = 0;
				for (var i=0, max=this._helperChain.length; i<max; i++){
					if (this._helperChain[i] == '$select') selectCount++;
				}

				if (selectCount > 1) {
					return '(' + result + ')';
				};

				return result;
			}
		},
		examples: {
			Object: {
				basicUsage: {
					test: {
						$select: {
							$from: 'people'
						}
					},
					expectedResult: {
						sql: 'SELECT * FROM people'
					}
				},
				'Shortcut for $columns Helper': {
					test: {
						$select: {
							first_name: 1,
							last_name: 1,

							$from: 'people'
						}
					},
					expectedResult: {
						sql: 'SELECT first_name, last_name FROM people'
					}
				}
			}
		}
 	});

	/**
	 * @name $from
	 * @summary Specifies the FROM clause for the SELECT statement
	 *
	 * @memberOf Select
	 * @isquerying true
	 * @ansi true
	 *
	 * @param value	 {String | Object}
	 * Specifies the table-identifier as string or an Object to use an alias
	 * - value is a **String** like: `$from: 'people'`
	 * - value is an **Object** like: `$from: { people: { $as: 'alias_people' } }`
	 *
	 */
	/*sqlBuilder.registerHelper('$from', function(table, outerQuery, identifier){
		if (_.isString(table)){
			// the table is a string like $from: 'people'
			return 'FROM ' + this.quote(table);
		} else if (_.isPlainObject(table)) {
			// table is an object like $from: { people: { $as: 'alias_people' } }
			return 'FROM ' + this.build(table, identifier, undefined, undefined, ', ');
		} else {
			throw new Error('$from expression must be either a string or object.');
		}
	});*/
	sqlBuilder.registerSyntax('$from', {
		description: 'Specifies the `FROM` clause Helper for the `SELECT` Statement.',
		supportedBy: {
			mysql: 'https://dev.mysql.com/doc/refman/5.7/en/select.html',
			postgreSQL: 'https://www.postgresql.org/docs/9.5/static/sql-select.html',
			sqlite: 'https://sqlite.org/lang_select.html#fromclause'
		},
		definition: {
			allowedTypes: {
	 			Object: {
					eachItemOf: {
						Boolean: {
							syntax: {
								true: '<key-ident>[ , ... ]',
								false: ''
							}
						},
						Number: {
							syntax: {
								1: '<key-ident>[ , ... ]'
							}
						},
						String: { syntax: '<key-ident> AS <value-ident>[ , ... ]' },
						Object: { syntax: '<value> AS <key-ident>[ , ... ]' },
					},
				},
				String: { syntax: '<value-ident>' },
			}
 		},
		examples: {
			Object: {
				eachItemOf: {
					Boolean: {
						true: {
							basicUsage: {
								test: {
									$select: {
										$from: {
											people: true,
											people_skills: true
										}
									}
								},
								expectedResult: {
									sql: 'SELECT * FROM people, people_skills'
								}
							}
						},
						false: {
							basicUsage: {
								test: {
									$select: {
										$from: {
											people: true,
											people_skills: false
										}
									}
								},
								expectedResult: {
									sql: 'SELECT * FROM people'
								},
								comments: [
									{ type: 'note', comment: `Can't use \`$from\` helper on Object->Boolean with only one expr. that has a false value. In that case it wil end up in an Error on the database.` }
								]
							}
						}
					},
					Number: {
						1: {
							basicUsage: {
								test: {
									$select: {
										$from: { people: 1, people_skills: 1 }
									}
								},
								expectedResult: {
									sql: 'SELECT * FROM people, people_skills'
								}
							}
						}
					},
					String: {
						basicUsage: {
							test: {
								$select: {
									$from: { people: 'p' }
								}
							},
							expectedResult: {
								sql: 'SELECT * FROM people AS p'
							}
						},
						"Cross Joined Tables": {
							test: {
								$select: {
									$from: { people: 'p', people_skills: 'ps' }
								}
							},
							expectedResult: {
								sql: 'SELECT * FROM people AS p, people_skills AS ps'
							}
						}
					},
					Object: {
						basicUsage: {
							test: {
								$select: {
									$from: {
										people: 'p',
										skills: {
											$select: { $from: 'people_skills' }
										}
									}
								}
							},
							expectedResult: {
								sql: 'SELECT * FROM people AS p, (SELECT * FROM people_skills) AS skills'
							}
						}
					}
				} // eachItemOf
			}, // Object
			String: {
				basicUsage: {
					test: {
						$select: {
							$from: 'people'
						}
					},
					expectedResult: {
						sql: 'SELECT * FROM people'
					}
				}
			}
		}
 	});

	/**
	 * @name $columns
	 * @summary Specifies the columns for the `INSERT` and `SELECT` Statement
	 *
	 * @memberOf Select
	 * @isquerying true
	 * @ansi true
	 *
	 * @param columns	 {Array | Object}
	 * Specifies the columns as Array or Object used by §insert or $select
	 * - columns as **Array** like: `$columns: ['first_name', 'last_name']`
	 * - columns as **Object** like: `$columns: { first_name: { $as: 'alias_first_name' }, last_name: { $val: 'Always Doe' } }`
	 */
 	/*sqlBuilder.registerHelper('$columns', function(query, outerQuery, identifier){
		var results = [];

		// add support for primitive String
		if (_.isString(query)){
			query = [query];
		}

		if (_.isArray(query)){
			_.forEach(query, (column) => {
				// check the type of the column definition
				if (_.isString(column)){
					results.push(this.quote(column));
				} else if (_.isPlainObject(column)) {
					results.push(this.build(column));
				} else {
					throw new Error('The items of the $columns array should either be a string or an object.');
				}
			});
		} else if (_.isPlainObject(query)) {
			_.forEach(query, (value, column) => {
				// check the type of the column definition
				if (_.isString(value)){
					results.push(this.addValue(value) + ' AS ' + this.quote(column));
				} else if (_.isBoolean(value) || _.isNumber(value)) {
					if (value) {
						results.push(this.quote(column));
					}
				} else if (_.isPlainObject(value)) {
					results.push(this.build(value, column));
				} else {
					throw new Error('The properties of the $columns Object should either be a String, Boolean or an Object.');
				}
			});
		} else {
			throw new Error('$columns must be either array of strings or objects.');
		}

		// output the columns with "( col1, col2, ...col-n )" when running an $insert
		if (this.mainOperator == '$insert' || this.mainOperator == '$constraint' || this.mainOperator == '$createIndex'){
			return '(' + results.join(', ') + ')';
		}
		return results.join(', ');
	});*/
	sqlBuilder.registerSyntax('$columns', {
		description:
`Specifies the \`$columns\` Helper for the \`SELECT\` Statement to select
only the listed columns instead of \`*\` or \`ALL\`.

**Note** If you did not support the $columns Helper on a SELECT Statement the $select_beforeExecuteHook will automatically
add a $columns Object with \`*\` to the query as single column.
`,
		supportedBy: {
			mysql: 'https://dev.mysql.com/doc/refman/5.7/en/select.html',
			postgreSQL: 'https://www.postgresql.org/docs/9.5/static/sql-select.html',
			sqlite: 'https://sqlite.org/lang_select.html'
		},
		definition: {
			allowedTypes: {
				Object: {
					eachItemOf: {
						Boolean: {
							syntax: {
								true: '<key-ident>[ , ... ]',
								false: ''
							}
						},
						Number: {
							syntax: {
								1: '<key-ident>[ , ... ]',
								0: ''
							}
						},
						String: { syntax: '<key-ident> AS <value-ident>[ , ... ]' },
						Object: { syntax: '<value> AS <key-ident>[ , ... ]' },
						Function: { syntax: '<value> AS <key-ident>[ , ... ]' }
					}
				},
				Array: {
					eachItemOf: {
						String: { syntax: '<value-ident>[ , ... ]' },
						Object: { syntax: '<value>[ , ... ]' }
					}
				},
				String: { syntax: '<value-ident>' }
			}
		},
		hooks: {
			afterExecute: function(result) {
				// hook for contraints that uses $columns to define
				// the pk-key or unique columns. They must be listed in round brackets
				if (this.isCurrent('$constraint') || this.mainOperator == '$createIndex') {
					result = '(' + result + ')';
				}
				return result;
			}
		},
		examples: {
			Object: {
				eachItemOf: {
					Function: {
						basicUsage: {
							test: {
								$select: {
									$columns: {
										first_name: true,
										last_name: true,
										top_skill: {
											$select: { skill: 'top_skill',
												$from: 'people_skills',
												$where: {
													'people.people_id': '~~people_skills.people_id'
												}
											}
										}
									},
									$from: 'people',
									$where: {
										age: { $gte: 18 }
									}
								}
							},
							expectedResult: {
								sql: 'SELECT first_name, last_name, (SELECT skill AS top_skill FROM people_skills WHERE people.people_id = people_skills.people_id) AS top_skill FROM people WHERE age >= $1',
								values: {
									$1: 18
								}
							}
						}
					},
					Object: {
						basicUsage: {
							test: {
								$select: {
									$columns: {
										first_name: true,
										last_name: true,
										top_skill: {
											$select: { skill: 'top_skill',
												$from: 'people_skills',
												$where: {
													'people.people_id': '~~people_skills.people_id'
												}
											}
										}
									},
									$from: 'people',
									$where: {
										age: { $gte: 18 }
									}
								}
							},
							expectedResult: {
								sql: 'SELECT first_name, last_name, (SELECT skill AS top_skill FROM people_skills WHERE people.people_id = people_skills.people_id) AS top_skill FROM people WHERE age >= $1',
								values: {
									$1: 18
								}
							}
						}
					},
					Boolean: {
						true: {
							basicUsage: {
								test: {
									$select: {
										$columns: {
											first_name: true,
											last_name: true
										},
										$from: 'people'
									}
								},
								expectedResult: {
									sql: 'SELECT first_name, last_name FROM people'
								}
							}
						},
						false: {
							basicUsage: {
								test: {
									$select: {
										$columns: {
											people_id: true,
											first_name: false,
											last_name: false
										},
										$from: 'people'
									}
								},
								expectedResult: {
									sql: 'SELECT people_id FROM people'
								}
							}
						}
					},
					Number: {
						0: {
							basicUsage: {
								test: {
									$select: {
										$columns: {
											first_name: 1,
											last_name: 1
										},
										$from: 'people'
									}
								},
								expectedResult: {
									sql: 'SELECT first_name, last_name FROM people'
								}
							}
						},
						1: {
							basicUsage: {
								test: {
									$select: {
										$columns: {
											people_id: 1,
											first_name: 0,
											last_name: 0
										},
										$from: 'people'
									}
								},
								expectedResult: {
									sql: 'SELECT people_id FROM people'
								}
							}
						}
					},
					String: {
						basicUsage: {
							test: {
								$select: {
									$columns: {
										first_name: 'fn',
										last_name: 'ln'
									},
									$from: 'people'
								}
							},
							expectedResult: {
								sql: 'SELECT first_name AS fn, last_name AS ln FROM people'
							}
						}
					}
				} // eachItemOf
			}, // Object
			Array: {
				eachItemOf: {
					String: {
						basicUsage: {
							test: {
								$select: {
									$columns: ['first_name', 'last_name'],
									$from: 'people'
								}
							},
							expectedResult: {
								sql: 'SELECT first_name, last_name FROM people'
							}
						}
					},
					Object: {
						basicUsage: {
							test: {
								$select: {
									$columns: [
										{ first_name: { $as: 'fn' } },
										{ last_name: { $as: 'ln' } },
									],
									$from: 'people'
								}
							},
							expectedResult: {
								sql: 'SELECT first_name AS fn, last_name AS ln FROM people'
							}
						}
					}
				}
			},
			String: {
				basicUsage: {
					test: {
						$select: {
							$columns: 'people_id',
							$from: 'people'
						}
					},
					expectedResult: {
						sql: 'SELECT people_id FROM people'
					}
				}
			}
		}
	});

	/**
	 * @name $where
	 * @summary Specifies the WHERE clause for the SELECT statement
	 *
	 * @memberOf Select
	 * @isquerying true
	 * @ansi true
	 *
	 * @param where	 {Object}
	 * Specifies the WHERE clause as Object to use on the select statement
	 * - where is an **Object** like: `$where: { first_name: 'John', last_name: 'Doe' }`
	 */
	//sqlBuilder.registerHelper('$where', function(where/*, outerQuery, identifier*/){
	//	var result = helpers.whereClause.call(this, '$where', where/*, outerQuery, identifier*/);
	//	return (result.length > 0 ? 'WHERE ' + result : '');
	//});

	sqlBuilder.registerSyntax('$where', {
		description: 'Specifies the `WHERE` clause for the `SELECT` Statement.',
		supportedBy: {
			mysql: 'https://dev.mysql.com/doc/refman/5.7/en/select.html',
			postgreSQL: 'https://www.postgresql.org/docs/9.5/static/sql-select.html',
			sqlite: 'https://sqlite.org/lang_select.html#whereclause'
		},
		definition: {
			allowedTypes: {
	 			Object: { syntax: '{* AND [$and] *} {* OR [$or] *}' }
			},
			belongsTo: {
				$select: true
			},
			dependsOn: {
				$select: true
			}
 		},
		hooks: {
			beforeExecute: function(query) {
				// by defaut move all conditions to $and
				// if there is no $and and/or $or defined
				if (!query.$and && !query.$or) {
					let andItems = [];
					_.forEach(query, (value, key)=>{
						if (!key.startsWith('$')) {
							let o = {}; o[key]=value;
							andItems.push(o);
						}
					});
					if (andItems.length > 0) {
						query.$and = _.cloneDeep(andItems);
						_.forEach(query, (value, key)=>{
							if (!key.startsWith('$')) {
								delete query[key];
							}
						});
					}
				}
				return query;
			}
		},
		examples: {
			Object: {
				basicUsage: {
					test: {
						$select: {
							$from: 'people',
							$where: {
								first_name: 'John'
							}
						}
					},
					expectedResult: {
						sql: 'SELECT * FROM people WHERE first_name = $1',
						values: {
							$1: 'John'
						}
					}
				},
				eachItemOf: {
					String: {
						basicUsage: {
							test: {
								$select: {
									$from: 'people',
									$where: {
										first_name: 'John'
									}
								}
							},
							expectedResult: {
								sql: 'SELECT * FROM people WHERE first_name = $1',
								values: {
									$1: 'John'
								}
							}
						},
						"All expressions will be concated with AND": {
							test: {
								$select: {
									$from: 'people',
									$where: {
										first_name: 'John',
										last_name: 'Doe'
									}
								}
							},
							expectedResult: {
								sql: 'SELECT * FROM people WHERE first_name = $1 AND last_name = $2',
								values: {
									$1: 'John',
									$2: 'Doe'
								}
							}
						}
					},
					Number: {
						basicUsage: {
							test: {
								$select: {
									$from: 'people',
									$where: {
										age: 18
									}
								}
							},
							expectedResult: {
								sql: 'SELECT * FROM people WHERE age = $1',
								values: {
									$1: 18
								}
							}
						}
					},
					Boolean: {
						basicUsage: {
							test: {
								$select: {
									$from: 'people',
									$where: {
										marriaged: true
									}
								}
							},
							expectedResult: {
								sql: 'SELECT * FROM people WHERE marriaged = $1',
								values: {
									$1: true
								}
							}
						}
					},
					Object: {
						basicUsage: {
							test: {
								$select: {
									$from: 'people',
									$where: {
										age: { $gt: 18 }
									}
								}
							},
							expectedResult: {
								sql: 'SELECT * FROM people WHERE age > $1',
								values: {
									$1: 18
								}
							}
						}
					},
					Array: {
						basicUsage: {
							test: {
								$select: {
									$from: 'people',
									$where: {
										$or: [
											{ age: { $gt: 18 } },
											{ last_name: 'Doe' }
										]
									}
								}
							},
							expectedResult: {
								sql: 'SELECT * FROM people WHERE age > $1 OR last_name = $2',
								values: {
									$1: 18,
									$2: 'Doe'
								}
							}
						}
					}

				} // eachItemOf
			}
		}
 	});

	/**
	 * @name $groupBy
	 * @summary Specifies the GROUP BY clause for the SELECT statement
	 *
	 * @memberOf Select
	 * @isquerying true
	 * @ansi true
	 *
	 * @param groupBy	 {Array | Object}
	 * Specifies the GROUP BY clause as Array or Object to use on the select statement
	 * - groupBy is an **Array** like: `$groupBy: ['first_name', 'last_name']`
	 */
	/*sqlBuilder.registerHelper('$groupBy', function(groupBy, outerQuery, identifier){
		// the groupBy can be handeld with the columns-helper because it has the
		// same syntax and definition
		var result = sqlBuilder.callHelper('$columns', groupBy, outerQuery, identifier);
		return 'GROUP BY ' + result;
	});*/
	sqlBuilder.registerSyntax('$groupBy', {
		description: `Specifies the \`GROUP BY\` clause for the \`SELECT\` Statement.`,
		supportedBy: {
			mysql: 'https://dev.mysql.com/doc/refman/5.7/en/select.html',
			postgreSQL: 'https://www.postgresql.org/docs/9.5/static/sql-select.html',
			sqlite: 'https://sqlite.org/lang_select.html'
		},
		definition: {
			allowedTypes: {
				Object: {
					eachItemOf: {
						Boolean: {
							syntax: {
								true: '<key-ident>[ , ... ]',
								false: ''
							}
						},
						Number: {
							syntax: {
								1: '<key-ident>[ , ... ]',
								0: ''
							}
						}
					}
				},
				Array: {
					eachItemOf: {
						String: { syntax: '<value-ident>[ , ... ]' }
					}
				},
				String: { syntax: '<value-ident>' }
			}
		},
		examples: {
			Object: {
				eachItemOf: {
					Boolean: {
						true: {
							basicUsage: {
								test: {
									$select: {
										city: true,
										citycnt: { $count: 'city'},

										$from: 'people',
										$groupBy: {
											city: true,
											postalcode: true
										}
									}
								},
								expectedResult: {
									sql: 'SELECT city, COUNT(city) AS citycnt FROM people GROUP BY city, postalcode'
								}
							}
						},
						false: {
							basicUsage: {
								test: {
									$select: {
										city: true,
										postalcode: false,
										citycnt: { $count: 'city'},

										$from: 'people',
										$groupBy: {
											city: true,
											postalcode: false
										}
									}
								},
								expectedResult: {
									sql: 'SELECT city, COUNT(city) AS citycnt FROM people GROUP BY city'
								}
							}
						}
					},
					Number: {
						0: {
							basicUsage: {
								test: {
									$select: {
										city: 1,
										postalcode: 0,
										citycnt: { $count: 'city'},

										$from: 'people',
										$groupBy: {
											city: 1,
											postalcode: 0
										}
									}
								},
								expectedResult: {
									sql: 'SELECT city, COUNT(city) AS citycnt FROM people GROUP BY city'
								}
							}
						},
						1: {
							basicUsage: {
								test: {
									$select: {
										city: 1,
										citycnt: { $count: 'city'},

										$from: 'people',
										$groupBy: {
											city: 1,
											postalcode: 1
										}
									}
								},
								expectedResult: {
									sql: 'SELECT city, COUNT(city) AS citycnt FROM people GROUP BY city, postalcode'
								}
							}
						}
					}
				} // eachItemOf
			}, // Object
			Array: {
				eachItemOf: {
					String: {
						basicUsage: {
							test: {
								$select: {
									city: 1,
									citycnt: { $count: 'city'},

									$from: 'people',
									$groupBy: ['city', 'postalcode']
								}
							},
							expectedResult: {
								sql: 'SELECT city, COUNT(city) AS citycnt FROM people GROUP BY city, postalcode'
							}
						}
					}
				}
			},
			String: {
				basicUsage: {
					test: {
						$select: {
							city: 1,
							citycnt: { $count: 'city'},

							$from: 'people',
							$groupBy: 'city'
						}
					},
					expectedResult: {
						sql: 'SELECT city, COUNT(city) AS citycnt FROM people GROUP BY city'
					}
				}
			}
		}
	});

	/**
	 * @name $having
	 * @summary Specifies the HAVING clause on a SELECT ... GROUP BY Statement
	 *
	 * @memberOf Select
	 * @isquerying true
	 * @ansi true
	 *
	 * @param having	 {Object}
	 * Specifies the HAVING clause as an Object
	 * - having is an **Object** like: `$having: { $expr: { $count: '*', $gt: 2 } }`
	 */
	sqlBuilder.registerHelper('$having', function(where, outerQuery, identifier){
		// the $having expression is the same as the where clause
		var result = helpers.whereClause.call(this, '$having', where, outerQuery, identifier);
		//return (result.length > 0 ? 'HAVING ' + result : '');
		return (result.length > 0 ? '' + result : '');
	});

	/**
	 * @name Sorting
	 * @summary Specifies the ORDER BY clause for a statement
	 *
	 * @ishelper true
	 * @ansi true
	 *
	 * @param sort	 {String | Array | Object}
	 * Specifies the ORDER BY clause in different variations:
	 * - sort is a **String** like: `$sort: 'last_name'`
	 * - sort is an **Array** of Strings like: `$sort: ['last_name', 'first_name']`
	 * - sort is an **Array** of Objects like: `$sort: [ { last_name: 1 }, { first_name: -1 } ]`
	 * - sort is an **Array** of Objects like: `$sort: [ { last_name: 'ASC' }, { first_name: 'DESC' } ]`
	 * - sort is an **Object** like: `$sort: { last_name: 'ASC', first_name: 'DESC' }`
	 * - sort is an **Object** like: `$sort: { last_name: 1, first_name: -1 }`
	 * - sort is an **Object** like: `$sort: { last_name: { $asc: true }, first_name: { $desc: true } }`
	 */
	sqlBuilder.registerHelper('$sort', function(sort/*, outerQuery, identifier*/){
		var results = helpers.sort.call(this, '$sort', sort);
		// V2 return (results.length > 0 ? 'ORDER BY ' + results.join(', ') : '');
		return (results.length > 0 ? '' + results.join(', ') : '');
	});

	/**
	 * @name $orderBy
	 * @summary Specifies the ORDER BY clause for a statement
	 *
	 * This is an alias for the `$sort` operator. See [$sort](#Query-select-sort)
	 *
	 * @memberOf Sorting
	 * @ishelper true
	 * @ansi true
	 */
	sqlBuilder.registerHelper('$orderBy', function(sort/*, outerQuery, identifier*/){
		var results = helpers.sort.call(this, '$orderBy', sort);
		// V2 return (results.length > 0 ? 'ORDER BY ' + results.join(', ') : '');
		return (results.length > 0 ? '' + results.join(', ') : '');
	});

	/**
	 * @name $asc
	 * @summary Specifies the order direction ASC for an identifier used on ORDER BY clause
	 *
	 * @memberOf Sorting
	 * @ishelper true
	 * @ansi true
	 *
	 * @param asc	 {Boolean}
	 * Specifies the ORDER BY clause in different variations:
	 * - asc is an **Boolean** like: `$sort: { last_name: { $asc: true }, first_name: { $desc: true } }`
	 */
	sqlBuilder.registerHelper('$asc', function(asc, outerQuery, identifier){
		// $asc: true,
		if (_.isBoolean(asc)) {
			if (identifier){
				return this.quote(identifier) + (asc ? ' ASC' : '');
			} else {
				return asc ? 'ASC' : '';
			}
		} else {
			throw new Error ('$asc must be true or false.');
		}
	});

	/**
	 * @name $desc
	 * @summary Specifies the order direction DESC for an identifier used on ORDER BY clause
	 *
	 * @memberOf Sorting
	 * @ishelper true
	 * @ansi true
	 *
	 * @param asc	 {Boolean}
	 * Specifies the ORDER BY clause in different variations:
	 * - asc is an **Boolean** like: `$sort: { last_name: { $asc: true }, first_name: { $desc: true } }`
	 */
	sqlBuilder.registerHelper('$desc', function(desc, outerQuery, identifier){
		// $desc: true,
		if (_.isBoolean(desc)) {
			if (identifier){
				return this.quote(identifier) + (desc ? ' DESC' : '');
			} else {
				return desc ? 'DESC' : '';
			}
		} else {
			throw new Error ('$desc must be true or false.');
		}
	});

	/**
	 * @name $distinct
	 * @summary Specifies the DISTINCT keyword for an Statement.
	 *
	 * @memberOf Select
	 * @isquerying true
	 * @ansi true
	 *
	 * @param distinct	 {Boolean}
	 * Specifies the DISTINCT keyword:
	 * - example: `$select: { $distinct: true, $columns: [ ... ], ... }`
	 */
	sqlBuilder.registerHelper('$distinct', function(distinct/*, outerQuery, identifier*/){
		if (_.isBoolean(distinct)) {
			// V2 return distinct ? 'DISTINCT' : '';
			return distinct ? '' : '';
		} else {
			throw new Error ('$distinct must be true or false.');
		}
	});

	/**
	 * @name $limit
	 * @summary Specifies the `LIMIT` option for the `SELECT` Statement.
	 *
	 * @memberOf Select
	 * @isquerying true
	 * @mysql true
	 * @postgres true
	 *
	 * @param limit	 {String | Number}
	 * - limit as **String**: `... $limit: 'ALL', $offset: 0, ...`
	 * - limit as **Number**: `... $limit: 10, $offset: 0, ...`
	 *
	 * For MySQL you can use the keyword `ALL`. Within the query the value would be replaced with `18446744073709551615`.
	 * Further details using `LIMIT ALL` for MySQL see the
	 * official docs [https://dev.mysql.com/doc/refman/5.7/en/select.html](https://dev.mysql.com/doc/refman/5.7/en/select.html)
	 */
 /*sqlBuilder.registerHelper('$limit', function(limit, outerQuery, identifier){
		const LIMIT_MAX_ALL = 18446744073709551615;

		if (limit === 'ALL') {
			if (this.sqlDialect == 'mysql'){
				return 'LIMIT ' + this.addValue(LIMIT_MAX_ALL);
			} else {
				// postgreSQL
				return 'LIMIT ALL';
			}
		}
		else if (_.isNumber(limit)) {
			return 'LIMIT ' + this.addValue(limit);
		} else {
			throw new Error ('$limit must be \'ALL\' or a number.');
		}
	});*/
	sqlBuilder.registerSyntax('$limit', {
		description: 'Specifies the `LIMIT` clause for the `SELECT` Statement.',
		supportedBy: {
			mysql: 'https://dev.mysql.com/doc/refman/5.7/en/select.html',
			postgreSQL: 'https://www.postgresql.org/docs/9.5/static/sql-select.html',
			sqlite: 'https://sqlite.org/lang_select.html'
		},
		definition: {
			allowedTypes: {
				Number: { syntax: '<value-param>' },
				String: {
					syntax: {
						ALL: '<value>'
					}
				}
			}
		},
		hooks: {
			comments: [
				{
					note: `For MySQL you can use the keyword \`ALL\`. Within the query the value would be replaced with \`18446744073709551615\`.
							Further details using \`LIMIT ALL\` for MySQL see the
							official docs [https://dev.mysql.com/doc/refman/5.7/en/select.html](https://dev.mysql.com/doc/refman/5.7/en/select.html)`
				}
			],
			beforeExecute: function(query, options) {
				if (query === 'ALL') {
					switch (options.sqlDialect) {
						case 'mysql':
							return '18446744073709551615';
						case 'sqlite':
							return '-1';
					}
				}
				return query;
			}
		},
		examples: {
			Number: {
				basicUsage: {
					test: {
						$select: {
							$from: 'people',
							$limit: 10
						}
					},
					expectedResult: {
						sql: 'SELECT * FROM people LIMIT $1',
						values: {
							$1: 10
						}
					}
				}
			},
			String: {
				ALL: {
					basicUsage: {
						supportedBy: {
							postgreSQL: true
						},
						test: {
							$select: {
								$from: 'people',
								$limit: 'ALL'
							}
						},
						expectedResult: {
							sql: 'SELECT * FROM people LIMIT ALL',
						}
					},
					"MySQL turns $limit: 'ALL' to LIMIT 18446744073709551615": {
						supportedBy: {
							mysql: true
						},
						test: {
							$select: {
								$from: 'people',
								$limit: 'ALL'
							}
						},
						expectedResult: {
							sql: 'SELECT * FROM people LIMIT 18446744073709551615',
						}
					},
					"SQLite turns $limit: 'ALL' to LIMIT -1": {
						supportedBy: {
							sqlite: true
						},
						test: {
							$select: {
								$from: 'people',
								$limit: 'ALL'
							}
						},
						expectedResult: {
							sql: 'SELECT * FROM people LIMIT -1',
						}
					}
				}
			}
		}
	});

	/**
	 * @name $offset
	 * @summary Specifies the `OFFSET` option for the `SELECT` Statement.
	 *
	 * @memberOf Select
	 * @isquerying true
	 * @mysql true
	 * @postgres true
	 *
	 * @param offset	 {Number}
	 * - offset as **Number**: `... $limit: 10, $offset: 500, ...`
	 *
	 * For MySQL you have to use `OFFSET` option always with `LIMIT`. See the
	 * official docs [https://dev.mysql.com/doc/refman/5.7/en/select.html](https://dev.mysql.com/doc/refman/5.7/en/select.html)
	 */
	/*sqlBuilder.registerHelper('$offset', function(offset, outerQuery, identifier){
		// on MySQL we can't use offset without limit
		if (this.sqlDialect == 'mysql' && !('$limit' in outerQuery)) {
			throw new Error ('Can\'t use $offset without $limit.');
		}

		if (_.isNumber(offset)) {
			return 'OFFSET ' + this.addValue(offset);
		} else {
			throw new Error ('$offset must be a number.');
		}
	});*/
	sqlBuilder.registerSyntax('$offset', {
		description: 'Specifies the `OFFSET` clause for the `SELECT` Statement.',
		supportedBy: {
			mysql: 'https://dev.mysql.com/doc/refman/5.7/en/select.html',
			postgreSQL: 'https://www.postgresql.org/docs/9.5/static/sql-select.html',
			sqlite: 'https://sqlite.org/lang_select.html'
		},
		definition: {
			allowedTypes: {
				Number: { syntax: '<value-param>' },
			}
		},
		hooks: {
			comments: [
				{
					note: `For MySQL you have to use \`OFFSET\` clause always with \`LIMIT\`. See the
							official docs [https://dev.mysql.com/doc/refman/5.7/en/select.html](https://dev.mysql.com/doc/refman/5.7/en/select.html)`
				}
			],
			beforeExecute: function(query, options) {
				if (options.sqlDialect == 'mysql' && !options.outerQuery.$limit) {
					throw new Error('For MySQL you can\'t use $offset without $limit.');
				}
				return query;
			}
		},
		examples: {
			Number: {
				basicUsage: {
					test: {
						$select: {
							$from: 'people',
							$limit: 20,
							$offset: 10
						}
					},
					expectedResult: {
						sql: 'SELECT * FROM people LIMIT $1 OFFSET $2',
						values: {
							$1: 20,
							$2: 10
						}
					}
				},
				"MySQL using OFFSET without LIMIT will end in an Exception": {
					supportedBy: {
						mysql: true
					},
					test: {
						$select: {
							$from: 'people',
							$offset: 10
						}
					},
					expectedResult: {
						exception: 'For MySQL you can\'t use $offset without $limit.',
						sql: ''
					}
				}
			}
		}
	});
};
