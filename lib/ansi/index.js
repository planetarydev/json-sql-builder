'use strict';

module.exports = function(sqlBuilder){
	require('./operators/basic')(sqlBuilder);
	require('./operators/logical')(sqlBuilder);
	require('./operators/aggregation')(sqlBuilder);
	require('./operators/comparison')(sqlBuilder);
	require('./operators/functions')(sqlBuilder);
	require('./select')(sqlBuilder);
	require('./joins')(sqlBuilder);
	require('./union')(sqlBuilder);
	require('./insert')(sqlBuilder);
	require('./update')(sqlBuilder);
	require('./delete')(sqlBuilder);
	require('./create-table')(sqlBuilder);
	require('./create-index')(sqlBuilder);
};
