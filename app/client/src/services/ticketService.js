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

// syncTickets calls the on-demand sync endpoint which reconciles open/escalated
// tickets against GitHub before returning the full list.
// Returns { tickets: [...], synced: N }
export const syncTickets = async () => {
    const userData = JSON.parse(localStorage.getItem('userData') || "{}");
    const token = userData.token || "";
    const res = await instance.get("/api/github/tickets/sync", {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};
