import prompts from "prompts";
import chalk from "chalk";

export interface ProjectConfig {
  projectName: string;
  description: string;
  template: "minimal" | "full" | "http" | "config" | "database" | "auth" | "api-proxy";
  install: boolean;
  git: boolean;
}

const TEMPLATES = [
  {
    title: `${chalk.bold("minimal")} ${chalk.dim("— Single tool, stdio transport")}`,
    value: "minimal",
  },
  {
    title: `${chalk.bold("full")} ${chalk.dim("— Tools + Resources + Prompts, Vitest included")}`,
    value: "full",
  },
  {
    title: `${chalk.bold("http")} ${chalk.dim("— Streamable HTTP transport with Express")}`,
    value: "http",
  },
  {
    title: `${chalk.bold("config")} ${chalk.dim("— Zod-validated config from env + file + profile, secret redaction")}`,
    value: "config",
  },
  {
    title: `${chalk.bold.yellow("database")} ${chalk.dim("— SQLite + Drizzle ORM + CRUD")} ${chalk.yellow("★ Premium")}`,
    value: "database",
  },
  {
    title: `${chalk.bold.yellow("auth")} ${chalk.dim("— API Key + JWT auth + rate limiting")} ${chalk.yellow("★ Premium")}`,
    value: "auth",
  },
  {
    title: `${chalk.bold.yellow("api-proxy")} ${chalk.dim("— Agent-safe REST API proxy + rate limiting")} ${chalk.yellow("★ Premium")}`,
    value: "api-proxy",
  },
] as const;

export async function runPrompts(
  projectName: string | undefined,
  options: {
    template?: string;
    install?: boolean;
    git?: boolean;
    description?: string;
    yes?: boolean;
  }
): Promise<ProjectConfig> {
  const questions: prompts.PromptObject[] = [];

  if (!projectName && !options.yes) {
    questions.push({
      type: "text",
      name: "projectName",
      message: "Project name:",
      initial: "my-mcp-server",
      validate: (value: string) =>
        /^[a-z0-9-_]+$/.test(value) || "Only lowercase letters, numbers, hyphens, and underscores",
    });
  }

  if (!options.template && !options.yes) {
    questions.push({
      type: "select",
      name: "template",
      message: "Template:",
      choices: [...TEMPLATES],
    });
  }

  if (!options.description && !options.yes) {
    questions.push({
      type: "text",
      name: "description",
      message: "Description:",
      initial: "A Model Context Protocol server",
    });
  }

  const onCancel = () => {
    throw new Error("cancelled");
  };

  const answers = questions.length > 0 ? await prompts(questions, { onCancel }) : {};

  return {
    projectName: projectName || answers.projectName || "my-mcp-server",
    description: options.description || answers.description || "A Model Context Protocol server",
    template: (options.template as ProjectConfig["template"]) || answers.template || "minimal",
    install: options.install !== false,
    git: options.git !== false,
  };
}
