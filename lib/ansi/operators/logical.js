'use strict';

const _ = require('lodash');

module.exports = function(sqlBuilder){
	/**
	 * @name $and
	 * @summary The logical operator joins all given items with a logical AND
	 * @memberOf Logical
	 * @isquerying true
	 * @ansi true
	 *
	 * @param expr 	 {Array}	Specifies the items that should be joined
	 */
	sqlBuilder.registerHelper('$and', function(query/*, outerQuery, identifier*/){
		var results = [];

		if (!_.isArray(query)){
			throw new Error('$and must be an array.');
		}

		/* Example
		$where: {
			$and : [
				{ first_name: 'John' },
				{ last_name: { $eq: 'Doe' } },
				{ $or : [
					{ age : { $gt: 18 } },
					{ gender : { $ne: 'female' } }
				]}
			]
		}*/
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
	});

	/**
	 * @name $or
	 * @summary The logical operator joins all given items with a logical OR
	 * @memberOf Logical
	 * @isquerying true
	 * @ansi true
	 *
	 * @param expr 	 {Array}	Specifies the items that should be joined
	 */
	sqlBuilder.registerHelper('$or', function(query/*, outerQuery, identifier*/){
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
	});
};
