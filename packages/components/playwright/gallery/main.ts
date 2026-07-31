import { createApp, h, shallowRef, type App, type Component } from 'vue'
import vuetify from '../../src/plugins/vuetify'

type StoryModule = Record<string, Component>
type MountOptions = {
  story: string
  props?: Record<string, unknown>
}

const stories = import.meta.glob<StoryModule>('../../src/**/*.story.ts')

const toId = (filePath: string) =>
  filePath
    .replace(/^(\.\.\/)+src\//, '')
    .replace(/\.story\.\w+$/, '')

async function resolveStory(storyId: string): Promise<Component | null> {
  const separator = storyId.lastIndexOf('/')
  const storyPath = separator >= 0 ? storyId.slice(0, separator) : storyId
  const exportName = separator >= 0 ? storyId.slice(separator + 1) : 'default'

  const file = Object.keys(stories).find(
    (key) => toId(key) === storyPath || toId(key).endsWith(`/${storyPath}`),
  )

  if (!file) {
    return null
  }

  const module = await stories[file]()
  return (module[exportName] || module.default) as Component
}

const story = shallowRef<Component | null>(null)
const props = shallowRef<Record<string, unknown>>({})
const host = { render: () => (story.value ? h(story.value, props.value) : null) }

let app: App | undefined

;(window as Window & {
  mount: (params: MountOptions) => Promise<void>
  unmount: () => Promise<void>
}).mount = async ({ story: storyId, props: nextProps }: MountOptions) => {
  const resolvedStory = await resolveStory(storyId)
  if (!resolvedStory) {
    throw new Error(`Unknown story: ${storyId}`)
  }

  story.value = resolvedStory
  props.value = nextProps ?? {}

  if (!app) {
    app = createApp(host)
    app.use(vuetify)
    app.mount('#root')
  }
}

;(window as Window & {
  unmount: () => Promise<void>
}).unmount = async () => {
  app?.unmount()
  app = undefined
}
