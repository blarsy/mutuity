import {
  SEARCH_RESOURCES_QUERY,
  RESOURCE_BY_ID_QUERY,
  MY_RESOURCES_QUERY
} from "../../src/services/graphql/operations";

describe("US1 search resources contract", () => {
  it("exports the search resources query document", () => {
    expect(SEARCH_RESOURCES_QUERY).toBeDefined();
  });

  it("exports the resource detail query document", () => {
    expect(RESOURCE_BY_ID_QUERY).toBeDefined();
  });

  it("exports the my resources query document", () => {
    expect(MY_RESOURCES_QUERY).toBeDefined();
  });
});