'use client';

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

interface Member {
  correctPicks: number;
  id: string;
  isCurrentUser?: boolean;
  name: string;
  rank: number;
  totalPicks: number;
}

interface StandingsChartProps {
  members: Member[];
}

const generateChartData = (members: Member[]) => {
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
  return weeks.map((week, index) => {
    const data: Record<string, number | string> = { week };
    members.slice(0, 4).forEach((member) => {
      const progress = (index + 1) / weeks.length;
      const baseScore = Math.round(member.correctPicks * progress);
      const variance = Math.floor(Math.random() * 3) - 1;
      data[member.id] = Math.max(0, baseScore + variance);
    });
    return data;
  });
};

export function StandingsChart({ members }: StandingsChartProps) {
  const chartData = generateChartData(members);
  const topMembers = members.slice(0, 4);

  const chartConfig: ChartConfig = {
    '1': {
      color: 'hsl(12, 70%, 45%)',
      label: topMembers[0]?.name || 'Player 1',
    },
    '2': {
      color: 'hsl(35, 50%, 55%)',
      label: topMembers[1]?.name || 'Player 2',
    },
    '3': {
      color: 'hsl(30, 40%, 40%)',
      label: topMembers[2]?.name || 'Player 3',
    },
    '4': {
      color: 'hsl(35, 30%, 65%)',
      label: topMembers[3]?.name || 'Player 4',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Season Progress</CardTitle>
        <CardDescription>Top 4 players over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-[250px] w-full" config={chartConfig}>
          <LineChart data={chartData} margin={{ bottom: 5, left: 0, right: 10, top: 5 }}>
            <CartesianGrid className="stroke-border" strokeDasharray="3 3" />
            <XAxis axisLine={false} dataKey="week" fontSize={12} tickLine={false} tickMargin={8} />
            <YAxis axisLine={false} fontSize={12} tickLine={false} tickMargin={8} width={30} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {topMembers.map((member) => (
              <Line
                activeDot={{ r: 4, strokeWidth: 0 }}
                dataKey={member.id}
                dot={false}
                key={member.id}
                name={member.name}
                stroke={chartConfig[member.id as keyof typeof chartConfig]?.color || 'hsl(var(--primary))'}
                strokeWidth={member.isCurrentUser ? 3 : 2}
                type="monotone"
              />
            ))}
          </LineChart>
        </ChartContainer>
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          {topMembers.map((member) => (
            <div className="flex items-center gap-2 text-sm" key={member.id}>
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: chartConfig[member.id as keyof typeof chartConfig]?.color }}
              />
              <span className={member.isCurrentUser ? 'font-medium' : ''}>{member.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
