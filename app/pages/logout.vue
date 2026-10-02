<template>
  <div>
    <span>This page is protected. You should only be able to access it, if you are logged in:</span>
    <pre v-if="session">
      {{ session.access_token }}
    </pre>
    <pre v-else>
      You are not logged in.
    </pre>
    <Button @click="handleLogout">
      Logout
    </Button>
  </div>
</template>

<script setup lang="ts">
const session = useSupabaseSession()
const supabase = useSupabaseClient()
import { toast } from 'vue-sonner'

const handleLogout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error logging out:', error)
    toast.error('Error logging out: ' + error.message)
  }
}
</script>
