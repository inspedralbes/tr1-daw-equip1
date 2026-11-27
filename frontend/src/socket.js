import { io } from 'socket.io-client'

export const socket = io('http://localhost:3000')

socket.on('connect', () => console.log('socket conectado', socket.id))
socket.on('connect_error', (e) => console.log('error de conexión:', e.message))