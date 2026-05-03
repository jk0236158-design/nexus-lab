/**
 * Public surface of the config module. The MCP server entry only needs to
 * import from here.
 */
export {
  defineConfig,
  secret,
  isSecretSchema,
  SECRET_MARKER,
  z,
  type ConfigSchema,
  type InferConfig,
} from "./schema.js";

export {
  loadConfig,
  type LoadConfigOptions,
  type LoadConfigResult,
} from "./loader.js";

export {
  resolveProfile,
  pickProfileFile,
  type Profile,
  type ProfileSelector,
} from "./profile.js";

export {
  bindEnvToObject,
  deepMerge,
  type BindEnvOptions,
  type EnvBag,
} from "./env-binding.js";

export {
  detectSecretPaths,
  redactSecrets,
  safeStringify,
  REDACTED,
} from "./secrets.js";

export {
  validateConfig,
  ConfigValidationError,
} from "./validate.js";
