import { TEST_BACKEND_URL } from "./auth-test-helpers";

jest.setTimeout(30000);

type MutationIntrospectionResponse = {
	data?: {
		__schema?: {
			mutationType?: {
				fields?: Array<{
					name: string;
					args: Array<{ name: string }>;
				}>;
			};
		};
	};
	errors?: Array<{ message: string }>;
};

describe("PostGraphile social registration mutation exposure", () => {
	it("exposes registerLocalAccountWithSocialIdentity on Mutation", async () => {
		const response = await fetch(`${TEST_BACKEND_URL}/graphql`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				query: `
					query MutationFields {
						__schema {
							mutationType {
								fields {
									name
									args {
										name
									}
								}
							}
						}
					}
				`,
			}),
		});

		expect(response.status).toBe(200);

		const payload = (await response.json()) as MutationIntrospectionResponse;
		expect(payload.errors).toBeUndefined();

		const fields = payload.data?.__schema?.mutationType?.fields ?? [];
		const socialRegistrationMutation = fields.find(
			field => field.name === "registerLocalAccountWithSocialIdentity",
		);

		expect(socialRegistrationMutation).toBeDefined();
		expect(socialRegistrationMutation).toMatchObject({
			name: "registerLocalAccountWithSocialIdentity",
			args: expect.arrayContaining([{ name: "input" }]),
		});
	});
});
