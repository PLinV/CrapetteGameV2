import { useState, useEffect } from "react";
// import { Link } from 'react-router-dom';

export default function Test() {
    const [message, setMessage] = useState("en attente du serv"); 

    useEffect (() => {
        const recupDonne = async () => {
            try {
                const res = await fetch("http://localhost:3000/api/test");
                const data = await res.json();  

                setMessage(data.message); 

            } catch(error) {
                console.error("serv injoinable :", error);
                setMessage("eeeuh ça marche pas");
            }
        }; 

        recupDonne(); 

    }, []) 

    return (
        <h1 style={{color: 'white'}}> {message} </h1>
    )
}