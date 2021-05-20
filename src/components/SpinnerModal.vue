<template>
  <div class="overlay">
    <div class="modal-container">
      <Spinner style="margin: auto;" />
    </div>
  </div>
</template>

<script>
import Spinner from '@/components/Spinner.vue'

export default {
  components: {Spinner}
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
  background-color: rgba(255, 255, 255, 0.7);
  z-index: 99;
}
.modal-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 160px;
  height: 160px;
  display: flex;
  flex-direction: row;
  align-items: center;
}
</style>
