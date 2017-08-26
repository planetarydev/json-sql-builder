'use strict';

module.exports = function(sqlBuilder){
	// Setup the specific MySQL value placeholder and quotes for the identifiers
	sqlBuilder.placeholder = function(){
		//postgreSQL style: return '$' + this._values.length;
		return '?';
	};
	sqlBuilder.quoteChar = '`'; // MySQL uses the backticks to quote like `column`.`table`
	sqlBuilder.wildcardChar = '%';

	require('./select')(sqlBuilder);
};
