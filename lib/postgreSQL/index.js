'use strict';

module.exports = function(sqlBuilder){
	// Setup the specific postgeSQL value placeholder and quotes for the identifiers
	sqlBuilder.placeholder = function(){
		// this returns $1, $2, etc.
		return '$' + this._values.length;
	};

	// postgeSQL uses the double-quotes like "column"."table"
	sqlBuilder.quoteChar = '"';

	sqlBuilder.wildcardChar = '%';

	// TODO: add specific syntax and select helpers
	require('./json')(sqlBuilder);
	require('./select')(sqlBuilder);
	require('./insert')(sqlBuilder);
	require('./create-table')(sqlBuilder);
};
