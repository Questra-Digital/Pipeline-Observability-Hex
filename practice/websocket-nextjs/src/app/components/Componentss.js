'use client'

import React, { useEffect, useState } from "react";
import io from 'socket.io-client';

export default function Componentss(props) {
    const [buttonCont, setButtonCont] = useState('send Event');
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io("http://localhost:5000");

        newSocket.on('connect', () => {
            console.log(newSocket.id);
        });

        newSocket.on("responseEvent", (data) => {
            setButtonCont(data);
        });

        newSocket.on('connect_error', (error) => {
            console.error("Connection Error:", error);
        });

        newSocket.on('disconnect', (reason) => {
            console.log("Disconnected:", reason);
        });

        newSocket.on('error', (error) => {
            console.error("Socket Error:", error);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const sendSocketEvent = () => {
        if (socket) {
            socket.emit("myevent", "Hello, Server");
        }
    };

    return (
        <button className="h-auto m-6 p-3 bg-white text-black font-semibold rounded" onClick={sendSocketEvent}>
            {buttonCont}
        </button>
    );
}
