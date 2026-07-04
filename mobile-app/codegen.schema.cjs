const fs = require("fs");
const path = require("path");

const frontendSchemaPath = path.join(__dirname, "..", "frontend", "src", "graphql", "schema.graphql");
const graphqlUrl = process.env.EXPO_PUBLIC_GRAPHQL_URL ?? process.env.GRAPHQL_URL ?? "http://localhost:5000/graphql";
const schemaSource = fs.existsSync(frontendSchemaPath) ? frontendSchemaPath : graphqlUrl;

/** @type {import('@graphql-codegen/cli').CodegenConfig} */
module.exports = {
  schema: schemaSource,
  overwrite: true,
  generates: {
    "src/services/graphql/schema.graphql": {
      plugins: ["schema-ast"],
      config: {
        includeDirectives: true,
        commentDescriptions: true,
        sort: true
      }
    }
  }
};
