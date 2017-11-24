'use strict';

const SQLBuilder	= require('./sqlbuilder');
const util 			= require('util')
const colors 		= require('colors');
const _				= require('lodash');

let errors = [];

let TestLogger = function() {
	this.messages = [];
	this.errors = [];
	this.fatal = false;
	this.success = true;
};
TestLogger.prototype.error = function(message, fatal, errStack){
	this.success = false;

	this.messages.push(message);

	if (fatal) {
		this.fatal = true;
	}

	if (errStack) {
		this.errors.push(errStack);
	}
}
TestLogger.prototype.hasErrors = function(){
	return this.errors.length > 0;
}
TestLogger.prototype.successful = function(){
	return this.success;
}
TestLogger.prototype.failed = function(testPath, sqlDialect, message, fatal, errStack){
	if (message) {
		this.error(message, fatal, errStack);
	}

	if (sqlDialect) {
		console.log('      !! '.bold.red + (sqlDialect + ': ').yellow + testPath);
	} else {
		console.log('      !! '.bold.red + testPath);
	}

	return this;
}
TestLogger.prototype.newLine = function(){
	this.messages.push('');
}

function test(testName, testPath, testCase, supportedBy) {
	let log = new TestLogger(),
		result,
		jSQL;

	// make the tests for each system described in supportedBy
	_.forEach(supportedBy, (url, sqlDialect) => {

		// run test if the there is no specification on test for
		// supportedBy or if the current sqlDialect is available on the supportedBy option
		if (!(!testCase.supportedBy || testCase.supportedBy[sqlDialect])) {
			//skip test for not supported dialects
			return;
		}

		try {
			jSQL = new SQLBuilder(sqlDialect);
			// overwrite the Standard-quote function to get $1, $2, $3 ...
			// like the way the expectedResult will be documented
			jSQL.placeholder = function(){
				// will return $1, $2, ...
				return '$' + this._values.length;
			};
			jSQL.quoteChar = '';

			//jSQL._initBuilder();
			result = jSQL.build(testCase.test);
		} catch (err) {
			// check for an expected exception
			if (testCase.expectedResult.exception === err.message) {
				// this exception is okay -> Test successful done!
				return;
			}
			return log.failed(testPath, sqlDialect, '      ' + 'FATAL-ERROR: '.red + err.message.red, true/*fatal*/, err.stack);
		}

		// check the result sql - if we got an valid object
		if (!_.isPlainObject(result)) {
			return log.failed(testPath, sqlDialect, '      ' + 'ERROR:  result is not an Object!'.red, true);
		}

		if (!_.isString(result.sql)) {
			return log.failed(testPath, sqlDialect, '      ' + 'ERROR:  result.sql is not a String!'.red, true);
		}

		if (!_.isArray(result.values)) {
			return log.failed(testPath, sqlDialect, '      ' + 'ERROR:  result.values is not an Array!'.red, true);
		}

		if (result.sql !== testCase.expectedResult.sql) {
			log.newLine();
			log.error('      ' + (sqlDialect + ': ').yellow + 'SQL Statement failed'.red + '\n');
			//log.error('          + expected'.green + '   - actual'.yellow + '\n');
			log.error('          -|'.yellow + result.sql.yellow + '|'.yellow);
			log.error('          +|'.green + testCase.expectedResult.sql.green + '|'.green);
		}

		// check length of values equals expected
		let expectedValues = testCase.expectedResult.values || {};
		let arrExpectedValues = Object.keys(expectedValues);

		if (arrExpectedValues.length !== result.values.length) {
			log.newLine();
			log.error('      ' + (sqlDialect + ': ').yellow + 'Count of Parameters failed'.red + '\n');
			log.error('          -'.yellow + (result.values.length+'').yellow + '   +'.green +  (arrExpectedValues.length+'').green);
		}

		let max = arrExpectedValues.length;
		if (result.values && result.values.length > max) max = result.values.length;
		for (let i=0; i<max; i++) {
			let actualValue = result.values[i];
			let expectedValue = expectedValues['$' + (i + 1)];

			if (actualValue !== expectedValue){
				log.newLine();
				log.error('      ' + (sqlDialect + ': ').yellow + ('Parameter ' + (i + 1) + ' does not match').red);

				log.newLine();
				log.error(('          $' + (i + 1) + ':   -').yellow + (typeof actualValue === typeof undefined ? (actualValue+'').grey : (actualValue+'').yellow));
				log.error(('          $' + (i + 1) + ':   +').green + (typeof expectedValue === typeof undefined ? (expectedValue+'').grey : (expectedValue+'').green));
			}
		}
	});

	if (log.successful()) {
		console.log('      \u2714  '.green + testPath); // check mark
	} else {
		return log.failed(testPath);
	}
	return log;
}

