import { ReflectionKind } from 'typedoc'
import { MarkdownPageEvent } from 'typedoc-plugin-markdown'

export function load(app) {
  app.renderer.on(MarkdownPageEvent.END, (page) => {
    if (page.url !== 'index.md') return

    for (const reflection of page.project.getReflectionsByKind(ReflectionKind.Function)) {
      const comment = reflection.comment ?? reflection.signatures?.[0]?.comment
      const status = comment?.hasModifier('@experimental')
        ? 'Experimental'
        : comment?.hasModifier('@beta')
          ? 'Beta'
          : undefined

      if (status) {
        const link = `- [${reflection.name}](functions/${reflection.name}.md)`
        page.contents = page.contents.replace(link, `${link} **\`${status}\`**`)
      }
    }
  })
}