import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, MessageSquare, Save, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { addBookingNote, deleteBookingNote, useBookingNotes } from '../../lib/bookingNotes';
import type { BookingNote } from '../../types/booking';

interface BookingNotesProps {
  bookingId: string;
}

const BookingNotes: React.FC<BookingNotesProps> = ({ bookingId }) => {
  const { notes, loading, error } = useBookingNotes(bookingId);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setSaving(true);
    try {
      await addBookingNote(bookingId, newNote);
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa nota?')) return;

    try {
      await deleteBookingNote(bookingId, noteId);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin text-[--theater-gold]">⌛</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <MessageSquare className="text-[--theater-gold]" />
          Note
        </h3>
        <span className="text-sm text-gray-400">
          {notes.length} {notes.length === 1 ? 'nota' : 'note'}
        </span>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Aggiungi una nota..."
          className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-white"
        />
        <button
          onClick={handleAddNote}
          disabled={!newNote.trim() || saving}
          className="flex items-center gap-2 px-4 py-2 bg-[--theater-gold] text-black rounded hover:bg-yellow-500 disabled:opacity-50"
        >
          {saving ? (
            <span className="animate-spin">⌛</span>
          ) : (
            <Plus size={20} />
          )}
          Aggiungi
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {notes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-gray-700 rounded-lg p-4"
            >
              <div className="flex justify-between items-start gap-4">
                <p className="text-white">{note.content}</p>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="p-1 text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <User size={14} />
                  <span>{note.createdBy}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{format(note.createdAt, 'dd MMM yyyy HH:mm', { locale: it })}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {notes.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            Nessuna nota presente
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingNotes;