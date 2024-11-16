import React, { useEffect, useState } from 'react';
import { ref, set, onValue, remove } from 'firebase/database';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Shield, Users, Calendar, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Community {
  id: string;
  name: string;
  maxCapacity: number;
  countries: string[];
}

interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
}

export function AdminDashboard() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', description: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // Fetch admin status
      const adminRef = ref(db, `admins/${user.uid}`);
      onValue(adminRef, (snapshot) => {
        if (!snapshot.exists()) {
          toast.error('Unauthorized access');
          window.location.href = '/';
        }
      });

      // Fetch communities
      const communitiesRef = ref(db, 'communities');
      const unsubscribeCommunities = onValue(communitiesRef, (snapshot) => {
        if (snapshot.exists()) {
          const communitiesData = Object.entries(snapshot.val()).map(([id, data]) => ({
            id,
            ...(data as Omit<Community, 'id'>),
          }));
          setCommunities(communitiesData);
        }
      });

      // Fetch events
      const eventsRef = ref(db, 'events');
      const unsubscribeEvents = onValue(eventsRef, (snapshot) => {
        if (snapshot.exists()) {
          const eventsData = Object.entries(snapshot.val()).map(([id, data]) => ({
            id,
            ...(data as Omit<Event, 'id'>),
          }));
          setEvents(eventsData);
        }
      });

      return () => {
        unsubscribeCommunities();
        unsubscribeEvents();
      };
    }
  }, [user]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const eventRef = ref(db, `events/${Date.now()}`);
      await set(eventRef, newEvent);
      setNewEvent({ title: '', date: '', description: '' });
      toast.success('Event added successfully');
    } catch (error) {
      toast.error('Failed to add event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await remove(ref(db, `events/${eventId}`));
      toast.success('Event deleted successfully');
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center space-x-2 mb-8">
        <Shield className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Communities Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Users className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Communities</h2>
          </div>

          <div className="space-y-4">
            {communities.map((community) => (
              <div key={community.id} className="border-b border-gray-200 pb-4 last:border-0">
                <h3 className="font-medium text-gray-900">{community.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Capacity: {community.maxCapacity} delegates
                </p>
                <p className="text-sm text-gray-600">
                  Countries: {community.countries.length}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Event Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Events</h2>
          </div>

          <form onSubmit={handleAddEvent} className="mb-6">
            <Input
              label="Event Title"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              required
            />
            <Input
              label="Date"
              type="date"
              value={newEvent.date}
              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              required
            />
            <Input
              label="Description"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              required
            />
            <Button type="submit" isLoading={isLoading}>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </form>

          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="flex justify-between items-start border-b border-gray-200 pb-4 last:border-0">
                <div>
                  <h3 className="font-medium text-gray-900">{event.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{event.date}</p>
                  <p className="text-sm text-gray-600 mt-2">{event.description}</p>
                </div>
                <button
                  onClick={() => handleDeleteEvent(event.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}