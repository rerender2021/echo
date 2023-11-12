import { io } from "socket.io-client";

// https://socket.io/how-to/use-with-react
export const socket = io("http://localhost:8350", {
  autoConnect: true,
});
