'use strict';

const _ 		= require('lodash');
const pgFormat	= require('pg-format');

function jsonBuildHelper(operator, sql, json, outerQuery, identifier){
	if (!_.isPlainObject(json)){
		throw new Error(operator + ' must be an Object.');
	}

	// Check if the key startsWith ~, then
	// it will be an identifier and will not quoted as string
	/*var getKeyIdent = (key) => {
		if (key.startsWith('~')){
			return this.quote(key.substring(1));
		} else {
			return pgFormat('%L', key);
		}
	}*/

	var results = [];
	_.forEach(json, (value, key) => {
		if (_.isPlainObject(value)) {
			//results.push(getKeyIdent(key) + ", " + this.build(value));
			results.push(this.addValue(key) + ", " + this.build(value));
		} else {
			//results.push(getKeyIdent(key) + ", " + this.addValue(value));
			results.push(this.addValue(key) + ", " + this.addValue(value));
		}
	});

	return sql + '(' + results.join(', ') + ')' // V2 + this.aliasIdent(identifier);
}

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
		return jsonBuildHelper.call(this, '$jsonBuildObject', 'json_build_object', json, outerQuery, identifier);
	});

	/**
	 * @name $jsonbBuildObject
	 * @summary Specifies the `jsonb_build_object` function.
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
	 * 			{ peopleData: { $jsonbBuildObject: { firstName: 'John', lastName: 'Doe' } } }
	 * 		]
	 * 	}
	 * });
	 * ```
	 *
	 */
	sqlBuilder.registerHelper('$jsonbBuildObject', function(json, outerQuery, identifier){
		return jsonBuildHelper.call(this, '$jsonbBuildObject', 'jsonb_build_object', json, outerQuery, identifier);
	});

	/**
	 * @name $jsonbObjectAgg
	 * @summary Specifies the `jsonb_object_agg` function.
	 * @memberOf JSON
	 * @ishelper true
	 * @postgres true
	 *
	 * @param key	{Property}	Specifies the key value or column
	 * @param value	{Primitive | Object}	Specifies the value part as primitive or column expression.
	 *
	 * ```javascript
	 * var query = sqlbuilder.build({
	 * 	$select: {
	 * 		$from: {
	 * 			data: { $jsonb_each: '{"a":1, "b":2}' }
	 * 		},
	 * 		$columns: [
	 * 			{ output: { $jsonbObjectAgg: { "~~data.key": "~~data.value" } } }
	 * 		]
	 * 	}
	 * });
	 *
	 * // SQL-Output
	 * SELECT
	 * 	jsonb_object_agg(data.key, data.value)
	 * FROM
	 * 	jsonb_each('{"a":1, "b":2}') AS data;
	 * ```
	 *
	 */
	sqlBuilder.registerHelper('$jsonbObjectAgg', function(json, outerQuery, identifier){
		return jsonBuildHelper.call(this, '$jsonbObjectAgg', 'jsonb_object_agg', json, outerQuery, identifier);
	});

	/**
	 * @name $jsonbEach
	 * @summary Specifies the `jsonb_each` function.
	 * @memberOf JSON
	 * @ishelper true
	 * @postgres true
	 *
	 * @param json	{String}	Specifies an the json-data column used by the function
	 *
	 * ```javascript
	 * var query = sqlbuilder.build({
	 * 	$select: {
	 * 		$from: { $jsonb_each: '{"a": 1, "b": 2}' },
	 * 	}
	 * });
	 * ```
	 *
	 */
	sqlBuilder.registerHelper('$jsonbEach', function(json, outerQuery, identifier){
		if (_.isString(json)) {
			return 'jsonb_each(' + this.addValue(json) + ')' // V2 + this.aliasIdent(identifier);
		} else if (_.isPlainObject(json)) {
			return 'jsonb_each(' + this.build(json) + ')' // V2 + this.aliasIdent(identifier);
		} else {
			throw new Error('$jsonbEach must be either an Object or a string.');
		}
	});
}
