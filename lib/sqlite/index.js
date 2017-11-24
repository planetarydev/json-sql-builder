'use strict';

module.exports = function(sqlBuilder){
	// Setup the specific SQLite value placeholder and quotes for the identifiers
	sqlBuilder.placeholder = function(){
		return '?';
	};
	sqlBuilder.quoteChar = '"'; // SQLite uses the double-quotes to quote like "column"."table"
	sqlBuilder.wildcardChar = '%';
};
