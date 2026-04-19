const schemaPath = "./src/graphql/schema.graphql";

/** @type {import('@graphql-codegen/cli').CodegenConfig} */
module.exports = {
  schema: schemaPath,
  documents: ["src/**/*.{ts,tsx}", "!src/graphql/generated.ts"],
  ignoreNoDocuments: true,
  generates: {
    "src/graphql/generated.ts": {
      plugins: ["typescript", "typescript-operations", "typed-document-node"],
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
    }
  }
};
