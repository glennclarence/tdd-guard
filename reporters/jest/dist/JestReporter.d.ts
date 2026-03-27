import { BaseReporter, Config } from '@jest/reporters';
import type { Test, TestResult, AggregatedResult } from '@jest/reporters';
import type { TestContext } from '@jest/test-result';
import type { TDDGuardReporterOptions } from './types';
export declare class JestReporter extends BaseReporter {
    private readonly storage;
    private readonly testModules;
    constructor(_globalConfig?: Config.GlobalConfig, reporterOptions?: TDDGuardReporterOptions);
    private initializeStorage;
    onTestResult(test: Test, testResult: TestResult): void;
    onRunComplete(_contexts: Set<TestContext>, results: AggregatedResult): Promise<void>;
    private determineTestRunReason;
    private mapTestResult;
    private processTestErrors;
    private extractErrorDetails;
    private parseExpectedActualFromMessage;
    private createTestFromExecError;
    private buildTestModules;
    private buildUnhandledErrors;
}
//# sourceMappingURL=JestReporter.d.ts.map