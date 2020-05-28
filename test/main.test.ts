import {} from "mocha";
import { equal } from "assert";
import { Test } from "../src";

describe("Test", () => {
	it("works", () => {
		equal(new Test().test(), "hello world!");
	});
});
