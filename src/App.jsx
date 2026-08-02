import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ParticipantsBar from './components/ParticipantsBar';
import CalendarView from './components/CalendarView';
import DateModal from './components/DateModal';
import AvailableDatesList from './components/AvailableDatesList';
import AdminPanel from './components/AdminPanel';
import ShareModal from './components/ShareModal';
import CreateCalendarModal from './components/CreateCalendarModal';

import {
  getStoredCalendars,
  saveStoredCalendars,
  getActiveCalendarId,
  setActiveCalendarId,
  createNewCalendar,
  importCalendarsJSON
} from './utils/storage';

export default function App() {
  const [calendars, setCalendars] = useState(() => getStoredCalendars());
  const [activeCalendarId, setActiveCalIdState] = useState(() => getActiveCalendarId(getStoredCalendars()));

  const [selectedDate, setSelectedDate] = useState(null);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Sync to localStorage on calendars change
  useEffect(() => {
    saveStoredCalendars(calendars);
  }, [calendars]);

  // Active calendar object
  const activeCalendar = calendars.find(c => c.id === activeCalendarId) || calendars[0] || null;

  const handleSelectCalendar = (id) => {
    setActiveCalIdState(id);
    setActiveCalendarId(id);
  };

  const handleSelectDate = (dateStr) => {
    setSelectedDate(dateStr);
    setIsDateModalOpen(true);
  };

  // Availability CRUD handlers
  const handleSaveAvailability = (dateStr, participantId, note) => {
    if (!activeCalendar) return;

    const existingAvailabilities = activeCalendar.availabilities || [];
    // Check if participant already has entry on dateStr
    const index = existingAvailabilities.findIndex(
      e => e.date === dateStr && e.participantId === participantId
    );

    let updatedAvailabilities = [...existingAvailabilities];
    if (index >= 0) {
      // Update existing entry
      updatedAvailabilities[index] = {
        ...updatedAvailabilities[index],
        note,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Add new entry
      updatedAvailabilities.push({
        id: 'a_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        date: dateStr,
        participantId,
        note,
        updatedAt: new Date().toISOString()
      });
    }

    const updatedCalendar = {
      ...activeCalendar,
      availabilities: updatedAvailabilities,
      updatedAt: new Date().toISOString()
    };

    setCalendars(calendars.map(c => c.id === updatedCalendar.id ? updatedCalendar : c));
  };

  const handleDeleteAvailability = (dateStr, participantId) => {
    if (!activeCalendar) return;

    const updatedAvailabilities = (activeCalendar.availabilities || []).filter(
      e => !(e.date === dateStr && e.participantId === participantId)
    );

    const updatedCalendar = {
      ...activeCalendar,
      availabilities: updatedAvailabilities,
      updatedAt: new Date().toISOString()
    };

    setCalendars(calendars.map(c => c.id === updatedCalendar.id ? updatedCalendar : c));
  };

  // Calendar Admin handlers
  const handleSaveAdminCalendar = (updatedCal) => {
    setCalendars(calendars.map(c => c.id === updatedCal.id ? updatedCal : c));
  };

  const handleDeleteCalendar = (id) => {
    const remaining = calendars.filter(c => c.id !== id);
    if (remaining.length === 0) {
      // Create new default if all deleted
      const newCal = createNewCalendar('기본 모임 달력');
      setCalendars([newCal]);
      handleSelectCalendar(newCal.id);
    } else {
      setCalendars(remaining);
      handleSelectCalendar(remaining[0].id);
    }
  };

  const handleCreateCalendar = (title, description, participants) => {
    const newCal = createNewCalendar(title, description, participants);
    setCalendars([newCal, ...calendars]);
    handleSelectCalendar(newCal.id);
  };

  const handleImportData = (jsonStr) => {
    const imported = importCalendarsJSON(jsonStr);
    setCalendars(imported);
    if (imported.length > 0) {
      handleSelectCalendar(imported[0].id);
    }
  };

  return (
    <div className="app-container">
      {/* Header with Title & Calendar Selector & Actions */}
      <Header
        calendars={calendars}
        activeCalendar={activeCalendar}
        onSelectCalendar={handleSelectCalendar}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenCreateModal={() => setIsCreateOpen(true)}
      />

      {/* Participants Summary Chip Bar */}
      <ParticipantsBar
        calendar={activeCalendar}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Main Interactive Monthly Calendar View */}
      <CalendarView
        calendar={activeCalendar}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
      />

      {/* Bottom Summary List: All Available Dates & Partial Match */}
      <AvailableDatesList
        calendar={activeCalendar}
        onSelectDate={handleSelectDate}
      />

      {/* Date Layer Popup Modal */}
      {isDateModalOpen && (
        <DateModal
          dateStr={selectedDate}
          calendar={activeCalendar}
          onSaveAvailability={handleSaveAvailability}
          onDeleteAvailability={handleDeleteAvailability}
          onClose={() => setIsDateModalOpen(false)}
        />
      )}

      {/* Admin Panel Modal */}
      {isAdminOpen && activeCalendar && (
        <AdminPanel
          calendar={activeCalendar}
          onSaveCalendar={handleSaveAdminCalendar}
          onDeleteCalendar={handleDeleteCalendar}
          onClose={() => setIsAdminOpen(false)}
        />
      )}

      {/* Share & Backup Modal */}
      {isShareOpen && (
        <ShareModal
          calendar={activeCalendar}
          allCalendars={calendars}
          onImportData={handleImportData}
          onClose={() => setIsShareOpen(false)}
        />
      )}

      {/* Create New Calendar Modal */}
      {isCreateOpen && (
        <CreateCalendarModal
          onCreateCalendar={handleCreateCalendar}
          onClose={() => setIsCreateOpen(false)}
        />
      )}
    </div>
  );
}
