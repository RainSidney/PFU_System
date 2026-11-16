import { useEffect } from 'react';
import api from '../api/axios';

export default function Dashboard() {
    useEffect(() => {
        api.get('/auth/me').then((res) => console.log(res.data));
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-500">Summaries and stats will go here.</p>
        </div>
    )
}