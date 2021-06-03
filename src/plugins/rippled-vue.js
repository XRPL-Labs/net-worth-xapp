import { XrplClient } from 'xrpl-client'

let ws = null

export default {
    install: (app, options) => {
        const connect = async (url, options) => {
            if (ws != null) return ws
            try {
                const connection = new XrplClient(url, options)
                ws = await connection.ready()
                return ws
            } catch(e) {
                throw(e)
            }
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