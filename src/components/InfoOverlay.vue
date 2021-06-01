<template>
  <div v-show="active" @click.self="active = false" class="overlay">
    <div id="overlay-element">
        <div class="overlay-header">
            <h3>{{ header }}</h3>
            <button @click="active = false" class="btn btn-link"><fa :icon="['fas', 'times']" /></button>
        </div>
        {{ body }}
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      active: false,
      header: 'Header',
      body: 'Body'
    }
  },

  async created() {
    this.$emitter.on('info-overlay', (obj) => {
      this.header = obj.header
      this.body = obj.body
      this.active = true
    })
  }
}
</script>

<style scoped>
.overlay {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--var-overlay);
  z-index: 99;
}
#overlay-element {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: var(--var-bg-color);
  width: 85%;
  /* height: 300px; */
  height: 70%;
  padding: 1rem;
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.overlay-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
}
.overlay-header img {
  margin-left: 1rem;
}
.overlay-header h3 {
  margin-left: 0.1rem;
}
.overlay-header .btn {
  margin-left: auto;
  color: var(--var-txt-color);
}
.overlay-header .btn svg {
  transform: scale(1.5);
  vertical-align: middle;
  margin: 0;
  padding: 0;
}
ul {
  list-style-type: none;
  margin: 0;
  padding: 0.5rem;
  font-size: 15px;
  height: 100%;
  overflow: auto;
  width: calc(100% - 1rem);
  align-self: center;
  color: var(--var-txt-color);
  background: var(--var-tint-color);
  /* border-top: 2px solid var(--var-silver); */
  /* border-bottom: 2px solid var(--var-silver); */
  border-radius: 1rem;
}
li {
  border-bottom: 1px solid var(--var-border);
  padding: 0.5rem 0.5rem 0.5rem 0.5rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
}
li:last-child {
  border: none;
}
li h5 {
  margin: 0.1rem 0 0.2rem 0;
}
h2.total {
  margin: 0.5rem 0;
}
h3.mono.big {
  width: 90%;
  font-weight: 700 !important;
  font-family: proxima-nova, sans-serif;
  background: var(--var-tint-color);
  border-radius: 0.5rem;
  text-align: center;
  padding: 0.5rem 1rem;
  margin: 0.5rem 1rem 0 1rem;
  font-size: 1.7rem;
}
h3.mono.big small {
  display: block;
  font-size: 0.8rem;
  margin-top: 0.1rem;
  color: var(--var-grey);
}
.imgandasset {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
}
img.currencyicon {
  width: 2.1rem;
  height: 2.1rem;
  object-fit: cover;
  margin-right: 10px;
  border: 2px solid var(--var-daker);
  border-radius: 0.5rem;
  padding: 0.1rem;
}
img.currencyicon.xrp {
  width: 1.3rem;
  height: 1.3rem;
  object-fit: cover;
  margin-right: 10px;
  border: 2px solid var(--var-darker);
  border-radius: 0.5rem;
  padding: 0.5rem;
  background: var(--var-darker);
}
</style>
