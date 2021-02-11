import { TransformerHTMLMinifier } from "@guesant/marech-transformer-html-minifier";
import { TransformerHTMLModule } from "@guesant/marech-transformer-html-modules";
import { dirname } from "path";
import { IConfigRule } from "../types/IConfigRule";
import { IRulesPresetOptions } from "../types/IRulesPresetOptions";
import { makeFileSystem } from "./makeFileSystem";

export const generateRules = (
  { mappedPaths = {}, htmlImport, htmlMinify, prettier }: IRulesPresetOptions,
  defaultsEnabled = true,
) => {
  const rules: IConfigRule[] = [];

  if (htmlImport?.enabled ?? (true && defaultsEnabled)) {
    const match = htmlImport?.match || "**/*.html";
    rules.push({
      match,
      getTransformer: (
        { fileContent, filePath, dependencyGraph },
        configRules,
      ) =>
        new TransformerHTMLModule(
          fileContent,
          {
            fs: makeFileSystem(
              dirname(filePath),
              mappedPaths,
              configRules,
              dependencyGraph,
            ),
          },
          {},
        ),
    });
  }

  if (htmlMinify?.enabled ?? false) {
    const match = htmlMinify?.match || "**/*.html";
    rules.push({
      match,
      getTransformer: (
        { fileContent, filePath, dependencyGraph },
        configRules,
      ) =>
        new TransformerHTMLMinifier(
          fileContent,
          {
            fs: makeFileSystem(
              dirname(filePath),
              mappedPaths,
              configRules,
              dependencyGraph,
            ),
          },
          htmlMinify?.options || {},
        ),
    });
  }

  return rules;
};
