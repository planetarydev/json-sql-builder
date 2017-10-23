'use strict';

const _ 		= require('lodash');
const helpers 	= require('../ansi/helpers');

module.exports = function(sqlBuilder) {

	/**
	 * @name $jsonAgg
	 * @summary Specifies the json_agg aggregation.
	 * @memberOf Aggregation
	 * @ishelper true
	 * @postgres true
	 *
	 * @param expr 	 		{Property}	Specifies an Expression, Column name either table.column or column
	 * @param identifier	{String}	Specifies the column to aggregate.
	 *
	 * ```javascript
	 * var query = sqlbuilder.build({
	 * 	$select: {
	 * 		$from: 'people',
	 * 		$columns: [
	 * 			'user_id',
	 * 			{ tokens: { $json: { $jsonAgg: 'hashed_token' } } }
 	 * 		],
	 * 		$groupBy: ['user_id']
 	 * 	}
	 * });
	 * ```
	 *
	 */
	sqlBuilder.registerHelper('$jsonAgg', function(jsonAgg, outerQuery, identifier){
		var result = ''
		if (_.isPlainObject(jsonAgg)){
			result = 'json_agg(' + this.build(jsonAgg) + ')';
		}
		else if (_.isString(jsonAgg)){
			result = 'json_agg(' + this.quote(jsonAgg) + ')';
		}
		else {
			throw new Error('$jsonAgg must be either an Object or a string.');
		}

		if (identifier){
			result += ' AS ' + this.quote(identifier);
		}
		return result;
	});

	/**
	 * @name $json
	 * @summary Specifies the to_json function.
	 * @memberOf Aggregation
	 * @ishelper true
	 * @postgres true
	 *
	 * @param expr 	 		{Property}	Specifies an Expression, Column name either table.column or column
	 * @param identifier	{String}	Specifies the column to aggregate.
	 *
	 * ```javascript
	 * var query = sqlbuilder.build({
	 * 	$select: {
	 * 		$from: 'people',
	 * 		$columns: [
	 * 			'user_id',
	 * 			{ tokens: { $json: { $jsonAgg: 'hashed_token' } } }
 	 * 		],
	 * 		$groupBy: ['user_id']
 	 * 	}
	 * });
	 * ```
	 *
	 */
	sqlBuilder.registerHelper('$json', function(json, outerQuery, identifier){
		var result = ''
		if (_.isPlainObject(json)){
			result = 'to_json(' + this.build(json) + ')';
		}
		else if (_.isString(json)){
			result = 'to_json(' + this.quote(json) + ')';
		}
		else {
			throw new Error('$json must be either an Object or a string.');
		}

		if (identifier){
			result += ' AS ' + this.quote(identifier);
		}
		return result;
	});
}
