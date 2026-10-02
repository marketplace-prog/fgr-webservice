<template>
  <div>
    <span>This page is protected. You should only be able to access it, if you are logged in:</span>
    <pre v-if="session">
      {{ session.access_token }}
    </pre>
  </div>
</template>

<script setup lang="ts">
const session = useSupabaseSession()
</script>
