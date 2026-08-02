const STORAGE_KEY = 'gather_calendars_data_v1';
const ACTIVE_CAL_KEY = 'gather_active_calendar_id';

// Default initial sample data if localStorage is empty
const INITIAL_CALENDARS = [
  {
    id: 'cal_summer_vacation',
    title: '🏝️ 8월 여름휴가 친목 모임',
    description: '친구들과 함께 떠나는 여름 휴가 및 계곡 사모임 일정 조율',
    createdAt: new Date().toISOString(),
    participants: [
      { id: 'p1', name: '김민준', color: '#EF4444' }, // Red
      { id: 'p2', name: '이서연', color: '#3B82F6' }, // Blue
      { id: 'p3', name: '박도현', color: '#10B981' }, // Green
      { id: 'p4', name: '최지아', color: '#EC4899' }, // Pink
      { id: 'p5', name: '정현우', color: '#8B5CF6' }  // Purple
    ],
    availabilities: [
      // 2026-08-08 (Sat) - All 5 available!
      { id: 'a1', date: '2026-08-08', participantId: 'p1', note: '주말 전일 가능' },
      { id: 'a2', date: '2026-08-08', participantId: 'p2', note: '차량 운전 가능' },
      { id: 'a3', date: '2026-08-08', participantId: 'p3', note: '오후 1시 이후 환영' },
      { id: 'a4', date: '2026-08-08', participantId: 'p4', note: '상관없음!' },
      { id: 'a5', date: '2026-08-08', participantId: 'p5', note: '참석 가능' },

      // 2026-08-15 (Sat) - All 5 available!
      { id: 'a6', date: '2026-08-15', participantId: 'p1', note: '광복절 공휴일 가능' },
      { id: 'a7', date: '2026-08-15', participantId: 'p2', note: '펜션 예약 당번' },
      { id: 'a8', date: '2026-08-15', participantId: 'p3', note: '콜!' },
      { id: 'a9', date: '2026-08-15', participantId: 'p4', note: '좋습니다' },
      { id: 'a10', date: '2026-08-15', participantId: 'p5', note: '참석 무조건!' },

      // 2026-08-22 (Sat) - 4 available
      { id: 'a11', date: '2026-08-22', participantId: 'p1', note: '가능' },
      { id: 'a12', date: '2026-08-22', participantId: 'p2', note: '가능' },
      { id: 'a13', date: '2026-08-22', participantId: 'p3', note: '가능' },
      { id: 'a14', date: '2026-08-22', participantId: 'p4', note: '오후만 가능' },

      // 2026-08-29 (Sat) - 3 available
      { id: 'a15', date: '2026-08-29', participantId: 'p1', note: '가능' },
      { id: 'a16', date: '2026-08-29', participantId: 'p3', note: '가능' },
      { id: 'a17', date: '2026-08-29', participantId: 'p5', note: '가능' }
    ]
  },
  {
    id: 'cal_hiking_club',
    title: '⛰️ 9월 주말 등산 및 맛집 탐방 모임',
    description: '가을산 등산 후 뒤풀이 맛집 탐방 일정',
    createdAt: new Date().toISOString(),
    participants: [
      { id: 'hp1', name: '강동원', color: '#F97316' },
      { id: 'hp2', name: '한소희', color: '#06B6D4' },
      { id: 'hp3', name: '송중기', color: '#6366F1' }
    ],
    availabilities: [
      { id: 'ha1', date: '2026-09-05', participantId: 'hp1', note: '아침 일찍 출발 선호' },
      { id: 'ha2', date: '2026-09-05', participantId: 'hp2', note: '등산화 준비됨' },
      { id: 'ha3', date: '2026-09-05', participantId: 'hp3', note: '참석 가능!' }
    ]
  }
];

export function getStoredCalendars() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CALENDARS));
      return INITIAL_CALENDARS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_CALENDARS;
  } catch (e) {
    console.error('Failed to load calendars from localStorage', e);
    return INITIAL_CALENDARS;
  }
}

export function saveStoredCalendars(calendars) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(calendars));
  } catch (e) {
    console.error('Failed to save calendars to localStorage', e);
  }
}

export function getActiveCalendarId(calendars) {
  // Check URL parameters first (e.g. ?cal=ID)
  const urlParams = new URLSearchParams(window.location.search);
  const calParam = urlParams.get('cal');
  if (calParam && calendars.some(c => c.id === calParam)) {
    return calParam;
  }

  const savedId = localStorage.getItem(ACTIVE_CAL_KEY);
  if (savedId && calendars.some(c => c.id === savedId)) {
    return savedId;
  }

  return calendars[0]?.id || null;
}

export function setActiveCalendarId(id) {
  localStorage.setItem(ACTIVE_CAL_KEY, id);
  // Update URL without page reload
  const url = new URL(window.location.href);
  url.searchParams.set('cal', id);
  window.history.replaceState({}, '', url.toString());
}

export function createNewCalendar(title, description, participants) {
  const newCal = {
    id: 'cal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    title: title || '새 모임 달력',
    description: description || '',
    createdAt: new Date().toISOString(),
    participants: participants && participants.length > 0 ? participants : [
      { id: 'p_' + Date.now() + '_1', name: '참여자 1', color: '#EF4444' },
      { id: 'p_' + Date.now() + '_2', name: '참여자 2', color: '#3B82F6' }
    ],
    availabilities: []
  };
  return newCal;
}

export function exportCalendarsJSON(calendars) {
  return JSON.stringify(calendars, null, 2);
}

export function importCalendarsJSON(jsonStr) {
  const parsed = JSON.parse(jsonStr);
  if (!Array.isArray(parsed)) throw new Error('올바른 달력 데이터 배열 형식이 아닙니다.');
  return parsed;
}
