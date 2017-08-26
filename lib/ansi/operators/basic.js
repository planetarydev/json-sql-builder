'use strict';

const _ = require('lodash');


module.exports = function(sqlBuilder){

	sqlBuilder.registerHelper('$as', function(alias, outerQuery, identifier){
		if (identifier){
			return this.quote(identifier) + ' AS ' + this.quote(alias);
		} else {
			return 'AS ' + this.quote(alias);
		}
	});

	sqlBuilder.registerHelper('$alias', function(alias, outerQuery, identifier){
		// only an alias for $as :-)
		return sqlBuilder.callHelper('$as', alias, outerQuery, identifier);
	});

	sqlBuilder.registerHelper('$expr', function(expr/*, outerQuery, identifier*/){
		return this.build(expr);
	});

	sqlBuilder.registerHelper('$column', function(column/*, outerQuery, identifier*/){
		if (_.isString(column)){
			return this.quote(column);
		} else {
			throw new Error ('$column must be a string.');
		}
	});

	sqlBuilder.registerHelper('$val', function(val, outerQuery, identifier){
		if (identifier) {
			return this.addValue(val) + ' AS ' + this.quote(identifier);
		} else {
			return this.addValue(val);
		}
	});
};
