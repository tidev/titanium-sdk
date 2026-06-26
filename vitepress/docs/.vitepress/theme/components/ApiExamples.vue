<script setup>
import { useData } from 'vitepress'

const { frontmatter } = useData()
const examples = frontmatter.value.examples || []
</script>

<template>
  <div v-if="examples.length">
    <h2 id="examples">Examples <a class="header-anchor" href="#examples">#</a></h2>
    <div v-for="(ex, i) in examples" :key="i" class="example">
      <h3 v-if="ex.title">{{ ex.title }}</h3>
      <p v-if="ex.intro" class="example-intro">{{ ex.intro }}</p>
      <div v-for="(block, j) in ex.code" :key="j" class="code-block" :class="block.language ? 'language-' + block.language : ''">
        <pre v-if="block.language" class="shiki"><code>{{ block.content }}</code></pre>
        <pre v-else><code>{{ block.content }}</code></pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.example {
  margin-bottom: 1.5rem;
}
.example-intro {
  margin-top: 0.5rem;
}
.code-block {
  margin-top: 0.5rem;
}
</style>
