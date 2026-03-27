"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorybookReporter = void 0;
const tdd_guard_1 = require("tdd-guard");
class StorybookReporter {
    storage;
    collectedTests = new Map();
    constructor(storageOrRoot) {
        this.storage = this.initializeStorage(storageOrRoot);
    }
    initializeStorage(storageOrRoot) {
        if (!storageOrRoot) {
            return new tdd_guard_1.FileStorage();
        }
        if (typeof storageOrRoot === 'string') {
            const config = new tdd_guard_1.Config({ projectRoot: storageOrRoot });
            return new tdd_guard_1.FileStorage(config);
        }
        return storageOrRoot;
    }
    async onStoryResult(context, status = 'passed', errors) {
        const moduleId = context.id;
        const test = {
            name: context.name,
            fullName: `${context.title} > ${context.name}`,
            state: status,
        };
        // Add errors if present
        if (errors && errors.length > 0) {
            test.errors = errors.map((err) => {
                const errorObj = err;
                const message = errorObj.message;
                return {
                    message: typeof message === 'string' ? message : String(err),
                    stack: errorObj.stack,
                };
            });
        }
        if (!this.collectedTests.has(moduleId)) {
            this.collectedTests.set(moduleId, []);
        }
        this.collectedTests.get(moduleId).push(test);
    }
    async onComplete() {
        const testModules = Array.from(this.collectedTests.entries()).map(([moduleId, tests]) => ({
            moduleId,
            tests,
        }));
        const output = {
            testModules,
            unhandledErrors: [],
            reason: this.determineReason(testModules),
        };
        await this.storage.saveTest(JSON.stringify(output, null, 2));
    }
    determineReason(testModules) {
        const allTests = testModules.flatMap((m) => m.tests);
        if (allTests.length === 0) {
            return undefined;
        }
        const hasFailures = allTests.some((t) => t.state === 'failed');
        return hasFailures ? 'failed' : 'passed';
    }
}
exports.StorybookReporter = StorybookReporter;
