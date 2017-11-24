'use strict';

const helpers = require('../helpers');

module.exports = function(sqlBuilder){
	/**
	 * @name $count
	 * @summary Specifies the COUNT aggregation.
	 * @memberOf Aggregation
	 * @ishelper true
	 * @ansi true
	 *
	 * @param expr 	 		{Property}	Specifies an Expression, Column name either table.column or column
	 * @param identifier	{String}	Specifies the column to count.
	 */
	/*sqlBuilder.registerHelper('$count', function(aggregation, outerQuery, identifier){
		return helpers.aggregation.call(this, 'COUNT', aggregation, outerQuery, identifier);
	});*/
	sqlBuilder.registerSyntax('$count', {
		description: `Specifies the \`COUNT\` aggregation function.`,
		supportedBy: {
			mysql: 'https://dev.mysql.com/doc/refman/5.7/en/group-by-functions.html#function_count',
			postgreSQL: 'https://www.postgresql.org/docs/9.5/static/functions-aggregate.html',
			sqlite: 'https://sqlite.org/lang_aggfunc.html#count'
		},
		definition: {
			allowedTypes: {
				String: { syntax: 'COUNT(<value-ident>)' }
			}
		},
		examples: {
			String: {
				basicUsage: {
					test: {
						$select: {
							city: true,
							citycnt: { $count: 'city' },

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
			}
		}
	});

	/**
	 * @name $sum
	 * @summary Specifies the SUM aggregation.
	 * @memberOf Aggregation
	 * @ishelper true
	 * @ansi true
	 *
	 * @param expr 	 		{Property}	Specifies an Expression, Column name either table.column or column
	 * @param identifier	{String}	Specifies the column to used on SUM aggregate.
	 */
	/*sqlBuilder.registerHelper('$sum', function(aggregation, outerQuery, identifier){
		return helpers.aggregation.call(this, 'SUM', aggregation, outerQuery, identifier);
	});*/
	sqlBuilder.registerSyntax('$sum', {
		description: `Specifies the \`SUM\` aggregation function.`,
		supportedBy: {
			mysql: 'https://dev.mysql.com/doc/refman/5.7/en/group-by-functions.html#function_sum',
			postgreSQL: 'https://www.postgresql.org/docs/9.5/static/functions-aggregate.html',
			sqlite: 'https://sqlite.org/lang_aggfunc.html#sum'
		},
		definition: {
			allowedTypes: {
				String: { syntax: 'SUM(<value-ident>)' }
			}
		},
		examples: {
			String: {
				basicUsage: {
					test: {
						$select: {
							city: true,
							total_salary: { $sum: 'salary' },
							$from: 'people',
							$groupBy: {
								city: true
							}
						}
					},
					expectedResult: {
						sql: 'SELECT city, SUM(salary) AS total_salary FROM people GROUP BY city'
					}
				}
			}
		}
	});
	/**
	 * @name $min
	 * @summary Specifies the MIN aggregation.
	 * @memberOf Aggregation
	 * @ishelper true
	 * @ansi true
	 *
	 * @param expr 	 		{Property}	Specifies an Expression, Column name either table.column or column
	 * @param identifier	{String}	Specifies the column to used on MIN aggregate.
	 */
	sqlBuilder.registerHelper('$min', function(aggregation, outerQuery, identifier){
		return helpers.aggregation.call(this, 'MIN', aggregation, outerQuery, identifier);
	});

	/**
	 * @name $max
	 * @summary Specifies the MAX aggregation.
	 * @memberOf Aggregation
	 * @ishelper true
	 * @ansi true
	 *
	 * @param expr 	 		{Property}	Specifies an Expression, Column name either table.column or column
	 * @param identifier	{String}	Specifies the column to used on MAX aggregate.
	 */
	sqlBuilder.registerHelper('$max', function(aggregation, outerQuery, identifier){
		return helpers.aggregation.call(this, 'MAX', aggregation, outerQuery, identifier);
	});

	/**
	 * @name $avg
	 * @summary Specifies the AVG aggregation.
	 * @memberOf Aggregation
	 * @ishelper true
	 * @ansi true
	 *
	 * @param expr 	 		{Property}	Specifies an Expression, Column name either table.column or column
	 * @param identifier	{String}	Specifies the column to used on AVG aggregate.
	 */
	sqlBuilder.registerHelper('$avg', function(aggregation, outerQuery, identifier){
		return helpers.aggregation.call(this, 'AVG', aggregation, outerQuery, identifier);
	});
};
