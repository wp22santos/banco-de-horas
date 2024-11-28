import React from 'react';
import { Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { CalendarOutlined, ClockCircleOutlined, LineChartOutlined } from '@ant-design/icons';

const Navigation: React.FC = () => {
  const location = useLocation();
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.floor((new Date().getMonth() / 3)) + 1;

  return (
    <Menu
      mode="horizontal"
      selectedKeys={[location.pathname]}
      style={{ marginBottom: '20px' }}
    >
      <Menu.Item key="/" icon={<CalendarOutlined />}>
        <Link to="/">Calendário</Link>
      </Menu.Item>
      
      <Menu.Item key="/timesheet" icon={<ClockCircleOutlined />}>
        <Link to="/timesheet">Ponto</Link>
      </Menu.Item>

      <Menu.SubMenu 
        key="reports" 
        icon={<LineChartOutlined />} 
        title="Relatórios"
      >
        <Menu.Item key={`/quarter/${currentYear}/${currentQuarter}`}>
          <Link to={`/quarter/${currentYear}/${currentQuarter}`}>
            Trimestre Atual
          </Link>
        </Menu.Item>
      </Menu.SubMenu>
    </Menu>
  );
};

export default Navigation;
