"use client";

import { useEffect, useState } from "react";

type Devotee = {
  name: string;
  amount: number;
  sevaName: string;
  createdAt: string;
};

export function DevoteeTicker() {
  const [devotees, setDevotees] = useState<Devotee[]>([]);

  useEffect(() => {
    const fetchTopDevotees = async () => {
      try {
        const res = await fetch(`/api/top-devotees?t=${Date.now()}`, {
          cache: "no-store"
        });
        const data = await res.json();
        if (data.devotees && data.devotees.length > 0) {
          setDevotees(data.devotees);
        } else {
          setDevotees([]);
        }
      } catch (error) {
        console.error("Failed to fetch devotees", error);
      }
    };
    
    fetchTopDevotees();
    const interval = setInterval(fetchTopDevotees, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (devotees.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-saffron to-gold text-white overflow-hidden whitespace-nowrap py-2 border-y-2 border-saffron/30 relative">
      <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay bg-gradient-to-r from-white/10 via-transparent to-white/10"></div>
      <div className="flex animate-scroll-left w-max">
        {/* Render three times for seamless infinite scrolling */}
        {[...devotees, ...devotees, ...devotees].map((devotee, index) => (
          <div key={index} className="inline-flex items-center mx-6 gap-2">
             <span className="text-xl">🕉️</span>
             <span className="font-medium">{devotee.name}</span>
             <span className="text-white/80 text-sm">donated</span>
             <span className="font-bold text-yellow-200">₹{devotee.amount}</span>
             <span className="text-white/80 text-sm">for</span>
             <span className="font-serif italic">{devotee.sevaName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

