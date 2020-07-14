<template>

  <!-- Deploy a new VPS, if none is already running -->
  <i-header class="_text-center" fullscreen v-if="activeServers.length === 0">
    <div class="_fixed-top _margin-top-xs-4 _margin-top-sm-4 _margin-top-md-6 _margin-top-lg-8 _margin-top-xl-8"><i-loader variant="light" size="lg" v-if="!hasChecked"/></div>
    <i-button class="_sticky-top" variant="success" size="lg" block :disabled="hasServers || hasCreated || !hasChecked" @click="createServer">Start server</i-button>
    <i-button class="_margin-top-8" @click="toggleLight">
      <i-icon icon="light" />
    </i-button>
  </i-header>

  <!-- Shows the server info, after deploying it, or if there's one already running -->
  <i-container class="_margin-top-xs-1 _margin-top-sm-4 _margin-top-md-6 _margin-top-lg-8 _margin-top-xl-8" v-else>
    <i-row center-xs middle-xs>
      <i-column :xs="true" :lg=10>
        <!-- We show all the servers (with the tag 'minecraft'), although as of now, the interface only allows to deploy one -->
        <i-list-group class="_background-gray-80">
          <i-list-group-item v-for="server in activeServers" :key="server.SUBID">
            <div class="_display-flex _flex-direction-column">

              <!-- Shows the server label as title (style depending if ready/pending/error) -->
              <div class="_display-flex _justify-content-space-bextween _flex-wrap _align-items-center">
                <h4 class="_flex-grow-1" v-if="hasMinecraft(server.SUBID) && server.status === 'active' && server.server_state === 'ok' && server.power_status === 'running'">
                  {{ server.label }}
                </h4>
                <h4 class="_flex-grow-1" v-else-if="!hasMinecraft(server.SUBID) || server.status === 'pending' || server.server_state !== 'ok'">
                  {{ server.label }} <span class="_text-warning _font-weight-extralight">(not ready)</span>
                </h4>
                <h4 class="_flex-grow-1" v-else>
                  {{ server.label }} <span class="_text-danger _font-weight-extralight">(stopped)</span>
                </h4>
                <i-tooltip placement="top">
                  <i-button size="lg" circle><a class="_text-reset" :href="server.main_ip + ':9090'" target="_blank"><i-icon icon="code"></i-icon></a></i-button>
                  <template slot="body">Open control panel</template>
                </i-tooltip>
                <i-tooltip placement="top">
                  <i-button size="lg" circle @click="listServers"><i-icon icon="chevron-down"></i-icon></i-button>
                  <template slot="body">Refresh server info</template>
                </i-tooltip>
              </div>
              <!-- Shows the server ip and specs -->
              <div class="_margin-top-1 _display-flex _justify-content-space-between _flex-wrap">
                <span>
                  IP: <code>{{ server.main_ip }}</code>
                  <i-tooltip placement="top">
                    <i-button size="sm" circle @click="copyText(server.main_ip)"><i-icon icon="file"></i-icon></i-button>
                    <template slot="body">Copy IP</template>
                  </i-tooltip>
                </span>
                <span>Specs: <code>{{ server.vcpu_count }} vCPU, {{ server.ram | trim }} RAM, {{ server.os }}</code></span>
                <span>Created: <code>{{ server.date_created | fromNow }}</code></span>
              </div>
              <!-- Shows the server status (style depending if ready/pending/error) -->
              <div class="_margin-top-1" v-if="hasMinecraft(server.SUBID) && server.status === 'active' && server.server_state === 'ok' && server.power_status === 'running'">
                <i-alert variant="success" size="sm">
                  <template slot="icon"><i-icon icon="info"></i-icon></template>
                  <div class="_display-flex _justify-content-space-around">
                    <div>Status: <span class="_font-italic">{{ server.status }}</span></div>
                    <div>Minecraft: <span class="_font-italic">{{ hasMinecraft(server.SUBID) ? 'online' : 'offline' }}</span></div>
                    <div>Server: <span class="_font-italic">{{ server.server_state }}</span></div>
                    <div>Power: <span class="_font-italic">{{ server.power_status }}</span></div>
                  </div>
                </i-alert>
              </div>
              <div class="_margin-top-1" v-else-if="!hasMinecraft(server.SUBID) || server.status === 'pending' || server.server_state !== 'ok'">
                <i-alert variant="warning" size="sm">
                  <template slot="icon">
                    <div style="height: 20px; width: 20px"><i-loader variant="light" size="auto"/></div>
                  </template>
                  <div class="_display-flex _justify-content-space-around _flex-wrap">
                    <div>Status: <span class="_font-italic">{{ server.status }}</span></div>
                    <div>Minecraft: <span class="_font-italic">{{ hasMinecraft(server.SUBID) ? 'online' : 'offline' }}</span></div>
                    <div>Server: <span class="_font-italic">{{ server.server_state }}</span></div>
                    <div>Power: <span class="_font-italic">{{ server.power_status }}</span></div>
                  </div>
                </i-alert>
              </div>
              <div class="_margin-top-1" v-else>
                <i-alert variant="danger" size="sm">
                  <template slot="icon"><i-icon icon="danger"></i-icon></template>
                  <div class="_display-flex _justify-content-space-around">
                    <div>Status: <span class="_font-italic">{{ server.status }}</span></div>
                    <div>Minecraft: <span class="_font-italic">{{ hasMinecraft(server.SUBID) ? 'online' : 'offline' }}</span></div>
                    <div>Server: <span class="_font-italic">{{ server.server_state }}</span></div>
                    <div>Power: <span class="_font-italic">{{ server.power_status }}</span></div>
                  </div>
                </i-alert>
              </div>

            </div>
          </i-list-group-item>
        </i-list-group>
      </i-column>
    </i-row>
  </i-container>

