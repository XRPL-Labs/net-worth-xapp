<template>
    <div @click.self="active = false" v-if="active" class="overlay">
        <div class="modal-container">
            <div class="column">
                <h2>{{ header }}</h2>
                <p class="margin-0">{{ msg }}</p>
                <a class="btn btn-primary btn-0-margin" @click="active = false">{{ buttonText }}</a>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            active: false,
            type: 'info',
            header: 'Header',
            msg: 'No message',
            buttonText: 'close'
        }
    },
    mounted() {
        this.$emitter.on('modal', options => {
            this.header = options.title
            this.msg = options.text
            this.buttonText = options.buttonText
            this.active = true
        })
    }
}
</script>

<style scoped>
.column {
    padding: 0 5px;
}
.overlay {
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0,0,0,0.5);
    z-index: 99;
}
.modal-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: var(--var-bg-color);
    width: 160px;
    height: 160px;
    padding: 10px;
    border-radius: 15px;
    display: flex;
    flex-direction: row;
    align-items: center;
}
h2 {
    margin: 0;
}
</style>
