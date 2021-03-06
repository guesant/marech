import jetpack from "fs-jetpack";
import { join, resolve } from "path";
import * as yup from "yup";
import { Logger } from "./Logger";
import { IConfig } from "./types/IConfig";
import { IConfigParsed } from "./types/IConfigParsed";

const ERROR_INVALID_CONFIG = Symbol("invalid config");
const ERROR_CONFIG_NOT_FOUND = Symbol("config not found");

function requireUncached(module: string) {
  delete require.cache[require.resolve(module)];
  return require(module);
}

export class ConfigParser {
  static DEFAULT_CONFIG_FILENAME = "marech.config.js";

  static loadConfig = (
    requestedPath: string,
    defaultConfigFilename = ConfigParser.DEFAULT_CONFIG_FILENAME,
  ) => {
    try {
      if (!jetpack.exists(requestedPath)) throw ERROR_CONFIG_NOT_FOUND;
      const configPath = ConfigParser.getConfigPath(
        requestedPath,
        defaultConfigFilename,
      );
      if (configPath === null) throw ERROR_CONFIG_NOT_FOUND;
      const config = ConfigParser.requireConfig(configPath);
      if (config === null) throw ERROR_INVALID_CONFIG;
      return config as IConfigParsed;
    } catch (error) {
      switch (error) {
        case ERROR_CONFIG_NOT_FOUND:
          Logger.error(`config file not found: ${requestedPath}`);
          break;
        case ERROR_INVALID_CONFIG:
          Logger.error(`invalid config file: ${requestedPath}`);
          break;
        default:
          throw error;
      }
    }
    return null;
  };

  static requireConfig = (configPath: string, useRequireCache = false) => {
    const config = (useRequireCache ? require : requireUncached)(configPath);
    try {
      return ConfigParser.parseConfig(config);
    } catch (_) {
      return null;
    }
  };

  static parseConfig = (config: IConfig): IConfigParsed =>
    ConfigParser.configSchema.cast(config);

  static getConfigPath = (
    requestedPath: string,
    defaultConfigFilename: string,
  ) => {
    const targetPath =
      jetpack.exists(requestedPath) === "dir"
        ? join(requestedPath, defaultConfigFilename)
        : requestedPath;
    return jetpack.exists(targetPath) !== "file"
      ? null
      : resolve("./", targetPath);
  };

  static configSchema = yup
    .object({
      files: yup
        .array()
        .ensure()
        .of(
          yup.object({
            input: yup.object({
              path: yup.string().required().min(1),
              match: yup.string().optional(),
            }),
            output: yup.object({ path: yup.mixed(), filename: yup.mixed() }),
          }),
        )
        .default(() => []),
      rules: yup
        .array()
        .ensure()
        .of(
          yup.object({
            match: yup.string(),
            transformer: yup.mixed(),
          }),
        )
        .default(() => []),
    })
    .default(() => ({}));
}
