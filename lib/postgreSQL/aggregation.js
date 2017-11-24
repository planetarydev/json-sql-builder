'use strict';

const _ 		= require('lodash');
const helpers 	= require('../ansi/helpers');

module.exports = function(sqlBuilder) {

	/**
	 * @name $stringAgg
	 * @summary Specifies the `string_agg` aggregation function using language dialect postgreSQL.
	 *
	 * **Syntax:**
	 * ```syntax
	 * string_agg( <$expression>, <$delimiter> )
	 * ```
	 *
	 * @memberOf Aggregation
	 * @ishelper true
	 * @postgres true
	 *
	 * @param stringAgg	 {String | Object}
	 * - stringAgg as **String** like: `$select: { $columns: ['first_name', { $stringAgg: 'last_name' } ], ... }`
	 * - stringAgg as **Object** like: `$select: { $columns: ['first_name', { $stringAgg: { $column: 'last_name', $separator: ' - ' } } ] ... }`
	 */

	/*sqlBuilder.registerSyntax('$jsonBuildObject', {
 		allowedTypes: {
 			Object: `json_build_object($each<key>, <value>each$) [AS <identifier>]`
 		}
 	}*/

 	sqlBuilder.registerSyntax('$stringAgg', {
		description: 'Specifies the `string_agg` aggregation function.',
		supportedBy: {
			postgreSQL: 'https://www.postgresql.org/docs/9.4/static/functions-aggregate.html#FUNCTIONS-AGGREGATE-TABLE'
		},
		definition: {
			allowedTypes: {
	 			Object: { syntax: `string_agg(<$expression>, <$delimiter>) [AS <identifier>]` },
	 			String: { syntax: `string_agg(<value>, ', ') [AS <identifier>]` }
			},
			belongsTo: {
				$columns: true
			}
 		},
		examples: {
			Object: {
				basicUsage: {
					test: {
						$select: {
							skills: { $stringAgg: { $expression: '~~skill', $delimiter: ', ' } },
							$from: 'people_skills'
						}
					},
					expectedResult: {
						sql: 'SELECT string_agg(skill, $1) AS skills FROM people_skills',
						values: {
							$1: ", "
						}
					}
				}
			},
			String: {
				basicUsage: {
					test: {
						$select: {
							skills: { $stringAgg: '~~skill' },
							$from: 'people_skills'
						}
					},
					expectedResult: {
						sql: `SELECT string_agg(skill, $1) AS skills FROM people_skills`,
						values: {
							$1: ", "
						}
					}
				}
			}
		}
 	});

	/*sqlBuilder.registerHelper('$stringAgg', function(stringAgg, outerQuery, identifier){
		// check for standard stringAgg without addinal stuff
		if (_.isString(stringAgg)){
			return 'string_agg(' + this.addValue(stringAgg) + ', \', \')' + this.aliasIdent(identifier);
		} else if (_.isPlainObject(stringAgg)) {
			return 'string_agg(' + this.build(stringAgg, identifier, this.getSyntax('$stringAgg'), undefined, ', ') + ')' + this.aliasIdent(identifier);
		}
	}, 'string_agg( <$expression>, <$delimiter> )');*/

	/**
	 * @name $expression
	 * @summary Specifies the expression argument for the `string_agg` aggregation function using language dialect postgreSQL.
	 *
	 * @memberOf Aggregation.$stringAgg
	 * @ishelper true
	 * @postgres true
	 *
	 * @param expression {String | Object}
	 * - `$select: { $columns: ['first_name', { $stringAgg: { $expression: 'last_name', $delimiter: ', ' } } ] ... }`
	 */
	 sqlBuilder.registerSyntax('$expression', {
		description: 'Specifies the *expression* argument for the `string_agg` aggregation function.',
		supportedBy: {
			postgreSQL: 'https://www.postgresql.org/docs/9.4/static/functions-aggregate.html#FUNCTIONS-AGGREGATE-TABLE'
		},
		definition: {
	  		allowedTypes: {
	  			Object: { syntax: `<$column>` },
	  			String: { syntax: `<value>` },
	  		},
			belongsTo: {
				$stringAgg: true
			}
		},
		examples: {
			Object: {
				basicUsage: {
					test: {
						$select: {
							skills: { $stringAgg: { $expression: { $column: 'skill' }, $delimiter: ", " } },
							$from: 'people_skills'
						}
					},
					expectedResult: {
						sql: 'SELECT string_agg("skill", $1) AS "skills" FROM "people_skills"',
						values: {
							$1: ", "
						}
					}
				}
			},
			String: {
				basicUsage: {
					test: {
						$select: {
							skills: { $stringAgg: { $expression: '~~skill' } },
							$from: 'people_skills'
						}
					},
					expectedResult: {
						sql: `SELECT string_agg(skill, $1) AS skills FROM people_skills`,
						values: {
							$1: ", "
						}
					}
				}
			}
		}
  	});

	/*sqlBuilder.registerHelper('$expression', function(expression, outerQuery, identifier){
		if (_.isString(expression)) {
			return this.addValue(expression) + this.aliasIdent(identifier);
		} else if (_.isPlainObject(expression)) {
			return this.build(expression) + this.aliasIdent(identifier);
		} else {
			throw new Error ('$expression must be type of String or Object.');
		}
	});*/

	/**
	 * @name $delimiter
	 * @summary Specifies the delimiter argument for the `string_agg` aggregation function using language dialect postgreSQL.
	 *
	 * @memberOf Aggregation.$stringAgg
	 * @ishelper true
	 * @postgres true
	 *
	 * @param delimiter	 {String}
	 * - `$select: { $columns: ['first_name', { $stringAgg: { $expression: 'last_name', $delimiter: ', ' } } ] ... }`
	 */
	sqlBuilder.registerHelper('$delimiter', function(delimiter/*, outerQuery, identifier*/){
		if (!_.isString(delimiter)) {
			throw new Error ('$delimiter must be a string.');
		}
		return this.addValue(delimiter);
	});
}