</template>

<script>
// Forked from vultr-node (https://github.com/vultr/vultr-node)
// Replaced node-fetch with axios
// Renamed '/api' to '/vultr' in case I need to implement other providers (under ../cloud-providers/<PROVIDERNAME>)
const cloudProviders = require('../cloud-providers');
const axios = require('axios').default;
const alarm = new Audio(require('../assets/Magic-Spell-A-Short-www.fesliyanstudios.com.mp3'))

export default {
  name: 'VultrServers',
  data: () => ({
    hasCreated: false, // If we have clicked the 'start server' button (to only allow one server deploy at a time)
    hasChecked: false, // If we have checked the VPS list (via this.listServers) after a refresh/1st load
    serverList: {}, // Stores the info of the VPS servers on Vultr (via this.listServers)
    minecraftList: [] // Stores the info of the minecraft servers on the VPS (via this.getMinecraft)
  }),
  computed: {
    // Returns the API url (with or without proxy)
    apiUrl: function () {
      return (process.env.VUE_APP_PROXY_CORS_ENABLED === 'true' ? process.env.VUE_APP_PROXY_CORS_URL : '') + process.env.VUE_APP_VULTR_API_URL
    },
    // Returns the Vultr API key
    apiKey: function () {
      return process.env.VUE_APP_VULTR_API_KEY
    },
    // Returns the VPS list as an array instead of an object (easier to iterate & access)
    activeServers: function () {
      const servers = []
      for (const subid of Object.keys(this.serverList))
        servers.push(this.serverList[subid])
      return servers
    },
    // Checks if there's any VPS on the Vultr account
    hasServers: function () {
      if (this.hasChecked)
        if (this.activeServers.length > 0)
          return true
      return false
    }
  },
  mounted: function () {
    // Checks if a VPS is already running
    this.listServers()
    // Starts polling the minecraft servers every 3min (the mcapi.us API caches the server info for 5min)
    setInterval(this.getMinecraft, 180000)
  },
  methods: {
    // Initializes the Vultr API client
    cloudInstance: function () {
      return cloudProviders.initialize({ provider: 'vultr', apiUrl: this.apiUrl, apiKey: this.apiKey })
    },
    // Sends a request to the Vultr API to deploy the VPS
    createServer: function () {
      this.hasCreated = true
      try {
        this.cloudInstance().server.create({
          tag: 'minecraft',
          hostname: 'minecraft',
          label: 'PaperMC 1.16.1',
          DCID: parseInt(process.env.VUE_APP_VULTR_SERVER_DCID),
          VPSPLANID: parseInt(process.env.VUE_APP_VULTR_SERVER_VPSPLANID),
          OSID: parseInt(process.env.VUE_APP_VULTR_SERVER_OSID),
          SCRIPTID: parseInt(process.env.VUE_APP_VULTR_SERVER_SCRIPTID),
          FIREWALLGROUPID: process.env.VUE_APP_VULTR_SERVER_FIREWALLGROUPID
        }).then(subid => {
          if (subid instanceof Error)
            this.$toast.error(subid.message, { position: 'top', duration: 5000 })
          else {
            // Gets the VPS list with the new server
            this.listServers()
            // Starts polling for updates every 1min (via this.listServers)
            this.watchServers()
          }
        })
      }
      catch (error) {
        this.$toast.error(error.message, { position: 'top', duration: 5000 })
      }
    },
    // Gets the VPS list info (with the tag 'minecraft')
    listServers: function () {
      try {
        this.cloudInstance().server.list({ tag: 'minecraft' }).then(servers => {
          if (servers instanceof Error) {
            // Doesn't let the user create a server if there's an error getting existing servers
            this.hasChecked = true
            this.$toast.error(servers.message, { position: 'top', duration: 5000 })
          } 
          else {
            // Updates the servers variable with the latest info
            this.serverList = servers
            // Initializes a variable to keep track of the minecraft server status API (via this.getMinecraft)
            const minecraft = []
            for (const subid of Object.keys(servers))
              minecraft.push({ id: [subid], status: false })
            this.minecraftList = minecraft
            // On a refresh/1st run
            if (!this.hasCreated) {
              // Starts polling the minecraft server status API immediately
              this.getMinecraft()
              // Watches the VPS status if there's a server pending to deploy
              const pending = this.activeServers.filter(s => s.status === 'pending' || s.server_state !== 'ok')
              if (pending.length > 0)
                this.watchServers()
            }
            // Only allows for one server at a time
            if (!this.hasChecked && !this.hasServers && minecraft.length === 0)
              this.$toast.info('Ready to deploy new server', { position: 'top', duration: 5000 })
            this.hasChecked = true
          }
        })
      }
      catch (error) {
        this.$toast.error(error.message, { position: 'top', duration: 5000 })
      }
    },
    // Starts polling the Vultr API for the VPS updates every 1min (to check when the VPS is ready)
    watchServers: function () {
      const serverWatcher = setInterval(() => {
        // Stops checking for updates once the VPS is fully booted (this is to not send too many request to the proxy)
        const serversReady = this.activeServers.filter(s => s.status === 'active' && s.server_state === 'ok' && s.power_status === 'running')
        if (serversReady.length > 0) {
          this.watchMinecraft()
          clearInterval(serverWatcher)
        }
        this.listServers()
      }, 60000)
    },
    // Starts watching for when the minecraft server is first online
    watchMinecraft: function() {
      const minecraftWatcher = setInterval(() => {
        for (const subid of Object.keys(this.serverList))
          if (this.hasMinecraft(subid)) {
            alarm.play()
            clearInterval(minecraftWatcher)
          }
      }, 10000)
    },
    // Uses mcapi.us to check the online status of the minecraft server
    getMinecraft: function () {
      for (const subid of Object.keys(this.serverList)) {
        // Only send the request if the VPS is fully booted
        if (this.serverList[subid].status === 'active' && this.serverList[subid].server_state === 'ok' && this.serverList[subid].power_status === 'running')
          axios('https://mcapi.us/server/status?ip=' + this.serverList[subid].main_ip).then(response => {
            if (response.status !== 200)
              this.$toast.error(response.statusText, { position: 'top', duration: 5000 })
            this.minecraftList.filter(s => s.id == subid)[0].status = response.data.online
          })
        else
          this.minecraftList.filter(s => s.id == subid)[0].status = false
      }
    },
    // Checks if the VPS has their Minecraft server online  (via this.getMinecraft)
    hasMinecraft: function (subid) {
      const minecraft = this.minecraftList.filter(s => s.id == subid)
      if (minecraft.length > 0)
        return minecraft[0].status
      return false
    },
    // Copies a text to the clipboard
    copyText: function (text) {
      this.$copyText(text).then(() => {
        this.$toast.default('Copied ' + text + ' to clipboard', { position: 'top', duration: 1500 })
      })
    },
    // Toggles the light/dark mode
    toggleLight: function () {
      this.$inkline.config.variant = this.$inkline.config.variant === 'light' ? 'dark' : 'light'
    }
  }
}
</script>
