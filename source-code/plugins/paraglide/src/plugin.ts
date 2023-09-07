import type { Plugin } from "@inlang/plugin"
import { ideExtensionConfig } from "./ideExtension/config.js"
import { id, displayName, description } from "../marketplace-manifest.json"

// ------------------------------------------------------------------------------------------------

export const plugin: Plugin = {
	meta: {
		id: id,
		displayName,
		description,
	},
	addCustomApi({ settings }) {
		return {
			"app.inlang.ideExtension": ideExtensionConfig(),
		}
	},
}
