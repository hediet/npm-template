import { writeFileSync } from "fs";
import { join } from "path";
import { readPackageJson, readTextFileSync } from "./shared";

export async function run(_args: string[]): Promise<void> {
	const packageJson = readPackageJson();
	if (packageJson.version !== "set-version-from-changelog") {
		throw new Error(
			`Version must be "set-version-from-changelog", but was "${packageJson.version}"`
		);
	}
}