function main() {
	let loggedTestResults = []
	let testPath;
	let jSQL = new SQLBuilder();

	console.log('Testing ...'.bold);
	// make tests for all helpers registered now
	_.forEach(jSQL._helpers2, (helper, helperName) => {
		//if (helperName != '$gt') return;

		console.log('\n\n  ' + helperName.bold + ': ' + helper.description.grey);
		// iterate each example defined for the helper
		_.forEach(helper.examples, (examplesByType, typeName) => {
			console.log('    as ' + typeName);

			if (examplesByType.eachItemOf) {
				_.forEach(examplesByType.eachItemOf, (eachItemTypeTests, itemType)=>{
					// check for value-based syntaxt and Tests
					if (eachItemTypeTests.basicUsage) {
						_.forEach(eachItemTypeTests, (testCase, testName) => {
							testPath = 'with an Item of Type '.grey + (itemType+'').grey + ' > '.grey + testName.replace('basicUsage', 'Basic Usage').grey;
							//process.stdout.write('      ' + testPath);
							loggedTestResults.push({
								helper: helper,
								testPath: helperName + ' as ' + typeName + ' ' + testPath,
								testResult: test(testName, testPath, testCase, helper.supportedBy),
							});
						});
					} else {
						// value-based tests:
						_.forEach(eachItemTypeTests, (valueTests, value) => {
							_.forEach(valueTests, (testCase, testName) => {
								testPath = 'with an Item of Type '.grey + (itemType+'').grey + ' which has the value '.grey + (value+'').grey + ' > '.grey + testName.replace('basicUsage', 'Basic Usage').grey;
								//process.stdout.write('      ' + testPath);
								loggedTestResults.push({
									helper: helper,
									testPath: helperName + ' as ' + typeName + ' ' + testPath,
									testResult: test(testName, testPath, testCase, helper.supportedBy),
								});
							});
						});
					}
				});
			} else {
				// check for a value-base syntax
				if (!_.isPlainObject(examplesByType.basicUsage)) {
					// value-based tests:
					_.forEach(examplesByType, (valueTests, value) => {
						_.forEach(valueTests, (testCase, testName) => {
							testPath = ' which has the value '.grey + (value+'').grey + ' > '.grey + testName.replace('basicUsage', 'Basic Usage').grey;
							loggedTestResults.push({
								helper: helper,
								testPath: helperName + ' as ' + typeName + ' ' + testPath,
								testResult: test(testName, testPath, testCase, helper.supportedBy),
							});
						});
					});
				} else {
					_.forEach(examplesByType, (testCase, testName) => {
						testPath = testName.replace('basicUsage', 'Basic Usage');
						loggedTestResults.push({
							helper: helper,
							testPath: helperName + ' as ' + typeName + ' ' + testPath,
							testResult: test(testName, testPath, testCase, helper.supportedBy),
						});
					});
				}
			}
		});
	});

	// evaluat test results;
	let passed = 0;
	let failed = 0;
	for(var i=0, max=loggedTestResults.length; i<max; i++) {
		var t = loggedTestResults[i];

		if (t.testResult.successful()) {
			passed++
		} else {
			failed++;
			if (failed == 1) {
				console.log('\n\n\nFailed Tests:\n'.bold);
			}

			console.log('  ' + failed + ')  ' + t.testPath);
			_.forEach(t.testResult.messages, (msg) =>{
				console.log(msg);
			});
			if (t.testResult.fatal){
				console.log();
				console.log(t.testResult.errors[0].grey);
			}

			console.log('\n      + expected'.green + '   - actual'.yellow + '\n');
		}
	}

	console.log('\n\nSummary:\n'.bold);
	console.log('  ' + (passed + ' ' + (passed == 1 ? 'Test':'Tests') + ' passing').green);
	if (failed) {
		console.log('  ' + (failed + ' ' + (failed == 1 ? 'Test':'Tests') + ' failed').red);
	}
	console.log();
}

// add some spaces
/*for(let i=0; i<100; i++){
	console.log();
}*/

main();
