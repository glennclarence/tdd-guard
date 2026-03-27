import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import {
  Config,
  DEFAULT_MODEL_VERSION,
  DEFAULT_CLIENT,
  DEFAULT_DATA_DIR,
} from './Config'
import { ClientType } from '../contracts/types/ClientType'
import path from 'path'

describe('Config', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('dataDir', () => {
    const projectRoot = '/test/project'
    const projectDataDir = path.join(projectRoot, DEFAULT_DATA_DIR)
    let config: Config

    beforeEach(() => {
      config = new Config({ projectRoot })
    })

    test('uses git root when no projectRoot provided (inside a git repo)', () => {
      delete process.env.CLAUDE_PROJECT_DIR
      const defaultConfig = new Config()
      expect(path.isAbsolute(defaultConfig.dataDir)).toBe(true)
      expect(defaultConfig.dataDir).toContain(DEFAULT_DATA_DIR)
    })

    test('uses projectRoot to construct absolute dataDir', () => {
      expect(config.dataDir).toBe(projectDataDir)
    })

    test('testResultsFilePath returns test.json path within dataDir', () => {
      expect(config.testResultsFilePath).toBe(
        path.join(projectDataDir, 'test.json')
      )
    })

    test('todosFilePath returns todos.json path within dataDir', () => {
      expect(config.todosFilePath).toBe(path.join(projectDataDir, 'todos.json'))
    })

    test('modificationsFilePath returns modifications.json path within dataDir', () => {
      expect(config.modificationsFilePath).toBe(
        path.join(projectDataDir, 'modifications.json')
      )
    })

    test('lintFilePath returns lint.json path within dataDir', () => {
      expect(config.lintFilePath).toBe(path.join(projectDataDir, 'lint.json'))
    })

    test('configFilePath returns config.json path within dataDir', () => {
      expect(config.configFilePath).toBe(
        path.join(projectDataDir, 'config.json')
      )
    })

    test('instructionsFilePath returns instructions.md path within dataDir', () => {
      expect(config.instructionsFilePath).toBe(
        path.join(projectDataDir, 'instructions.md')
      )
    })

    describe('git root fallback', () => {
      test('uses git root when no projectRoot or CLAUDE_PROJECT_DIR is provided', () => {
        delete process.env.CLAUDE_PROJECT_DIR
        const gitRootConfig = new Config()
        expect(path.isAbsolute(gitRootConfig.dataDir)).toBe(true)
        expect(gitRootConfig.dataDir).toContain(DEFAULT_DATA_DIR)
      })

      test('projectRoot option takes precedence over git root', () => {
        delete process.env.CLAUDE_PROJECT_DIR
        const explicitRoot = '/explicit/project/root'
        const configWithExplicitRoot = new Config({ projectRoot: explicitRoot })
        expect(configWithExplicitRoot.dataDir).toBe(
          path.join(explicitRoot, DEFAULT_DATA_DIR)
        )
      })
    })

    describe('CLAUDE_PROJECT_DIR', () => {
      let originalCwd: typeof process.cwd

      beforeEach(() => {
        originalCwd = process.cwd
      })

      afterEach(() => {
        process.cwd = originalCwd
        delete process.env.CLAUDE_PROJECT_DIR
      })

      test('git root takes precedence over CLAUDE_PROJECT_DIR in a git repo', () => {
        const claudeProjectDir = '/claude/project/root'
        process.env.CLAUDE_PROJECT_DIR = claudeProjectDir
        process.cwd = () => '/claude/project/root/src'

        const configWithClaudeDir = new Config()

        expect(path.isAbsolute(configWithClaudeDir.dataDir)).toBe(true)
        expect(configWithClaudeDir.dataDir).toContain(DEFAULT_DATA_DIR)
      })

      test('projectRoot option takes precedence over CLAUDE_PROJECT_DIR', () => {
        const claudeProjectDir = '/claude/project/root'
        const explicitProjectRoot = '/explicit/project/root'
        process.env.CLAUDE_PROJECT_DIR = claudeProjectDir

        const configWithBoth = new Config({ projectRoot: explicitProjectRoot })

        expect(configWithBoth.dataDir).toBe(
          path.join(explicitProjectRoot, DEFAULT_DATA_DIR)
        )
      })

      test('ignores invalid CLAUDE_PROJECT_DIR when git root is available', () => {
        process.env.CLAUDE_PROJECT_DIR = 'relative/path'

        // Git root resolves first, so invalid CLAUDE_PROJECT_DIR is never reached
        const configWithInvalidDir = new Config()
        expect(path.isAbsolute(configWithInvalidDir.dataDir)).toBe(true)
        expect(configWithInvalidDir.dataDir).toContain(DEFAULT_DATA_DIR)
      })

      test('uses git root when cwd is outside CLAUDE_PROJECT_DIR', () => {
        process.env.CLAUDE_PROJECT_DIR = '/project/root'
        process.cwd = () => '/some/other/path'

        // Git root resolves before CLAUDE_PROJECT_DIR is checked
        const configWithOutsideCwd = new Config()
        expect(path.isAbsolute(configWithOutsideCwd.dataDir)).toBe(true)
        expect(configWithOutsideCwd.dataDir).toContain(DEFAULT_DATA_DIR)
      })

      test('uses git root when cwd is deeply nested', () => {
        process.env.CLAUDE_PROJECT_DIR = '/project/root'
        process.cwd = () => '/project/root/src/nested/deeply'

        // Git root resolves before CLAUDE_PROJECT_DIR is checked
        const configWithNestedCwd = new Config()
        expect(path.isAbsolute(configWithNestedCwd.dataDir)).toBe(true)
        expect(configWithNestedCwd.dataDir).toContain(DEFAULT_DATA_DIR)
      })

      test('uses git root even with path traversal in CLAUDE_PROJECT_DIR', () => {
        process.env.CLAUDE_PROJECT_DIR = '/some/path/../../../other'
        process.cwd = () => '/other/location'

        // Git root resolves before CLAUDE_PROJECT_DIR is checked
        const configWithTraversal = new Config()
        expect(path.isAbsolute(configWithTraversal.dataDir)).toBe(true)
        expect(configWithTraversal.dataDir).toContain(DEFAULT_DATA_DIR)
      })
    })
  })

  describe('useSystemClaude', () => {
    test('can be set via options', () => {
      const config = new Config({ useSystemClaude: true })

      expect(config.useSystemClaude).toBe(true)
    })

    test('options take precedence over env var', () => {
      process.env.USE_SYSTEM_CLAUDE = 'false'

      const config = new Config({ useSystemClaude: true })

      expect(config.useSystemClaude).toBe(true)
    })

    test('falls back to env var when not in options', () => {
      process.env.USE_SYSTEM_CLAUDE = 'true'

      const config = new Config({})

      expect(config.useSystemClaude).toBe(true)
    })

    test('defaults to false when neither options nor env var are set', () => {
      delete process.env.USE_SYSTEM_CLAUDE

      const config = new Config()

      expect(config.useSystemClaude).toBe(false)
    })

    test('returns false for non-true env values', () => {
      // Test with 'false'
      process.env.USE_SYSTEM_CLAUDE = 'false'
      let config = new Config()
      expect(config.useSystemClaude).toBe(false)

      // Test with empty string
      process.env.USE_SYSTEM_CLAUDE = ''
      config = new Config()
      expect(config.useSystemClaude).toBe(false)
    })
  })

  describe('anthropicApiKey', () => {
    test('can be set via options', () => {
      const config = new Config({ anthropicApiKey: 'options-api-key' })

      expect(config.anthropicApiKey).toBe('options-api-key')
    })

    test('options take precedence over env var', () => {
      process.env.TDD_GUARD_ANTHROPIC_API_KEY = 'env-api-key'

      const config = new Config({ anthropicApiKey: 'options-api-key' })

      expect(config.anthropicApiKey).toBe('options-api-key')
    })

    test('falls back to env var when not in options', () => {
      process.env.TDD_GUARD_ANTHROPIC_API_KEY = 'env-api-key'

      const config = new Config()

      expect(config.anthropicApiKey).toBe('env-api-key')
    })

    test('returns undefined when neither options nor env var are set', () => {
      delete process.env.TDD_GUARD_ANTHROPIC_API_KEY

      const config = new Config()

      expect(config.anthropicApiKey).toBeUndefined()
    })
  })

  describe('modelType', () => {
    test('can be set via options', () => {
      const config = new Config({ modelType: 'anthropic_api' })

      expect(config.modelType).toBe('anthropic_api')
    })

    test('options take precedence over env vars', () => {
      process.env.MODEL_TYPE = 'claude_cli'

      const config = new Config({ modelType: 'anthropic_api' })

      expect(config.modelType).toBe('anthropic_api')
    })

    test('options take precedence even in test mode with TEST_MODEL_TYPE', () => {
      process.env.MODEL_TYPE = 'claude_cli'
      process.env.TEST_MODEL_TYPE = 'test_model'

      const config = new Config({ mode: 'test', modelType: 'anthropic_api' })

      expect(config.modelType).toBe('anthropic_api')
    })

    test('falls back to MODEL_TYPE env var in production mode', () => {
      process.env.MODEL_TYPE = 'anthropic_api'

      const config = new Config()

      expect(config.modelType).toBe('anthropic_api')
    })

    test('uses TEST_MODEL_TYPE in test mode when available', () => {
      process.env.MODEL_TYPE = 'claude_cli'
      process.env.TEST_MODEL_TYPE = 'anthropic_api'

      const config = new Config({ mode: 'test' })

      expect(config.modelType).toBe('anthropic_api')
    })

    test('falls back to MODEL_TYPE in test mode when TEST_MODEL_TYPE is not set', () => {
      process.env.MODEL_TYPE = 'anthropic_api'
      delete process.env.TEST_MODEL_TYPE

      const config = new Config({ mode: 'test' })

      expect(config.modelType).toBe('anthropic_api')
    })

    test('defaults to claude_cli when no env vars are set', () => {
      delete process.env.MODEL_TYPE
      delete process.env.TEST_MODEL_TYPE

      const config = new Config()

      expect(config.modelType).toBe('claude_cli')
    })
  })

  describe('validationClient', () => {
    test.each<ClientType>(['sdk', 'cli', 'api'])(
      'returns %s when VALIDATION_CLIENT env var is set to %s',
      (value) => {
        process.env.VALIDATION_CLIENT = value

        const config = new Config()

        expect(config.validationClient).toBe(value)
      }
    )

    describe('options.validationClient precedence', () => {
      test.each([
        { env: 'VALIDATION_CLIENT', envValue: 'cli', optionValue: 'api' },
        { env: 'VALIDATION_CLIENT', envValue: 'sdk', optionValue: 'cli' },
        { env: 'MODEL_TYPE', envValue: 'anthropic_api', optionValue: 'sdk' },
        { env: 'MODEL_TYPE', envValue: 'claude_cli', optionValue: 'api' },
      ])(
        'takes precedence over $env=$envValue (returns $optionValue)',
        ({ env, envValue, optionValue }) => {
          process.env[env] = envValue

          const config = new Config({
            validationClient: optionValue as 'api' | 'cli' | 'sdk',
          })

          expect(config.validationClient).toBe(optionValue)
        }
      )
    })

    describe('case normalization', () => {
      describe('VALIDATION_CLIENT', () => {
        const testCases = [
          ['API', 'api'],
          ['Api', 'api'],
          ['api', 'api'],
          ['CLI', 'cli'],
          ['Cli', 'cli'],
          ['cli', 'cli'],
          ['SDK', 'sdk'],
          ['Sdk', 'sdk'],
          ['sdk', 'sdk'],
        ]

        test.each(testCases)(
          'normalizes env var %s to %s',
          (input, expected) => {
            process.env.VALIDATION_CLIENT = input

            const config = new Config()

            expect(config.validationClient).toBe(expected)
          }
        )

        test.each(testCases)(
          'normalizes option %s to %s',
          (input, expected) => {
            const config = new Config({
              validationClient: input as ClientType,
            })

            expect(config.validationClient).toBe(expected)
          }
        )
      })

      describe('MODEL_TYPE (legacy)', () => {
        const modelTypeCases = [
          ['ANTHROPIC_API', 'api'],
          ['Anthropic_Api', 'api'],
          ['anthropic_api', 'api'],
          ['CLAUDE_CLI', 'cli'],
          ['Claude_Cli', 'cli'],
          ['claude_cli', 'cli'],
        ]

        test.each(modelTypeCases)(
          'normalizes env var %s to %s when VALIDATION_CLIENT not set',
          (modelType, expectedClient) => {
            delete process.env.VALIDATION_CLIENT
            process.env.MODEL_TYPE = modelType

            const config = new Config()

            expect(config.validationClient).toBe(expectedClient)
          }
        )

        test.each(modelTypeCases)(
          'normalizes option %s to %s when validationClient not set',
          (modelType, expectedClient) => {
            delete process.env.VALIDATION_CLIENT
            delete process.env.MODEL_TYPE

            const config = new Config({ modelType })

            expect(config.validationClient).toBe(expectedClient)
          }
        )
      })
    })

    test.each([
      ['anthropic_api', 'api'],
      ['claude_cli', 'cli'],
    ] as const)(
      'uses %s from MODEL_TYPE=%s when VALIDATION_CLIENT not set',
      (modelType, expectedClient) => {
        delete process.env.VALIDATION_CLIENT
        process.env.MODEL_TYPE = modelType

        const config = new Config()

        expect(config.validationClient).toBe(expectedClient)
      }
    )

    test('uses api from options.modelType=anthropic_api when validationClient not set', () => {
      delete process.env.VALIDATION_CLIENT
      delete process.env.MODEL_TYPE

      const config = new Config({ modelType: 'anthropic_api' })

      expect(config.validationClient).toBe('api')
    })

    test('uses cli from options.modelType=claude_cli when validationClient not set', () => {
      delete process.env.VALIDATION_CLIENT
      delete process.env.MODEL_TYPE

      const config = new Config({ modelType: 'claude_cli' })

      expect(config.validationClient).toBe('cli')
    })

    test('uses DEFAULT_CLIENT when nothing is set', () => {
      delete process.env.VALIDATION_CLIENT
      delete process.env.MODEL_TYPE

      const config = new Config()

      expect(config.validationClient).toBe(DEFAULT_CLIENT)
    })
  })

  describe('modelVersion', () => {
    test('returns default model version when no configuration provided', () => {
      const config = new Config()

      expect(config.modelVersion).toBeDefined()
      expect(config.modelVersion).toBe(DEFAULT_MODEL_VERSION)
    })

    test('can be set via options', () => {
      const config = new Config({ modelVersion: 'claude-opus-4-1' })

      expect(config.modelVersion).toBe('claude-opus-4-1')
    })

    test('options take precedence over env var', () => {
      process.env.TDD_GUARD_MODEL_VERSION = 'claude-haiku-3-0'

      const config = new Config({ modelVersion: 'claude-opus-4-1' })

      expect(config.modelVersion).toBe('claude-opus-4-1')
    })

    test('falls back to env var when not in options', () => {
      process.env.TDD_GUARD_MODEL_VERSION = 'claude-haiku-3-0'

      const config = new Config()

      expect(config.modelVersion).toBe('claude-haiku-3-0')
    })
  })

  describe('linterType', () => {
    test('returns undefined when no configuration provided', () => {
      delete process.env.LINTER_TYPE

      const config = new Config()

      expect(config.linterType).toBeUndefined()
    })

    test('returns eslint when LINTER_TYPE env var is set to eslint', () => {
      process.env.LINTER_TYPE = 'eslint'

      const config = new Config()

      expect(config.linterType).toBe('eslint')
    })

    test('returns golangci-lint when LINTER_TYPE env var is set to golangci-lint', () => {
      process.env.LINTER_TYPE = 'golangci-lint'

      const config = new Config()

      expect(config.linterType).toBe('golangci-lint')
    })

    test('returns value from ConfigOptions when linterType is provided', () => {
      const config = new Config({ linterType: 'eslint' })

      expect(config.linterType).toBe('eslint')
    })

    test('returns golangci-lint from ConfigOptions when provided', () => {
      const config = new Config({ linterType: 'golangci-lint' })

      expect(config.linterType).toBe('golangci-lint')
    })

    test('ConfigOptions takes precedence over env var', () => {
      process.env.LINTER_TYPE = 'pylint'

      const config = new Config({ linterType: 'eslint' })

      expect(config.linterType).toBe('eslint')
    })

    test('returns undefined for empty string env var', () => {
      process.env.LINTER_TYPE = ''

      const config = new Config()

      expect(config.linterType).toBeUndefined()
    })

    test('returns future linter types when configured', () => {
      // Test that the system is extensible for future linter types
      process.env.LINTER_TYPE = 'pylint'

      const config = new Config()

      expect(config.linterType).toBe('pylint')
    })

    test('returns linterType in lowercase when env var is uppercase', () => {
      process.env.LINTER_TYPE = 'ESLINT'

      const config = new Config()

      expect(config.linterType).toBe('eslint')
    })

    test('returns linterType in lowercase when ConfigOptions is uppercase', () => {
      const config = new Config({ linterType: 'ESLINT' })

      expect(config.linterType).toBe('eslint')
    })
  })
})
