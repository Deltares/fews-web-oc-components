/* eslint-disable import/no-extraneous-dependencies */
import { configure } from '@storybook/vue'

const req = require.context('../../src/', true, /.stories.(t|j)s$/)

function loadStories () {
  req.keys().forEach(filename => req(filename))
}

configure(loadStories, module)
