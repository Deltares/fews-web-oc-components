<template>
  <div class="column-menu">
    <v-toolbar dense flat>
      <v-btn v-if="currentLevel" icon @click="onTitleClick">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <slot name="menu-title" :text="currentTitle" :depth="currentLevel" >
        <v-toolbar-title>
          {{ currentTitle }}
        </v-toolbar-title>
      </slot>
    </v-toolbar>
    <v-divider/>
    <v-window
      v-model="currentLevel"
    >
    <v-window-item
      v-for="(item, i) in stack"
      v-bind:key="i"
      >
    <v-list-item-group>
      <v-list-item v-for="item in item.children" :class="`list-item--${item.id}`" v-bind:key="item.id" @click="(event) => { onItemClick(event, item) }" :to="item.to" >
        <v-list-item-content>
          <v-list-item-title v-text="item.text"></v-list-item-title>
        </v-list-item-content>
        <v-list-item-icon v-if="item.children">
          <v-icon>mdi-chevron-right</v-icon>
        </v-list-item-icon>
      </v-list-item>
    </v-list-item-group>
    </v-window-item>
    </v-window>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { ColumnItem } from './ColumnItem'

@Component
export default class ColumnMenu extends Vue {
  /**
   * Array with menu items
   */
  @Prop({ default: () => { return {} } })
  items!: ColumnItem

  /**
   * Array with menu items
   */
  @Prop({ default: () => { return {} } })
  value!: { panelId: '', groupId: '' }

  stack: ColumnItem[] = []

  @Watch('items', { deep: true })
  onItemsChange (): void {
    this.stack = []
    console.log(this.items)
    this.stack.push(this.items)
    const groupId = this.value.groupId
    if (groupId) {
      this.findInCurrentLevel(groupId)
    }
    const panelId = this.value.panelId
    if (panelId) {
      this.findInCurrentLevel(panelId)
      this.stack.pop()
    }
  }

  mounted (): void {
    this.onItemsChange()
  }

  get currentTitle (): string {
    return this.stack.length > 0 ? this.stack[this.stack.length - 1].text : ''
  }

  get currentLevel (): number {
    return this.stack.length - 1
  }

  onTitleClick (): void {
    if (this.stack.length > 1) {
      this.stack.pop()
    }
  }

  onItemClick (event: Event, item: ColumnItem): void {
    if (item.children) {
      this.stack.push(item)
    }
    this.$emit('click', event, item)
  }

  findInCurrentLevel (id: string): boolean {
    if (this.stack[this.currentLevel].id === id) return true
    const children = this.stack[this.currentLevel].children
    if (children !== undefined) {
      for (const child of children) {
        this.stack.push(child)
        const found = this.findInCurrentLevel(id)
        if (found) {
          return true
        }
        this.stack.pop()
      }
    }
    return false
  }
}
</script>
