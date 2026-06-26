<script setup>
import { useData } from 'vitepress'

const { frontmatter } = useData()
const events = frontmatter.value.events || []

function slugify(text) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}
</script>

<template>
  <div v-if="events.length">
    <h2>Events</h2>
    <div v-for="e in events" :key="e.name" class="event">
      <h3 :id="slugify(e.name)">
        {{ e.name }}
        <a class="header-anchor" :href="'#' + slugify(e.name)">#</a>
      </h3>
      <p v-if="e.summary" v-html="e.summary"></p>
      <div v-if="e.description" class="description" v-html="e.description"></div>
      <div v-if="e.properties && e.properties.length">
        <strong>Event Properties:</strong>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in e.properties" :key="p.name">
              <td><code>{{ p.name }}</code></td>
              <td><code>{{ p.type }}</code></td>
              <td v-html="p.summary || ''"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.event {
  margin-bottom: 1.5rem;
}
.description {
  margin-top: 0.5rem;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5rem;
}
th, td {
  border: 1px solid var(--vp-c-divider);
  padding: 0.5rem;
  text-align: left;
}
th {
  background: var(--vp-c-bg-soft);
  font-weight: 600;
}
</style>
