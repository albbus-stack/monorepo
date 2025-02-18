import { privateEnv } from "@inlang/env-variables"
import fs from "node:fs/promises"
import { MarketplaceManifest } from "@inlang/marketplace-manifest"
import { Value } from "@sinclair/typebox/value"
import algoliasearch from "algoliasearch"
import fetch from "node-fetch"

const manifestLinks = JSON.parse(await fs.readFile("./registry.json", "utf-8"))

/** @type {(import("@inlang/marketplace-manifest").MarketplaceManifest & { uniqueID: string })[]} */
const manifests = []

for (const type of Object.keys(manifestLinks)) {
	let json
	// eslint-disable-next-line no-undef
	console.info(`Fetching ${type} manifests...`)

	for (const uniqueID of Object.keys(manifestLinks[type])) {
		const link = manifestLinks[type][uniqueID]

		try {
			if (link.includes("http")) {
				json = JSON.parse(await (await fetch(link)).text())
			} else {
				json = JSON.parse(await fs.readFile(link, "utf-8"))
			}

			if (Value.Check(MarketplaceManifest, json) === false) {
				const errors = [...Value.Errors(MarketplaceManifest, json)]
				// eslint-disable-next-line no-undef
				console.error(errors)
				throw new Error(`Manifest is invalid.`)
			}

			manifests.push({
				uniqueID,
				...json,
			})
		} catch (e) {
			throw new Error(`Manifest '${link}' is invalid.`)
		}
	}
}

// checks if every manifest has a unique id
checkUniqueIDs(manifests)

// checks if the module links have the correct schema
checkModuleLinks(manifests)

// sort the manifests by id
manifests.sort((a, b) => {
	if (a.id.toUpperCase() < b.id.toUpperCase()) return -1
	if (a.id.toUpperCase() > b.id.toUpperCase()) return 1
	return 0
})

await fs.writeFile(
	"./src/registry.ts",
	`
	//! Do not edit this file manually. It is automatically generated based on the contents of the registry.json file.
	
	import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
	export type Registry = MarketplaceManifest & { uniqueID: string };

	export const registry: Registry[] = ${JSON.stringify(
		manifests.map((manifest) => ({ ...manifest, uniqueID: manifest.uniqueID })),
		undefined,
		"\t"
	)}`
)

if (!privateEnv.ALGOLIA_ADMIN || !privateEnv.ALGOLIA_APPLICATION) {
	throw new Error("Algolia API keys are not set")
}

const client = algoliasearch(privateEnv.ALGOLIA_APPLICATION, privateEnv.ALGOLIA_ADMIN)
const index = client.initIndex("registry")

const objects = await Promise.all(
	[...manifests.values()].map(async (value) => {
		const { uniqueID, readme, ...rest } = value

		const text = { en: await fetch(readme.en).then((res) => res.text()) }

		return { objectID: uniqueID, ...rest, readme: text }
	})
)

index
	.saveObjects(objects)
	.then(() => {
		// eslint-disable-next-line no-undef
		console.info("Successfully uploaded registry on Algolia")
	})
	.catch((err) => {
		// eslint-disable-next-line no-undef
		console.error(err)
	})

/* This function checks for uniqueIDs to verify they are not duplicated */
function checkUniqueIDs(manifests) {
	const uniqueIDs = new Set()

	for (const manifest of manifests) {
		if (uniqueIDs.has(manifest.uniqueID)) {
			throw new Error(`Manifest with unique id '${manifest.uniqueID}' already exists.`)
		}
		uniqueIDs.add(manifest.uniqueID)
	}
}

/* This function checks for the module links to have the correct schema */
function checkModuleLinks(manifests) {
	for (const manifest of manifests) {
		if (manifest.module !== undefined) {
			// should be in this schema https://cdn.jsdelivr.net/npm/PUBLISHER/NAME@latest/PATH
			if (!manifest.module.startsWith("https://cdn.jsdelivr.net/npm/")) {
				throw new Error(
					`Module link '${manifest.module}' does not start with 'https://cdn.jsdelivr.net/npm/'.`
				)
			} else if (!manifest.module.includes("@latest")) {
				throw new Error(`Module link '${manifest.module}' does not include a package name.`)
			}
		}
	}
}
