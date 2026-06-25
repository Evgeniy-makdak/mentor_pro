import React, { useState, useEffect } from 'react';
import { Table, Select, Button, Card, Typography, Space, Tag, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import api from '../../api';

const { Title, Text } = Typography;

function ReportsPage() {
  const [groups, setGroups] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedDiscipline, setSelectedDiscipline] = useState(null);
  const [report, setReport] = useState([]);
  const [matrix, setMatrix] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    Promise.all([
      api.getGroups().then(r => setGroups(r.data)),
      api.getDisciplines().then(r => setDisciplines(r.data))
    ]);
  }, []);

  const handleGroupReport = async () => {
    if (!selectedGroup) return;
    setLoading(true);
    try {
      const res = await api.getGroupReport(selectedGroup);
      setReport(res.data);
      setMatrix(null);
    } catch {
      message.error('Ошибка загрузки отчёта');
    } finally {
      setLoading(false);
    }
  };

  const handleDisciplineReport = async () => {
    if (!selectedDiscipline) return;
    setLoading(true);
    try {
      const res = await api.getDisciplineReport(selectedDiscipline);
      setMatrix(res.data);
      setReport([]);
    } catch {
      message.error('Ошибка загрузки отчёта');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!selectedDiscipline) return;
    try {
      const res = await api.exportDisciplineReport(selectedDiscipline);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${selectedDiscipline}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      message.error('Ошибка экспорта');
    }
  };

  const gradeColor = (g) => {
    if (g >= 5) return 'green';
    if (g >= 4) return 'blue';
    if (g >= 3) return 'orange';
    return 'red';
  };

  return (
    <div className="reports-page">
      <Title level={4}>Отчёты</Title>

      <Card style={{ marginBottom: 16 }}>
        <Title level={5}>Отчёт по группе</Title>
        <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: '100%' }}>
          <Select 
            placeholder="Выберите группу" 
            style={{ width: isMobile ? '100%' : 250 }}
            value={selectedGroup} onChange={setSelectedGroup}
            options={groups.map(g => ({ value: g.id, label: g.name }))}
          />
          <Button type="primary" onClick={handleGroupReport} loading={loading} block={isMobile}>
            Сформировать
          </Button>
        </Space>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Title level={5}>Отчёт по дисциплине (матрица успеваемости)</Title>
        <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: '100%' }}>
          <Select 
            placeholder="Выберите дисциплину" 
            style={{ width: isMobile ? '100%' : 250 }}
            value={selectedDiscipline} onChange={setSelectedDiscipline}
            options={disciplines.map(d => ({ value: d.id, label: d.name }))}
          />
          <Button type="primary" onClick={handleDisciplineReport} loading={loading} block={isMobile}>
            Сформировать
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport} block={isMobile}>
            Экспорт CSV
          </Button>
        </Space>
      </Card>

      {report.length > 0 && (
        <Card title="Отчёт по группе">
          {report.map(item => (
            <div key={item.student.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
              <Title level={5}>{item.student.full_name} ({item.student.login})</Title>
              <Space direction="vertical" size="small">
                {item.disciplines.map(d => (
                  <div key={d.discipline_id}>
                    <Text strong>{d.discipline_name}:</Text>{' '}
                    {d.avgGrade ? <Tag color={gradeColor(d.avgGrade)}>{d.avgGrade.toFixed(1)} ({d.testsCompleted} тестов)</Tag> : 'Нет оценок'}
                  </div>
                ))}
              </Space>
            </div>
          ))}
        </Card>
      )}

      {matrix && (
        <Card title="Матрица успеваемости">
          <Text strong>Дисциплина: {matrix.discipline.name}</Text>
          <Table
            dataSource={matrix.matrix}
            rowKey={(r) => r.student.id}
            size="small"
            pagination={false}
            columns={[
              { title: 'Студент', dataIndex: ['student', 'full_name'], key: 'name' },
              { title: 'Группа', dataIndex: ['student', 'group_name'], key: 'group' },
              ...matrix.matrix[0]?.lectures.map((l, i) => ({
                title: `Лекция ${i + 1}`,
                key: `lecture_${i}`,
                render: (record) => {
                  const attempt = record.lectures[i]?.attempt;
                  if (!attempt) return '—';
                  return <Tag color={gradeColor(attempt.grade)}>{attempt.grade} ({attempt.percentage}%)</Tag>;
                }
              })) || []
            ]}
          />
        </Card>
      )}
    </div>
  );
}

export default ReportsPage;
