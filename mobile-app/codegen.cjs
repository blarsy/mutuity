/** @type {import('@graphql-codegen/cli').CodegenConfig} */
module.exports = {
  schema: "src/services/graphql/schema.graphql",
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
    }
  }
};
