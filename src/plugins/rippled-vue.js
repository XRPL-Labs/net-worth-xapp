import { XrplClient } from 'xrpl-client'

let ws = null
let networkUrl
let networkAsset

export default {
    install: (app, options) => {
        const asset = () => {
            return networkAsset
        }

        const connect = async (url, options) => {
            networkUrl = url
            networkAsset = url.match(/xahau/) ? 'XAH' : 'XRP'

            if (ws != null) return ws
            try {
                ws = new XrplClient(url, options)
                // ws = await connection.ready()
                return ws
            } catch(e) {
                throw(e)
            }
        }

        const getState = () => {
            const state = ws.getState()
            return state
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
            on,
            asset,
        }
    }
}