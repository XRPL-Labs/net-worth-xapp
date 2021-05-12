import RippledWsClient from 'rippled-ws-client'

let ws = null

export default {
    install: (app, options) => {
        const connect = (url, options) => {
            if (ws != null) return ws
            return new Promise((resolve, reject) => {
                new RippledWsClient(url, options).then(connection => {
                    ws = connection
                    resolve(connection)
                }).catch(error => {
                    reject(error)
                })
            })
        }

        const getState = () => {
            return ws.getState()
        }

        const close = () => {
            ws.close().then(closeInfo => {
                console.log('Closed', closeInfo)
            }).catch(error => {
                console.log('Close error', error)
            })
        }

        const send = async (command) => {
            const response = await ws.send(command)
            return response
        }

        const on = (event, fn) => {
            ws.on(event, fn)
        }

        app.config.globalProperties.$rippled = {
            connect,
            getState,
            close,
            send,
            on
        }
    }
}