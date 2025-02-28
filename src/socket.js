import { io } from "socket.io-client";
const socket = io("http://192.168.29.88:8000");
export default socket;