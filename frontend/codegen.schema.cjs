const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:5050/graphql";

/** @type {import('@graphql-codegen/cli').CodegenConfig} */
module.exports = {
  schema: graphqlUrl,
  ignoreNoDocuments: true,
  generates: {
    "src/graphql/schema.graphql": {
      plugins: ["schema-ast"],
      config: {
        includeDirectives: true,
        commentDescriptions: true,
        sort: true
      }
    }
  }
};
