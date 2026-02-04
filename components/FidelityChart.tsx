
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
    <div className="h-48 w-48 relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={0}
            dataKey="value"
            startAngle={90}
            endAngle={450}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-800">{score}%</span>
        <span className="text-xs text-slate-500 uppercase font-semibold">匹配度</span>
      </div>
    </div>
  );
};
