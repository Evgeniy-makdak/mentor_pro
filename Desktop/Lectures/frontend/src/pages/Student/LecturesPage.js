import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Button, Empty, Collapse, message } from 'antd';
import { BookOutlined, FilePdfOutlined, FileImageOutlined, VideoCameraOutlined, FileZipOutlined } from '@ant-design/icons';
import api, { getFileUrl } from '../../api';

const { Title, Text } = Typography;

const fileIcons = {
  'application/pdf': <FilePdfOutlined style={{ color: '#ff4d4f' }} />,
  'image/jpeg': <FileImageOutlined style={{ color: '#1890ff' }} />,
  'image/png': <FileImageOutlined style={{ color: '#1890ff' }} />,
  'video/mp4': <VideoCameraOutlined style={{ color: '#722ed1' }} />,
  'application/zip': <FileZipOutlined style={{ color: '#faad14' }} />,
  'application/x-zip-compressed': <FileZipOutlined style={{ color: '#faad14' }} />,
};

function StudentLecturesPage() {
  const { disciplineId } = useParams();
  const navigate = useNavigate();
  const [disciplines, setDisciplines] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState(disciplineId);
  const [loading, setLoading] = useState(false);

  const fetchDisciplines = async () => {
    try {
      const res = await api.getDisciplines();
      setDisciplines(res.data);
    } catch {
      // ignore
    }
  };

  const fetchLectures = async (discId) => {
    if (!discId) return;
    setLoading(true);
    try {
      const res = await api.getLectures(discId);
      setLectures(res.data);
    } catch {
      message.error('Ошибка загрузки лекций');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisciplines();
  }, []);

  useEffect(() => {
    if (selectedDiscipline) {
      fetchLectures(selectedDiscipline);
    }
  }, [selectedDiscipline]);

  const handleDisciplineChange = (val) => {
    setSelectedDiscipline(val);
    navigate(val ? `/student/lectures/${val}` : '/student');
  };

  const getFileInfo = (m) => {
    const icon = fileIcons[m.file_type] || <BookOutlined />;
    return { icon, name: m.file_name };
  };

  return (
    <div className="student-lectures-page">
      <Title level={4}>Лекции</Title>
      {disciplines.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <select
            value={selectedDiscipline || ''}
            onChange={(e) => handleDisciplineChange(e.target.value || undefined)}
            style={{ padding: '8px 12px', fontSize: 14, borderRadius: 4, border: '1px solid #d9d9d9', width: 300 }}
          >
            <option value="">Выберите дисциплину</option>
            {disciplines.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <Text>Загрузка...</Text>
      ) : selectedDiscipline && lectures.length === 0 ? (
        <Empty description="Лекций пока нет" />
      ) : (
        <Collapse accordion>
          {lectures.map(lecture => (
            <Collapse.Panel
              key={lecture.id}
              header={
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>{lecture.title}</span>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {lecture.materials?.length || 0} материалов{lecture.test ? ' • Тест' : ''}
                  </Text>
                </div>
              }
            >
              {lecture.description && <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>{lecture.description}</Text>}
              
              {lecture.materials && lecture.materials.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ display: 'block', marginBottom: 10, fontSize: 15, color: '#333' }}>Материалы:</Text>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {lecture.materials.map(m => {
                      const { icon, name } = getFileInfo(m);
                      return (
                        <a
                          key={m.id}
                          href={getFileUrl(`/api/materials/${m.id}/download`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 12px',
                            background: '#f5f5f5',
                            borderRadius: 6,
                            textDecoration: 'none',
                            color: '#333',
                            fontSize: 14,
                            flex: '1 1 calc(50% - 4px)',
                            minWidth: 0,
                            boxSizing: 'border-box'
                          }}
                        >
                          {icon}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {name}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {lecture.test && (
                <Button type="primary" onClick={() => navigate(`/student/lecture/${lecture.id}`)}>
                  Перейти к лекции и тесту
                </Button>
              )}
            </Collapse.Panel>
          ))}
        </Collapse>
      )}
    </div>
  );
}

export default StudentLecturesPage;
