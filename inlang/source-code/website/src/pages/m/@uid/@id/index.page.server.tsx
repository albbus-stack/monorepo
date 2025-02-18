import { registry } from "@inlang/marketplace-registry"
import { convert } from "@inlang/markdown"
import type { PageContext } from "#src/renderer/types.js"
import type { PageProps } from "./index.page.jsx"
import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import { redirect } from "vike/abort"

export async function onBeforeRender(pageContext: PageContext) {
	const item = registry.find(
		(item: any) => item.uniqueID === pageContext.routeParams.uid
	) as MarketplaceManifest & { uniqueID: string }

	if (!item) throw redirect("/m/404")

	if (item.id.replaceAll(".", "-").toLowerCase() !== pageContext.routeParams.id?.toLowerCase()) {
		throw redirect(`/m/${item.uniqueID}/${item.id.replaceAll(".", "-").toLowerCase()}`)
	}

	const text = await (
		await fetch(typeof item.readme === "object" ? item.readme.en : item.readme)
	).text()
	const markdown = await convert(text)

	const recommends = item.recommends
		? registry.filter((i: any) => {
				for (const recommend of item.recommends!) {
					if (recommend.replace("m/", "") === i.uniqueID) return true
				}
				return false
		  })
		: undefined

	return {
		pageContext: {
			pageProps: {
				markdown: markdown,
				manifest: item,
				recommends: recommends,
			} satisfies PageProps,
		},
	}
}
