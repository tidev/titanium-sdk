<script setup>
import { useData } from 'vitepress'

const { frontmatter } = useData()
const methods = frontmatter.value.methods || []

function slugify(text) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}
</script>

<template>
  <div v-if="methods.length">
    <h2>Methods</h2>
    <div v-for="m in methods" :key="m.name" class="method">
      <h3 :id="slugify(m.name)">
        {{ m.name }}
        <a class="header-anchor" :href="'#' + slugify(m.name)">#</a>
      </h3>
      <p v-if="m.summary" v-html="m.summary"></p>
      <div v-if="m.description" class="description" v-html="m.description"></div>
      <div v-if="m.parameters && m.parameters.length">
        <strong>Parameters:</strong>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Summary</th>
              <th>Optional</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="param in m.parameters" :key="param.name">
              <td><code>{{ param.name }}</code></td>
              <td><code>{{ param.type }}</code></td>
              <td v-html="param.summary || ''"></td>
              <td>{{ param.optional ? 'Yes' : 'No' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="m.returns">
        <strong>Returns:</strong> <code>{{ m.returns.type }}</code><span v-if="m.returns.summary"> &mdash; {{ m.returns.summary }}</span>
      </p>
    </div>
  </div>
</template>

<style scoped>
.method {
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
