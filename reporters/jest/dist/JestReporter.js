"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JestReporter = void 0;
const reporters_1 = require("@jest/reporters");
const tdd_guard_1 = require("tdd-guard");
class JestReporter extends reporters_1.BaseReporter {
    storage;
    testModules = new Map();
    constructor(_globalConfig, reporterOptions) {
        super();
        this.storage = this.initializeStorage(reporterOptions);
    }
    initializeStorage(options) {
        if (options?.storage) {
            return options.storage;
        }
        if (options?.projectRoot) {
            const config = new tdd_guard_1.Config({ projectRoot: options.projectRoot });
            return new tdd_guard_1.FileStorage(config);
        }
        return new tdd_guard_1.FileStorage();
    }
    onTestResult(test, testResult) {
        this.testModules.set(test.path, { test, testResult });
    }
    async onRunComplete(_contexts, results) {
        const output = {
            testModules: this.buildTestModules(),
            unhandledErrors: this.buildUnhandledErrors(results),
            reason: this.determineTestRunReason(results),
        };
        await this.storage.saveTest(JSON.stringify(output, null, 2));
    }
    determineTestRunReason(results) {
        if (results.wasInterrupted) {
            return 'interrupted';
        }
        if (results.numFailedTestSuites === 0 && results.numTotalTestSuites > 0) {
            return 'passed';
        }
        return 'failed';
    }
    mapTestResult(test) {
        const result = {
            name: test.title,
            fullName: test.fullName,
            state: test.status,
        };
        // Process failure details if present
        if (test.failureMessages.length > 0) {
            result.errors = this.processTestErrors(test);
        }
        return result;
    }
    processTestErrors(test) {
        if (test.failureDetails.length === 0) {
            return test.failureMessages.map((message) => ({ message }));
        }
        return test.failureDetails.map((detail, index) => {
            const message = test.failureMessages[index] || '';
            const error = { message };
            if (detail && typeof detail === 'object') {
                this.extractErrorDetails(error, detail);
                this.parseExpectedActualFromMessage(error, message);
            }
            return error;
        });
    }
    extractErrorDetails(error, obj) {
        if ('actual' in obj)
            error.actual = String(obj.actual);
        if ('expected' in obj)
            error.expected = String(obj.expected);
        if ('showDiff' in obj)
            error.showDiff = Boolean(obj.showDiff);
        if ('operator' in obj)
            error.operator = String(obj.operator);
        if ('diff' in obj)
            error.diff = String(obj.diff);
        if ('name' in obj)
            error.name = String(obj.name);
        if ('ok' in obj)
            error.ok = Boolean(obj.ok);
        if ('stack' in obj)
            error.stack = String(obj.stack);
    }
    parseExpectedActualFromMessage(error, message) {
        if (!error.expected || !error.actual) {
            const expectedMatch = /Expected:\s*(\d+)/.exec(message);
            const receivedMatch = /Received:\s*(\d+)/.exec(message);
            if (expectedMatch && !error.expected)
                error.expected = expectedMatch[1];
            if (receivedMatch && !error.actual)
                error.actual = receivedMatch[1];
        }
    }
    createTestFromExecError(execError) {
        const errorObj = execError;
        const message = String(errorObj.message ?? 'Unknown error');
        const error = {
            message,
            name: typeof errorObj.name === 'string' ? errorObj.name : 'Error',
            stack: typeof errorObj.stack === 'string' ? errorObj.stack : undefined,
        };
        // Extract additional fields from Jest's SerializableError
        if ('code' in errorObj && errorObj.code !== undefined) {
            error.operator = String(errorObj.code);
        }
        if ('type' in errorObj && typeof errorObj.type === 'string') {
            error.name = errorObj.type;
        }
        const errorType = error.name ?? 'Error';
        const testName = `Module failed to load (${errorType})`;
        return {
            name: testName,
            fullName: testName,
            state: 'failed',
            errors: [error],
        };
    }
    buildTestModules() {
        return Array.from(this.testModules.entries()).map(([path, data]) => {
            const { testResult } = data;
            // Handle module/import errors
            if (testResult.testExecError && testResult.testResults.length === 0) {
                return {
                    moduleId: path,
                    tests: [this.createTestFromExecError(testResult.testExecError)],
                };
            }
            return {
                moduleId: path,
                tests: testResult.testResults.map((test) => this.mapTestResult(test)),
            };
        });
    }
    buildUnhandledErrors(results) {
        if (!results.runExecError) {
            return [];
        }
        const error = results.runExecError;
        const errorObj = error;
        return [
            {
                message: String(errorObj.message ?? 'Unknown error'),
                name: typeof errorObj.name === 'string' ? errorObj.name : 'Error',
                stack: typeof errorObj.stack === 'string' ? errorObj.stack : undefined,
            },
        ];
    }
}
exports.JestReporter = JestReporter;
