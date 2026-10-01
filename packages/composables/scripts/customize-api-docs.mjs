import { ReflectionKind } from 'typedoc'
import { MarkdownPageEvent } from 'typedoc-plugin-markdown'

function interfaceSummary(reflection) {
  const rows = reflection.children?.map((member) => {
    const name = `${member.name}${member.flags.isOptional ? '?' : ''}`
    const type = member.type?.toString().replaceAll('|', String.raw`\|`) ?? ''
    const description = member.comment?.summary
      .map((part) => part.text)
      .join('')
      .replace(/\s+/g, ' ')
      .replaceAll('|', String.raw`\|`) ?? ''

    return `| \`${name}\` | \`${type}\` | ${description} |`
  }) ?? []

  return `\n| Member | Type | Description |\n| --- | --- | --- |\n${rows.join('\n')}\n`
}

export function load(app) {
  app.renderer.on(MarkdownPageEvent.END, (page) => {
    if (page.url.startsWith('functions/use')) {
      const signature = page.model.signatures?.[0]

      for (const parameter of signature?.parameters ?? []) {
        const reflection = parameter.type?.reflection
        if (reflection?.kind !== ReflectionKind.Interface) continue

        const link = `[\`${reflection.name}\`](../interfaces/${reflection.name}.md)`
        const marker = `### ${parameter.name}\n\n${link}\n`
        page.contents = page.contents.replace(marker, `${marker}${interfaceSummary(reflection)}`)
      }

      const result = signature?.type?.reflection
      if (result?.kind === ReflectionKind.Interface) {
        const link = `[\`${result.name}\`](../interfaces/${result.name}.md)`
        const marker = `## Returns\n\n${link}\n`
        page.contents = page.contents.replace(marker, `${marker}${interfaceSummary(result)}`)
      }
    }

    if (page.url !== 'index.md') return

    for (const reflection of page.project.getReflectionsByKind(ReflectionKind.Function)) {
      const comment = reflection.comment ?? reflection.signatures?.[0]?.comment
      let status
      if (comment?.hasModifier('@experimental')) {
        status = 'Experimental'
      } else if (comment?.hasModifier('@beta')) {
        status = 'Beta'
      }

      if (status) {
        const link = `- [${reflection.name}](functions/${reflection.name}.md)`
        page.contents = page.contents.replace(link, `${link} **\`${status}\`**`)
      }
    }
  })
}