import React from 'react';
import { useQuarterData } from '../hooks/useQuarterData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, Typography, Spin, Alert, Table } from 'antd';
import { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

interface QuarterViewProps {
  quarter: number;
  year: number;
}

interface MonthData {
  month: number;
  workingDays: number;
  totalHours: number;
  expectedHours: number;
  balance: number;
}

const QuarterView: React.FC<QuarterViewProps> = ({ quarter, year }) => {
  const { loading, error, data } = useQuarterData(quarter, year);

  if (loading) {
    return <Spin size="large" />;
  }

  if (error) {
    return <Alert type="error" message={error.message} />;
  }

  if (!data) {
    return <Alert type="warning" message="Nenhum dado encontrado para este trimestre." />;
  }

  const monthsData: MonthData[] = Object.entries(data.months).map(([monthStr, monthData]) => {
    const month = parseInt(monthStr);
    const expectedHours = monthData.workingDays * 8; // 8 horas por dia útil
    return {
      month,
      workingDays: monthData.workingDays,
      totalHours: monthData.totalHours,
      expectedHours,
      balance: monthData.totalHours - expectedHours
    };
  });

  const columns: ColumnsType<MonthData> = [
    {
      title: 'Mês',
      dataIndex: 'month',
      key: 'month',
      render: (month: number) => format(new Date(year, month - 1, 1), 'MMMM', { locale: ptBR })
    },
    {
      title: 'Dias Úteis',
      dataIndex: 'workingDays',
      key: 'workingDays',
    },
    {
      title: 'Horas Previstas',
      dataIndex: 'expectedHours',
      key: 'expectedHours',
      render: (hours: number) => `${hours.toFixed(1)}h`
    },
    {
      title: 'Horas Trabalhadas',
      dataIndex: 'totalHours',
      key: 'totalHours',
      render: (hours: number) => `${hours.toFixed(1)}h`
    },
    {
      title: 'Saldo',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance: number) => {
        const color = balance < 0 ? '#ff4d4f' : '#52c41a';
        return <span style={{ color }}>{`${balance.toFixed(1)}h`}</span>;
      }
    }
  ];

  const totalExpectedHours = monthsData.reduce((acc, month) => acc + month.expectedHours, 0);
  const totalBalance = data.totalHours - totalExpectedHours;

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        {`${quarter}º Trimestre de ${year}`}
      </Title>

      <div style={{ marginBottom: '24px' }}>
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div>
              <Typography.Text type="secondary">Total de Dias Úteis</Typography.Text>
              <Typography.Title level={4}>{data.totalWorkingDays}</Typography.Title>
            </div>
            <div>
              <Typography.Text type="secondary">Total de Horas Previstas</Typography.Text>
              <Typography.Title level={4}>{`${totalExpectedHours.toFixed(1)}h`}</Typography.Title>
            </div>
            <div>
              <Typography.Text type="secondary">Total de Horas Trabalhadas</Typography.Text>
              <Typography.Title level={4}>{`${data.totalHours.toFixed(1)}h`}</Typography.Title>
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <Typography.Text type="secondary">Saldo Total do Trimestre</Typography.Text>
            <Typography.Title 
              level={4} 
              style={{ color: totalBalance < 0 ? '#ff4d4f' : '#52c41a' }}
            >
              {`${totalBalance.toFixed(1)}h`}
            </Typography.Title>
          </div>
        </Card>
      </div>

      <Table 
        columns={columns} 
        dataSource={monthsData} 
        rowKey="month"
        pagination={false}
        bordered
      />
    </div>
  );
};

export default QuarterView;
