'use strict';

const _ = require('lodash');


module.exports = function($ql){
	/**
	 * @name $left
	 * @memberOf String
	 * @isfunction
	 * @mysql true
	 *
	 * @summary Specifies the `LEFT()` function.
	 *
	 * @param {Property} identifier	Specifies original column, table, ... name.
	 * @param {String} alias  		Specifies alias name.
	 */
	/*sqlBuilder.registerHelper('$left', function(args, outerQuery, identifier){
		if (identifier){
			if (this.isCurrent('$columns')){
				return 'LEFT(' + this.quote(args[0]) + ', ' + this.addValue(args[1]) + ') AS ' + this.quote(identifier);
			} else {
				return this.quote(identifier) + ' = LEFT(' + this.quote(args[0]) + ', ' + this.addValue(args[1]) + ')';
			}
		} else {
			return 'LEFT(' + this.quote(args[0]) + ', ' + this.addValue(args[1]) + ')';
		}
	});*/
	$ql.registerSyntax('$left', {
		description: 'Specifies the `LEFT` function.',
		supportedBy: {
			mysql: 'http://',
			postgreSQL: 'https://',
		},
		definition: {
			allowedTypes: {
				Object: { syntax: 'LEFT(<$text>, <$n>)', function: true }
			},
			function: {
				params: {
					0: { type: 'String', name: '$text', description: 'Specifies the $text parameter' },
					1: { type: 'Number', name: '$n', description: 'Specifies the number of characters taken from the left side of the $text parameter' },
				},
				inline: function($text, $n) {
					if (!_.isString($text) && !_.isFunction($text)) {
						throw new Error('Using Method $ql.left the Parameter $text must be a String or Function');
					}
					if (!_.isNumber($n) && !_.isFunction($n)) {
						throw new Error('Using Method $ql.left the Parameter $n must be a Number or Function');
					}

					return function() {
						let template = 'LEFT(<$text>, <$n>)';
						template = template.replace('<$text>', _.isFunction($text) ? $text.call(this) : this.addValue($text));
						template = template.replace('<$n>', _.isFunction($n) ? $n.call(this) : this.addValue($n));
						return template;
					}
				}
			}
		},
		examples: {
			Object: {
				basicUsage: {
					test: {
						$select: {
							first_name: { $left: { $text: 'Hallo', $n: 1 } },
							$from: 'people'
						}
					},
					expectedResult: {
						sql: 'SELECT LEFT($1, $2) AS first_name FROM people',
						values: {
							$1: 'Hallo',
							$2: 1
						}
					}
				}
			}
		}
	});

	$ql.registerSyntax('$right', {
		description: 'Specifies the `RIGHT` function.',
		supportedBy: {
			mysql: 'http://',
			postgreSQL: 'https://',
		},
		definition: {
			allowedTypes: {
				Object: { syntax: 'RIGHT(<$text>, <$n>)' }
			}
		},
		examples: {
			Object: {
				basicUsage: {
					test: {
						$select: {
							first_name: { $right: { $text: '~~first_name', $n: 1 } },
							$from: 'people'
						}
					},
					expectedResult: {
						sql: 'SELECT RIGHT(first_name, $1) AS first_name FROM people',
						values: {
							$1: 1
						}
					}
				}
			}
		}
	});

	$ql.registerSyntax('$len', {
		description: 'Specifies the `LENGTH` function.',
		supportedBy: {
			mysql: 'http://',
			postgreSQL: 'https://',
		},
		definition: {
			allowedTypes: {
				String: { syntax: 'LENGTH(<value-param>)' },
				Object: { syntax: 'LENGTH(<$text>)' }
			}
		},
		examples: {
			String: {
				basicUsage: {
					test: {
						$select: {
							length_of_first_name: { $len: '~~first_name' },
							$from: 'people'
						}
					},
					expectedResult: {
						sql: 'SELECT LENGTH(first_name) AS length_of_first_name FROM people'
					}
				}
			},
			Object: {
				basicUsage: {
					test: {
						$select: {
							length_of_first_name: { $len: { $text: '~~first_name' } },
							$from: 'people'
						}
					},
					expectedResult: {
						sql: 'SELECT LENGTH(first_name) AS length_of_first_name FROM people'
					}
				}
			}
		}
	});

	$ql.registerSyntax('$text', {
		description: 'Specifies a String or Text Parameter for a $ql function.',
		supportedBy: {
			mysql: 'http://',
			postgreSQL: 'https://',
		},
		definition: {
			allowedTypes: {
				String: { syntax: '<value-param>' },
				Object: { syntax: '<value>' }
			}
		},
		examples: {
			String: {
				basicUsage: {
					test: {
						$select: {
							first_name: { $left: { $text: 'Hallo', $n: 1 } },
							$from: 'people'
						}
					},
					expectedResult: {
						sql: 'SELECT LEFT($1, $2) AS first_name FROM people',
						values: {
							$1: 'Hallo',
							$2: 1
						}
					}
				}
			},
			Object: {
				basicUsage: {
					test: {
						$select: {
							first_name: { $left: { $text: { $right: { $text: 'Hallo', $n: 2 } }, $n: 1 } },
							$from: 'people'
						}
					},
					expectedResult: {
						sql: 'SELECT LEFT(RIGHT($1, $2), $3) AS first_name FROM people',
						values: {
							$1: 'Hallo',
							$2: 2,
							$3: 1
						}
					}
				}
			}
		}
	});

	$ql.registerSyntax('$n', {
		description: 'Specifies a Numeric Parameter for a $ql function.',
		supportedBy: {
			mysql: 'http://',
			postgreSQL: 'https://',
		},
		definition: {
			allowedTypes: {
				Number: { syntax: '<value-param>' },
				Object: { syntax: '<value>' }
			}
		},
		examples: {
			Number: {
				basicUsage: {
					test: {
						$select: {
							first_name: { $left: { $text: 'Hallo', $n: 1 } },
							$from: 'people'
						}
					},
					expectedResult: {
						sql: 'SELECT LEFT($1, $2) AS first_name FROM people',
						values: {
							$1: 'Hallo',
							$2: 1
						}
					}
				}
			},
			Object: {
				basicUsage: {
					test: {
						$select: {
							first_name: { $left: { $text: 'Hallo', $n: { $len: 'first_name' } } },
							$from: 'people'
						}
					},
					expectedResult: {
						sql: 'SELECT LEFT($1, LENGTH($2)) AS first_name FROM people',
						values: {
							$1: 'Hallo',
							$2: 'first_name'
						}
					}
				}
			}
		}
	});

	/**
	 * @name $concat
	 * @memberOf String
	 * @isfunction
	 * @mysql true
	 *
	 * @summary Specifies the `CONCAT()` function.
	 *
	 * @param {Array} params  		Specifies the function parameters.
	 */
	$ql.registerHelper('$concat', function(args, outerQuery, identifier){
		var results = [];

		_.forEach(args, (arg) => {
			if (_.isPlainObject(arg)) {
				results.push(this.build(arg));
			} else {
				results.push(this.addValue(arg));
			}
		});

		if (identifier){
			if (this.isCurrent('$columns')){
				return 'CONCAT(' + results.join(', ') + ') AS ' + this.quote(identifier);
			} else {
				return this.quote(identifier) + ' = CONCAT(' + results.join(', ') + ')';
			}
		} else {
			return 'CONCAT(' + results.join(', ') + ')';
		}
	});

}
