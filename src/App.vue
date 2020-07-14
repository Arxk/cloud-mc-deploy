<template>
  <div id="app">
    <VultrServers/>
  </div>
</template>

<script>
// Using a separate component in case I need to add another provider or put something else here
import VultrServers from './components/VultrServers.vue'

export default {
  name: 'App',
  components: {
    VultrServers
  }
}
</script>
