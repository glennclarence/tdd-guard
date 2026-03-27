import { Storage } from 'tdd-guard';
import type { TestContext } from './types';
export declare class StorybookReporter {
    private readonly storage;
    private readonly collectedTests;
    constructor(storageOrRoot?: Storage | string);
    private initializeStorage;
    onStoryResult(context: TestContext, status?: 'passed' | 'failed' | 'skipped', errors?: unknown[]): Promise<void>;
    onComplete(): Promise<void>;
    private determineReason;
}
//# sourceMappingURL=StorybookReporter.d.ts.map