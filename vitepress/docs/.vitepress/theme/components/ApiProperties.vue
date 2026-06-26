<script setup>
import { useData } from 'vitepress'

const { frontmatter } = useData()
const props = frontmatter.value.properties || []

function platLabel(plat, ver) {
  const names = { android: 'Android', iphone: 'iOS', ipad: 'iPad', macos: 'macOS' }
  return `${names[plat] || plat.charAt(0).toUpperCase() + plat.slice(1)}: ${ver}`
}

function platformInfo(p) {
  const PLATFORM_DEFAULT_SINCE = { android: '1.0', iphone: '1.0', ipad: '1.0', macos: '9.2.0' }
  const platforms = p.platforms ? (Array.isArray(p.platforms) ? p.platforms : [p.platforms]) : []
  const info = []
  if (typeof p.since === 'object') {
    const parts = Object.entries(p.since).map(([plat, ver]) => platLabel(plat, ver))
    info.push(parts.join(' | '))
  } else if (p.since && platforms.length) {
    const parts = platforms.map(plat => platLabel(plat, p.since))
    info.push(parts.join(' | '))
  } else if (p.since) {
    info.push(`Since: ${p.since}`)
  } else if (platforms.length) {
    const parts = platforms.map(plat => platLabel(plat, PLATFORM_DEFAULT_SINCE[plat] || '?'))
    info.push(parts.join(' | '))
  }
  return info.join(' · ')
}
</script>

<template>
  <div v-if="props.length">
    <h2 id="properties">Properties <a class="header-anchor" href="#properties">#</a></h2>
    <div v-for="p in props" :key="p.name" class="property">
      <div class="property-header">
      <h3 :id="p.name.toLowerCase().replace(/\s+/g, '-')">
        {{ p.name }}<span v-if="p.deprecated"> (deprecated)</span>
        <a class="header-anchor" :href="'#' + p.name.toLowerCase().replace(/\s+/g, '-')">#</a>
      </h3>
      <aside v-if="platformInfo(p)" class="platforms" v-html="platformInfo(p)"></aside>
      </div>
      <p><strong>Type:</strong> <code>{{ p.type }}</code></p>
      <p v-if="p.summary" v-html="p.summary"></p>
      <div v-if="p.description" class="description" v-html="p.description"></div>

    </div>
  </div>
</template>

<style scoped>
.property {
  margin-bottom: 1rem;
  padding: 0.2rem 0;
  border-bottom: 1px solid var(--vp-c-divider);
}
.property h3 {
  margin-top: 0;
}
.property-header {
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.description {
  margin-top: 0.5rem;
}
.platforms {
  font-size: 0.85rem;
}
</style>
