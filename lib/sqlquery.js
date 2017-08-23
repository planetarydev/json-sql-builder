'use strict';

class _SQLQuery {
	constructor(sql, values, timeout){
		var _sql = sql,
			_values = values,
			_timeout = timeout || 10000;

		this._object = function(){
			return {
				sql: _sql,
				values: _values,
				timeout: _timeout
			};
		};
	}

	get sql(){
		return this._object().sql;
	}

	get values() {
		return this._object().values;
	}

	get timeout(){
		return this._object().timeout;
	}
}

module.exports = _SQLQuery;
