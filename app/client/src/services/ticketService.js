import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const instance = axios.create({
    baseURL: API_URL
});

export const fetchTickets = async () => {
    try {
        const userData = JSON.parse(localStorage.getItem('userData') || "{}");
        const token = userData.token || "";
        const res = await instance.get("/api/github/tickets", {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data || [];
    } catch (err) {
        console.error("Error fetching tickets:", err);
        throw err;
    }
};
