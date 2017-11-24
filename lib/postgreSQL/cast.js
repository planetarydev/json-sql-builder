'use strict';

const _ 		= require('lodash');
const helpers 	= require('../ansi/helpers');

module.exports = function(sqlBuilder) {

	/**
	 * @name $castText
	 * @summary Specifies the `::text` cast function using language dialect postgreSQL.
	 *
	 * @memberOf Cast
	 * @ishelper true
	 * @postgres true
	 *
	 * @param cast	 {Object} Specifies the expression to cast
	 *
	 * ```javascript
	 * var query = sqlbuilder.build({
	 * 	$select: {
	 * 		$from: 'people',
	 * 		$columns: [
	 * 			'user_id',
	 * 			{ tokens: { $castText: { $jsonAgg: 'hashed_token' } } }
 	 * 		],
	 * 		$groupBy: ['user_id']
 	 * 	}
	 * });
	 * ```
	 *
	 */
	sqlBuilder.registerHelper('$castText', function(cast, outerQuery, identifier){
		if (_.isPlainObject(cast)) {
			return this.build(cast) + '::text' + this.aliasIdent(identifier);
		} else {
			throw new Error ('$castText must be a string.');
		}
	});
}
