import { describe, expect, it } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App', () => {
  it('mounts the flash card app', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('Language Flip Cards')
    expect(wrapper.text()).toContain('Language')
    expect(wrapper.text()).toContain('Swahili')
    expect(wrapper.text()).toContain('French')
    expect(wrapper.text()).toContain('Deck notes')
    expect(wrapper.text()).toContain('Card note')
  })

  it('selects French by default', () => {
    const wrapper = mount(App)
    const languageSelect = wrapper.get('#languageSelect').element as HTMLSelectElement

    expect(languageSelect.value).toBe('french')
  })
})
