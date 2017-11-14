'use strict';

const _ 		= require('lodash');
const helpers 	= require('../ansi/helpers');

module.exports = function(sqlBuilder) {

	/**
	 * @name $jsonAgg
	 * @summary Specifies the json_agg aggregation.
	 * @memberOf JSON
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
	 * @memberOf JSON
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

	/**
	 * @name $rowToJson
	 * @summary Specifies the `row_to_json` function.
	 * @memberOf JSON
	 * @ishelper true
	 * @postgres true
	 *
	 * @param expr	{Property}	Specifies an Expression, Column name either table.column or column
	 * @param row	{String}	Specifies the record, row to convert as json.
	 *
	 * ```javascript
	 * var query = sqlbuilder.build({
	 * 	$select: {
	 * 		$from: 'people',
	 * 		$columns: [
	 * 			{ peopleData: { $rowToJson: 'people' } }
 	 * 		]
 	 * 	}
	 * });
	 * ```
	 *
	 */
	sqlBuilder.registerHelper('$rowToJson', function(json, outerQuery, identifier){
		var result = ''
		if (_.isPlainObject(json)){
			result = 'row_to_json(' + this.build(json) + ')';
		}
		else if (_.isString(json)){
			result = 'row_to_json(' + this.quote(json) + ')';
		}
		else {
			throw new Error('$rowToJson must be either an Object or a string.');
		}

		if (identifier){
			result += ' AS ' + this.quote(identifier);
		}
		return result;
	});

	/**
	 * @name $jsonBuildObject
	 * @summary Specifies the `json_build_object` function.
	 * @memberOf JSON
	 * @ishelper true
	 * @postgres true
	 *
	 * @param expr	{Property}	Specifies an Expression, Column name either table.column or column
	 * @param obj	{Object}	Specifies the Object to build.
	 *
	 * ```javascript
	 * var query = sqlbuilder.build({
	 * 	$select: {
	 * 		$from: 'people',
	 * 		$columns: [
	 * 			{ peopleData: { $jsonBuildObject: { firstName: 'John', lastName: 'Doe' } } }
	 * 		]
	 * 	}
	 * });
	 * ```
	 *
	 */
	sqlBuilder.registerHelper('$jsonBuildObject', function(json, outerQuery, identifier){
		if (!_.isPlainObject(json)){
			throw new Error('$jsonBuildObject must be an Object.');
		}

		var results = [];
		_.forEach(json, (value, key) => {
			if (_.isPlainObject(value)) {
				results.push("'" + key + "', " + this.build(value));
			} else {
				results.push("'" + key + "', " + this.addValue(value));
			}
		});

		return 'json_build_object(' + results.join(', ') + ')' + (identifier ? ' AS ' + this.quote(identifier) : '');
	});
}
