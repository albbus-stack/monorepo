import { Title, Meta } from "@solidjs/meta"
import { For } from "solid-js"
import { Layout } from "../Layout.jsx"
import tableOfContents from "../../../../../blog/tableOfContents.json"

export function Page() {
	return (
		<>
			<Title>inlang Blog - Globalization infrastructure for software</Title>
			<Meta
				name="description"
				content="Posts that revolve around inlang, git, and globalization (i18n)."
			/>
			<Meta name="og:image" content="/images/inlang-social-image.jpg" />
			<Layout>
				<div class="flex-row min-h-full w-full items-center justify-center mx-auto md:max-w-2xl divide-y divide-solid divide-outline">
					<For each={Object.entries(tableOfContents)}>
						{([, page]) => (
							<div class="py-12">
								<a href={"/blog/" + page.slug} class="text-ellipsis space-y-4">
									<h2 class="text-xl font-bold tracking-tight text-on-backround truncate">
										{page.title}
									</h2>
									<p>{page.description}</p>
									{/* using link-primary and text-primary to render the link color by default in primary 
							but also get hover effects from link-primary */}
									<p class="link text-primary link-primary">Read more…</p>
								</a>
							</div>
						)}
					</For>
				</div>
			</Layout>
		</>
	)
}
