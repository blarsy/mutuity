/** @type {import('@graphql-codegen/cli').CodegenConfig} */
module.exports = {
  schema: "src/services/graphql/schema.graphql",
  documents: ["src/services/graphql/**/*.ts", "src/services/graphql/**/*.tsx"],
  overwrite: true,
  generates: {
    "src/services/graphql/generated.ts": {
      plugins: ["typescript"],
      config: {
        useTypeImports: true,
        nonOptionalTypename: true,
        avoidOptionals: {
          field: true,
          inputValue: false,
          object: false,
          defaultValue: false
        }
      }
    },
    "src/services/graphql/operations.generated.ts": {
      plugins: ["typescript-operations", "typed-document-node"],
      config: {
        useTypeImports: true,
        nonOptionalTypename: true
      }
    }
  }
};
