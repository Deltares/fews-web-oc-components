import fs from 'node:fs'
import path from 'node:path'

const apiPath = '../../docs/composables/api'

function getLinks(folder) {
  const dir = path.join(apiPath, folder)

  if (!fs.existsSync(dir)) {
    return []
  }

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const name = file.replace('.md', '')
      return {
        text: name,
        link: `/composables/api/${folder}/${name}`,
      }
    })
    .sort((a, b) => a.text.localeCompare(b.text))
}

const sidebar = [
  {
    text: '@deltares/fews-web-oc-composables',
    items: [
      {
        text: 'Overview',
        link: '/composables/api/',
      },
    ],
  },
  {
    text: 'Functions',
    items: getLinks('functions'),
  },
  {
    text: 'Interfaces',
    items: getLinks('interfaces'),
  },
  {
    text: 'Type Aliases',
    items: getLinks('type-aliases'),
  },
]

fs.writeFileSync(
  '../../docs/.vitepress/composables-api-sidebar.json',
  JSON.stringify(sidebar, null, 2),
)
