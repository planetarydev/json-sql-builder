'use strict';

const helpers = require('../helpers');

module.exports = function(sqlBuilder){
	/**
	 * @name $count
	 * @summary Specifies the COUNT aggregation.
	 * @memberOf Aggregation
	 * @isquerying true
	 * @ansi true
	 *
	 * @param expr 	 		{Property}	Specifies an Expression, Column name either table.column or column
	 * @param identifier	{String}	Specifies the column to count.
	 */
	sqlBuilder.registerHelper('$count', function(aggregation, outerQuery, identifier){
		return helpers.aggregation.call(this, 'COUNT', aggregation, outerQuery, identifier);
	});

	/**
	 * @name $sum
	 * @summary Specifies the SUM aggregation.
	 * @memberOf Aggregation
	 * @isquerying true
	 * @ansi true
	 *
	 * @param expr 	 		{Property}	Specifies an Expression, Column name either table.column or column
	 * @param identifier	{String}	Specifies the column to used on SUM aggregate.
	 */
	sqlBuilder.registerHelper('$sum', function(aggregation, outerQuery, identifier){
		return helpers.aggregation.call(this, 'SUM', aggregation, outerQuery, identifier);
	});

	/**
	 * @name $min
	 * @summary Specifies the MIN aggregation.
	 * @memberOf Aggregation
	 * @isquerying true
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
	 * @isquerying true
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
	 * @isquerying true
	 * @ansi true
	 *
	 * @param expr 	 		{Property}	Specifies an Expression, Column name either table.column or column
	 * @param identifier	{String}	Specifies the column to used on AVG aggregate.
	 */
	sqlBuilder.registerHelper('$avg', function(aggregation, outerQuery, identifier){
		return helpers.aggregation.call(this, 'AVG', aggregation, outerQuery, identifier);
	});
};
