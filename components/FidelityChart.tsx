
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface FidelityChartProps {
  score: number;
}

export const FidelityChart: React.FC<FidelityChartProps> = ({ score }) => {
  const data = [
    { name: '还原度', value: score },
    { name: '差异', value: 100 - score },
  ];

  const COLORS = ['#6366f1', '#e2e8f0'];

  return (
    <div className="h-56 w-56 relative flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={85}
            paddingAngle={0}
            dataKey="value"
            startAngle={90}
            endAngle={450}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-4xl font-black text-slate-800 leading-none">{score}%</span>
        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">还原度得分</span>
      </div>
    </div>
  );
};
