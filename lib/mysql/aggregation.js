'use strict';

const _ 		= require('lodash');
const helpers 	= require('../ansi/helpers');

module.exports = function(sqlBuilder) {

	/**
	 * @name $groupConcat
	 * @summary Specifies the `GROUP_CONCAT` aggregation function using language dialect MySQL.
	 *
	 * **Syntax:**
	 * ```syntax
	 * GROUP_CONCAT ( [$distinct] <$column> [$sort] [$orderBy] [$separator] )
	 * ```
	 *
	 * @memberOf Aggregation
	 * @ishelper true
	 * @mysql true
	 *
	 * @param groupConcat	 {String | Object}
	 * - groupConcat as **String** like: `$select: { $columns: ['first_name', { $groupConcat: 'last_name' } ], ... }`
	 * - groupConcat as **Object** like: `$select: { $columns: ['first_name', { $groupConcat: { $sort: { last_name: -1 }, $separator: ' - ' } } ] ... }`
	 */
	sqlBuilder.registerHelper('$groupConcat', function(groupConcat, outerQuery, identifier){
		// check for standard group_contact without addinal stuff
		if (_.isString(groupConcat)){
			return helpers.aggregation.call(this, 'GROUP_CONCAT', groupConcat, outerQuery, identifier);
		} else if (_.isPlainObject(groupConcat)) {
			return 'GROUP_CONCAT(' + this.build(groupConcat, identifier, this.getSyntax('$groupConcat')) + ')' + (identifier ? ' AS ' + this.quote(identifier) : '');
		}
	}, 'GROUP_CONCAT ( [$distinct] <$column> [$sort] [$orderBy] [$separator] )');

	/**
	 * @name $separator
	 * @summary Specifies the `SEPERATOR` option for the `GROUP_CONCAT` aggregation function using language dialect MySQL.
	 *
	 * @memberOf Aggregation.$groupConcat
	 * @ishelper true
	 * @mysql true
	 *
	 * @param separator	 {String}
	 * - `$select: { $columns: ['first_name', { $groupConcat: { $sort: { last_name: -1 }, $separator: ' - ' } } ] ... }`
	 */
	sqlBuilder.registerHelper('$separator', function(separator/*, outerQuery, identifier*/){
		if (!_.isString(separator)) {
			throw new Error ('$separator must be a string.');
		}
		return 'SEPERATOR ' + this.addValue(separator);
	});
}
