'use strict';

const _ = require('lodash');

module.exports = function(sqlBuilder){
	/**
	 * @name $and
	 * @summary The logical operator joins all given items with a logical AND
	 * @memberOf Logical
	 * @ishelper true
	 * @ansi true
	 *
	 * @param expr 	 {Array}	Specifies the items that should be joined
	 */
 	/*sqlBuilder.registerHelper('$and', function(query, outerQuery, identifier){
		var results = [];

		if (!_.isArray(query)){
			throw new Error('$and must be an array.');
		}


		_.forEach(query, (andItem) => {
			if (_.isPlainObject(andItem)) {
				results.push(this.build(andItem));
			} else {
				throw new Error('Each item using locical operator $and must be an object.');
			}
		});

		if (results.length > 0){
			return '(' + results.join(' AND ') + ')';
		} else {
			return '';
		}
	});*/

	sqlBuilder.registerSyntax('$and', {
		description: 'Specifies the locical `AND` Operator.',
		supportedBy: {
			mysql: 'https://dev.mysql.com/doc/refman/5.7/en/select.html',
			postgreSQL: 'https://www.postgresql.org/docs/9.5/static/sql-select.html',
			sqlite: 'https://sqlite.org/lang_select.html#whereclause'
		},
		definition: {
			allowedTypes: {
				Array: {
					eachItemOf: {
						Object: { syntax: '<value>[  AND ... ]', passIdentifier: true }
					},
					finalSyntax: '(<result>)'
				}
			}
		},
		examples: {
			Array: {
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
						},
						"Query with nested AND, OR": {
							test: {
								$select: {
									$from: 'people',
									$where: {
										$and : [
											{ first_name: 'John' },
											{ last_name: { $eq: 'Doe' } },
											{
												$or : [
													{ age : { $gt: 18 } },
													{ gender : { $ne: 'female' } }
												]
											}
										]
									}
								}
							},
							expectedResult: {
								sql: 'SELECT * FROM people WHERE first_name = $1 AND last_name = $2 AND (age > $3 OR gender != $4)',
								values: {
									$1: 'John',
									$2: 'Doe',
									$3: 18,
									$4: 'female'
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
	 * @name $or
	 * @summary The logical operator joins all given items with a logical OR
	 * @memberOf Logical
	 * @ishelper true
	 * @ansi true
	 *
	 * @param expr 	 {Array}	Specifies the items that should be joined
	 */
	/*sqlBuilder.registerHelper('$or', function(query, outerQuery, identifier){
		var results = [];

		if (!_.isArray(query)){
			throw new Error('$or must be an array.');
		}

		_.forEach(query, (andItem) => {
			if (_.isPlainObject(andItem)) {
				results.push(this.build(andItem));
			} else {
				throw new Error('Each item using locical operator $or must be an object.');
			}
		});

		if (results.length > 0){
			return '(' + results.join(' OR ') + ')';
		} else {
			return '';
		}
	});*/
	sqlBuilder.registerSyntax('$or', {
		description: 'Specifies the locical `OR` Operator.',
		supportedBy: {
			mysql: 'https://dev.mysql.com/doc/refman/5.7/en/select.html',
			postgreSQL: 'https://www.postgresql.org/docs/9.5/static/sql-select.html',
			sqlite: 'https://sqlite.org/lang_select.html#whereclause'
		},
		definition: {
			allowedTypes: {
				Array: {
					eachItemOf: {
						Object: { syntax: '<value>[  OR ... ]', passIdentifier: true }
					}
				}
			}
		},
		hooks: {
			afterExecute: function(result) {
				if (this.isCurrent('$and')) {
					result = '(' + result + ')'
				}
				return result;
			}
		},
		examples: {
			Array: {
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
};
