import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  moduleFileExtensions: ["ts", "js"],
  clearMocks: true,
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
};

export default config;
